import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema, insertWeeklyProcessingSchema } from "@shared/schema";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/csv' || 
        file.originalname.toLowerCase().endsWith('.csv') || 
        file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Acceptăm doar fișiere PDF și CSV'), false);
    }
  }
});

// Parse PDF invoices
async function parsePdfInvoice(buffer: Buffer): Promise<any[]> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    const text = data.text;
    
    // Extract invoice data from PDF text
    const invoiceData = [];
    const lines = text.split('\n');
    
    let currentInvoiceType = '';
    let isInDetailsSection = false;
    
    // Detect invoice type (7 days vs 30 days) based on payment terms
    if (text.includes('Net 7') || text.includes('Pay term                     Net 7')) {
      currentInvoiceType = '7_days';
    } else if (text.includes('Net 30') || text.includes('Pay term                     Net 30')) {
      currentInvoiceType = '30_days';
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for section markers
      if (line.includes('DETAILS')) {
        isInDetailsSection = true;
        continue;
      }
      
      // Skip if not in details section
      if (!isInDetailsSection) continue;
      
      // Look for Load/Trip IDs and amounts
      // Pattern for loads: starts with numbers/letters followed by EUR amount
      const loadMatch = line.match(/^([A-Z0-9]{8,})\s+.*€([\d,]+\.[\d]{2})/);
      if (loadMatch) {
        const [, loadId, amount] = loadMatch;
        invoiceData.push({
          'Tour ID': loadId,
          'Load ID': loadId,
          'Gross Pay Amt (Excl. Tax)': amount.replace(',', ''),
          'Invoice Type': currentInvoiceType
        });
        continue;
      }
      
      // Alternative pattern: Trip/Load ID at beginning of line with amount
      const tripMatch = line.match(/^(T-[A-Z0-9]+|[A-Z0-9]{8,})\s+.*€([\d,]+\.[\d]{2})/);
      if (tripMatch) {
        const [, tripId, amount] = tripMatch;
        invoiceData.push({
          'Tour ID': tripId,
          'Load ID': tripId,
          'Gross Pay Amt (Excl. Tax)': amount.replace(',', ''),
          'Invoice Type': currentInvoiceType
        });
        continue;
      }
      
      // Look for standalone amounts with context
      const amountMatch = line.match(/€([\d,]+\.[\d]{2})/);
      if (amountMatch && line.length < 50) {
        const amount = amountMatch[1];
        
        // Look for Load ID in previous lines
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const prevLine = lines[j].trim();
          const idMatch = prevLine.match(/([A-Z0-9]{8,})/);
          if (idMatch) {
            const loadId = idMatch[1];
            invoiceData.push({
              'Tour ID': loadId,
              'Load ID': loadId,
              'Gross Pay Amt (Excl. Tax)': amount.replace(',', ''),
              'Invoice Type': currentInvoiceType
            });
            break;
          }
        }
      }
    }
    
    return invoiceData;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Nu am putut procesa fișierul PDF');
  }
}

// Parse CSV data
function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  }).filter(row => Object.values(row).some(val => val));
}

