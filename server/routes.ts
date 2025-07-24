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
    console.log(`Multer fileFilter - File: ${file.originalname}, Mimetype: ${file.mimetype}`);
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/csv' || 
        file.originalname.toLowerCase().endsWith('.csv') || 
        file.originalname.toLowerCase().endsWith('.pdf')) {
      console.log('File accepted by filter');
      cb(null, true);
    } else {
      console.log('File rejected by filter');
      cb(new Error('Acceptăm doar fișiere PDF și CSV'), false);
    }
  }
});

// Simple PDF parser for text extraction from invoices
async function parsePdfInvoice(buffer: Buffer): Promise<any[]> {
  try {
    // For now, we'll create a mock parser that simulates PDF processing
    // This allows testing of the UI and workflow while we implement proper PDF parsing
    console.log('PDF upload detected, processing...');
    
    // Extract basic info from buffer metadata if possible
    const pdfString = buffer.toString('latin1');
    
    // Check for payment terms to determine invoice type
    let currentInvoiceType = '30_days'; // Default
    if (pdfString.includes('Net 7') || pdfString.includes('Pay term Net 7')) {
      currentInvoiceType = '7_days';
    } else if (pdfString.includes('Net 30') || pdfString.includes('Pay term Net 30')) {
      currentInvoiceType = '30_days';
    }
    
    // Extract Tour IDs and amounts from PDF text
    const invoiceData: any[] = [];
    
    // Parse PDF text to extract actual data
    const lines = pdfString.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentTourId = '';
    let currentAmount = '';
    
    console.log('Analyzing PDF content for Tour IDs and amounts...');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for Tour ID patterns (typically alphanumeric codes like 1157X9TXR)
      const tourIdMatch = line.match(/\b([A-Z0-9]{7,10})\b/);
      if (tourIdMatch && !line.includes('$') && !line.includes('€') && !line.includes('.')) {
        currentTourId = tourIdMatch[1];
      }
      
      // Look for amount patterns (numbers with decimals, possibly with currency symbols)
      const amountMatch = line.match(/(\d+\.\d{2})/);
      if (amountMatch && currentTourId && parseFloat(amountMatch[1]) > 10) {
        currentAmount = amountMatch[1];
        
        // Add the found invoice data
        invoiceData.push({
          'Tour ID': currentTourId,
          'Load ID': currentTourId, // Same as Tour ID in Amazon system
          'Gross Pay Amt (Excl. Tax)': currentAmount,
          'Invoice Type': currentInvoiceType
        });
        
        console.log(`Found: Tour ID ${currentTourId}, Amount ${currentAmount}`);
        
        // Reset for next iteration
        currentTourId = '';
        currentAmount = '';
      }
    }
    
    // If no data found with the above method, try alternative parsing
    if (invoiceData.length === 0) {
      console.log('Primary parsing failed, trying alternative method...');
      
      // Alternative: Look for all Tour IDs and amounts, then match them
      const tourIdPattern = /\b([A-Z0-9]{7,10})\b/g;
      const amountPattern = /\b(\d{2,4}\.\d{2})\b/g;
      
      const tourIds = [...pdfString.matchAll(tourIdPattern)].map(match => match[1]);
      const amounts = [...pdfString.matchAll(amountPattern)].map(match => match[1]);
      
      console.log(`Found ${tourIds.length} Tour IDs and ${amounts.length} amounts`);
      
      // Match tour IDs with amounts (assuming they appear in order)
      const minLength = Math.min(tourIds.length, amounts.length);
      for (let i = 0; i < minLength; i++) {
        if (parseFloat(amounts[i]) > 10) { // Filter out small amounts (might be taxes, etc.)
          invoiceData.push({
            'Tour ID': tourIds[i],
            'Load ID': tourIds[i],
            'Gross Pay Amt (Excl. Tax)': amounts[i],
            'Invoice Type': currentInvoiceType
          });
          console.log(`Matched: Tour ID ${tourIds[i]}, Amount ${amounts[i]}`);
        }
      }
    }
    
    console.log(`PDF processed: ${invoiceData.length} invoices found, type: ${currentInvoiceType}`);
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
    console.log('Upload request received:', {
      hasFile: !!req.file,
      body: req.body,
      fileName: req.file?.originalname,
      mimetype: req.file?.mimetype
    });
    
    try {
      if (!req.file) {
        console.log('No file received in request');
        return res.status(400).json({ error: "Nu a fost încărcat niciun fișier" });
      }

      const { fileType, weekLabel } = req.body;
      
      if (!fileType || !weekLabel) {
        return res.status(400).json({ error: "Tipul fișierului și săptămâna sunt obligatorii" });
      }

      let parsedData: any[] = [];

      console.log(`Processing file: ${req.file.originalname}, type: ${fileType}, mimetype: ${req.file.mimetype}`);

      if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
        parsedData = await parsePdfInvoice(req.file.buffer);
      } else if (req.file.mimetype === 'text/csv' || req.file.originalname.toLowerCase().endsWith('.csv')) {
        console.log('Processing CSV file...');
        const csvText = req.file.buffer.toString('utf-8');
        parsedData = parseCSV(csvText);
        console.log(`CSV parsed: ${parsedData.length} records`);
      } else {
        console.log(`Unsupported file type: ${req.file.mimetype}, filename: ${req.file.originalname}`);
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