// Seed initial companies and drivers
async function seedDatabase() {
  try {
    // Check if companies already exist
    const existingCompanies = await storage.getAllCompanies();
    if (existingCompanies.length > 0) {
      return; // Already seeded
    }

    // Create companies with commission rates
    const companies = [
      { name: "Fast Express", commissionRate: "0.02" },
      { name: "Daniel Ontheroad", commissionRate: "0.04" },
      { name: "DE Cargo Speed", commissionRate: "0.04" },
      { name: "Florin Cargo", commissionRate: "0.04" },
      { name: "TRANSVAL SRL", commissionRate: "0.04" },
      { name: "TRANS DUNAREA", commissionRate: "0.04" },
      { name: "TRANS VALI", commissionRate: "0.04" },
      { name: "TRANEXPO", commissionRate: "0.04" },
      { name: "TRANS ELEFANT", commissionRate: "0.04" },
      { name: "EVERTRANS", commissionRate: "0.04" },
    ];

    const createdCompanies = [];
    for (const company of companies) {
      const created = await storage.createCompany(company);
      createdCompanies.push(created);
    }

    // Driver-company mapping
    const driverMappings = [
      { drivers: ["DAVID ZOLTAN", "IOZSI DAVID", "DAVID IOSIF"], company: "Fast Express" },
      { drivers: ["DANIEL OPREAN", "OPREAN DANIEL"], company: "Daniel Ontheroad" },
      { drivers: ["Stefanel"], company: "DE Cargo Speed" },
      { drivers: ["FLORIN OPREAN", "OPREAN FLORIN"], company: "Florin Cargo" },
      { drivers: ["VALENTIN OPREAN", "OPREAN VALENTIN"], company: "TRANSVAL SRL" },
      { drivers: ["DUNAREANU PAUL", "PAUL DUNAREANU"], company: "TRANS DUNAREA" },
      { drivers: ["MOLDOVAN VALENTIN", "VALENTIN MOLDOVAN"], company: "TRANS VALI" },
      { drivers: ["IOAN MOLDOVAN", "MOLDOVAN IOAN"], company: "TRANEXPO" },
      { drivers: ["ELEFANT LUCIAN", "LUCIAN ELEFANT"], company: "TRANS ELEFANT" },
      { drivers: ["VLAD EVERTRANS", "EVERTRANS VLAD"], company: "EVERTRANS" },
    ];

    // Create drivers
    for (const mapping of driverMappings) {
      const company = createdCompanies.find(c => c.name === mapping.company);
      if (company) {
        const primaryName = mapping.drivers[0];
        const nameVariants = mapping.drivers;
        
        await storage.createDriver({
          name: primaryName,
          companyId: company.id,
          nameVariants: nameVariants,
        });
      }
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed database on startup
  await seedDatabase();

  // Company routes
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Driver routes
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  // Weekly processing routes
  app.get("/api/processing/:weekLabel", async (req, res) => {
    try {
      const { weekLabel } = req.params;
      const processing = await storage.getWeeklyProcessing(weekLabel);
      res.json(processing || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processing data" });
    }
  });

  app.post("/api/processing", async (req, res) => {
    try {
      const validatedData = insertWeeklyProcessingSchema.parse(req.body);
      const existing = await storage.getWeeklyProcessing(validatedData.weekLabel);
      
      if (existing) {
        const updated = await storage.updateWeeklyProcessing(validatedData.weekLabel, validatedData);
        res.json(updated);
      } else {
        const created = await storage.createWeeklyProcessing(validatedData);
        res.json(created);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to save processing data" });
    }
  });

  // Payment routes
  app.get("/api/payments", async (req, res) => {
    try {
      const { weekLabel } = req.query;
      
      if (weekLabel) {
        const payments = await storage.getPaymentsByWeek(weekLabel as string);
        res.json(payments);
      } else {
        const payments = await storage.getAllPayments();
        res.json(payments);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      
      // Create history record
      await storage.createPaymentHistoryRecord({
        paymentId: payment.id,
        action: "created",
        previousData: null,
      });
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.put("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Get current payment for history
      const currentPayments = await storage.getAllPayments();
      const currentPayment = currentPayments.find(p => p.id === id);
      
      const updatedPayment = await storage.updatePayment(id, updateData);
      
      // Create history record
      await storage.createPaymentHistoryRecord({
        paymentId: id,
        action: "updated",
        previousData: currentPayment,
      });
      
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get current payment for history
      const currentPayments = await storage.getAllPayments();
      const currentPayment = currentPayments.find(p => p.id === id);
      
      await storage.deletePayment(id);
      
      // Create history record
      if (currentPayment) {
        await storage.createPaymentHistoryRecord({
          paymentId: id,
          action: "deleted",
          previousData: currentPayment,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  // Payment history routes
  app.get("/api/payment-history", async (req, res) => {
    try {
      const { paymentId } = req.query;
      const history = await storage.getPaymentHistory(
        paymentId ? parseInt(paymentId as string) : undefined
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment history" });
    }
  });

  // File upload and processing routes
  app.post("/api/upload-file", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nu a fost încărcat niciun fișier" });
      }

      const { fileType, weekLabel } = req.body;
      
      if (!fileType || !weekLabel) {
        return res.status(400).json({ error: "Tipul fișierului și săptămâna sunt obligatorii" });
      }

      let parsedData: any[] = [];

      if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
        parsedData = await parsePdfInvoice(req.file.buffer);
      } else if (req.file.mimetype === 'text/csv' || req.file.originalname.toLowerCase().endsWith('.csv')) {
        const csvText = req.file.buffer.toString('utf-8');
        parsedData = parseCSV(csvText);
      } else {
        return res.status(400).json({ error: "Format de fișier nesuportat" });
      }

      // Save the processed data
      const existing = await storage.getWeeklyProcessing(weekLabel);
      const updateData: any = {};

      if (fileType === 'trip') {
        updateData.tripDataCount = parsedData.length;
      } else if (fileType === 'invoice7') {
        updateData.invoice7Count = parsedData.length;
      } else if (fileType === 'invoice30') {
        updateData.invoice30Count = parsedData.length;
      }

      // Merge processed data
      const currentProcessedData = existing?.processedData || {};
      currentProcessedData[fileType] = parsedData;
      updateData.processedData = currentProcessedData;

      if (existing) {
        await storage.updateWeeklyProcessing(weekLabel, updateData);
      } else {
        await storage.createWeeklyProcessing({
          weekLabel,
          ...updateData
        });
      }

      res.json({
        success: true,
        recordsProcessed: parsedData.length,
        fileType,
        weekLabel,
        data: parsedData
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: (error as Error).message || "Eroare la procesarea fișierului" });
    }
  });

  // Process transport data
  app.post("/api/process-transport-data", async (req, res) => {
    try {
      const { weekLabel } = req.body;
      
      if (!weekLabel) {
        return res.status(400).json({ error: "Săptămâna este obligatorie" });
      }

      const processing = await storage.getWeeklyProcessing(weekLabel);
      if (!processing || !processing.processedData) {
        return res.status(400).json({ error: "Nu există date procesate pentru această săptămână" });
      }

      const { trip: tripData, invoice7: invoice7Data, invoice30: invoice30Data } = processing.processedData;

      if (!tripData) {
        return res.status(400).json({ error: "Lipsesc datele TRIP" });
      }

      if (!invoice7Data && !invoice30Data) {
        return res.status(400).json({ error: "Lipsesc datele facturilor" });
      }

      // Driver-company mapping from seed data
      const companies = await storage.getAllCompanies();
      const drivers = await storage.getAllDrivers();
      
      const driverCompanyMap: { [key: string]: string } = {};
      drivers.forEach(driver => {
        const company = companies.find(c => c.id === driver.companyId);
        if (company && driver.nameVariants) {
          const variants = Array.isArray(driver.nameVariants) ? driver.nameVariants : [driver.name];
          variants.forEach(variant => {
            driverCompanyMap[variant.toLowerCase()] = company.name;
          });
        }
      });

      const results: any = {};
      const unpairedList: any[] = [];

      const processInvoiceData = (invoiceData: any[], invoiceType: string) => {
        invoiceData.forEach((row, index) => {
          let vrid = '';
          if (row['Tour ID'] && row['Tour ID'].trim()) {
            vrid = row['Tour ID'].trim();
          } else if (row['Load ID'] && row['Load ID'].trim()) {
            vrid = row['Load ID'].trim();
          } else {
            vrid = `UNKNOWN-${index}`;
          }

          const amount = parseFloat(row['Gross Pay Amt (Excl. Tax)'] || 0);
          if (isNaN(amount) || amount === 0) return;

          const tripRecord = tripData.find((trip: any) => 
            trip['Trip ID'] === vrid || trip['VR ID'] === vrid
          );

          let company = 'Unmatched';
          if (tripRecord && tripRecord['Driver']) {
            const driverName = tripRecord['Driver'].toLowerCase();
            for (const [variant, companyName] of Object.entries(driverCompanyMap)) {
              if (driverName.includes(variant) || variant.includes(driverName)) {
                company = companyName;
                break;
              }
            }
            
            if (company === 'Unmatched') {
              unpairedList.push({
                vrid,
                amount,
                type: invoiceType,
                reason: `Șofer negăsit: ${tripRecord['Driver']}`,
                driver: tripRecord['Driver']
              });
            }
          } else {
            unpairedList.push({
              vrid,
              amount,
              type: invoiceType,
              reason: 'VRID nu există în datele TRIP',
              driver: null
            });
          }

          if (!results[company]) {
            results[company] = {
              Total_7_days: 0,
              Total_30_days: 0,
              Total_comision: 0,
              VRID_details: {}
            };
          }

          const companyData = companies.find(c => c.name === company);
          const commissionRate = companyData ? parseFloat(companyData.commissionRate.toString()) : 0.04;
          const commission = amount * commissionRate;

          if (invoiceType === '7_days') {
            results[company].Total_7_days += amount;
          } else {
            results[company].Total_30_days += amount;
          }
          
          results[company].Total_comision += commission;

          if (!results[company].VRID_details[vrid]) {
            results[company].VRID_details[vrid] = {
              '7_days': 0,
              '30_days': 0,
              'commission': 0
            };
          }

          results[company].VRID_details[vrid][invoiceType] = amount;
          results[company].VRID_details[vrid].commission += commission;
        });
      };

      if (invoice7Data) {
        processInvoiceData(invoice7Data, '7_days');
      }

      if (invoice30Data) {
        processInvoiceData(invoice30Data, '30_days');
      }

      // Update processing with results
      await storage.updateWeeklyProcessing(weekLabel, {
        processedData: {
          ...processing.processedData,
          results,
          unpairedList
        }
      });

      res.json({
        success: true,
        results,
        unpairedList,
        weekLabel
      });

    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ error: "Eroare la procesarea datelor" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
