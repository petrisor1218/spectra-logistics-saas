import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tenantStorage } from "./storage-tenant";
import { tenantMiddleware, requireTenantAuth } from "./middleware/tenant";
import { insertPaymentSchema, insertWeeklyProcessingSchema, insertTransportOrderSchema, insertCompanySchema, insertDriverSchema, insertUserSchema, insertTenantSchema, tenants } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { db } from './db';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import Stripe from "stripe";
import { EmailService } from "./emailService";
import { FreeEmailService } from './freeEmailService';
import { getSecondaryUsers, getSecondaryProjects, getSecondaryTasks, getSecondaryStats } from './secondary-db-routes';
import { SubscriptionManager } from './subscription-manager';

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  console.log('STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY.substring(0, 10));
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
} else {
  console.warn('STRIPE_SECRET_KEY not found - Stripe functionality will be disabled');
}

// SECURITY: Default user creation disabled for security reasons
// If you need to create users, do it manually through proper admin interface
// async function createDefaultUser() {
//   // This function was disabled for security - no hardcoded credentials
// }

// Seed initial companies and drivers
async function seedDatabase() {
  try {
    // Check if companies already exist
    const existingCompanies = await storage.getAllCompanies();
    if (existingCompanies.length > 0) {
      return; // Already seeded
    }

    // Create companies with real data from business registry
    const companies = [
      { 
        name: "Fast & Express S.R.L.", 
        commissionRate: "0.02",
        cif: "RO35986465",
        tradeRegisterNumber: "J34/227/2016",
        address: "Str. Dunarii, -, Bl:1604, Sc:d, Et:parter, Ap:42",
        location: "Alexandria",
        county: "Teleorman",
        country: "Romania",
        contact: ""
      },
      { 
        name: "Stef Trans S.R.L.", 
        commissionRate: "0.04",
        cif: "RO19075934",
        tradeRegisterNumber: "J34/570/2006",
        address: "-, -",
        location: "Dobrotesti",
        county: "Teleorman",
        country: "Romania",
        contact: "0729897775, scsteftrans@yahoo.com"
      },
      { 
        name: "De Cargo Sped S.R.L.", 
        commissionRate: "0.04",
        cif: "RO43642683",
        tradeRegisterNumber: "J34/70/2021",
        address: "Str. Iasomiei, 9",
        location: "Mavrodin",
        county: "Teleorman",
        country: "Romania",
        contact: "Ginel, 0763698696, decargosped@gmail.com"
      },
      { 
        name: "Daniel Ontheroad S.R.L.", 
        commissionRate: "0.04",
        cif: "RO40383134",
        tradeRegisterNumber: "J34/27/2019",
        address: "Str. Sos. Turnu Magurele, 4-6, Bl:601, Sc:a, Et:2, Ap:10",
        location: "Alexandria",
        county: "Teleorman",
        country: "Romania",
        contact: "Mariana, 0762653911, feleagadanut@gmail.com"
      },
      { 
        name: "Bis General", 
        commissionRate: "0.04",
        cif: "RO99999999",
        tradeRegisterNumber: "J34/999/2020",
        address: "Adresa necunoscută",
        location: "Necunoscut",
        county: "Teleorman",
        country: "Romania",
        contact: ""
      }
    ];

    const createdCompanies = [];
    for (const company of companies) {
      const created = await storage.createCompany(company);
      createdCompanies.push(created);
    }

    // Driver-company mapping (real data from business registry)
    const driverMappings = [
      // Fast & Express S.R.L. drivers
      { drivers: ["ADRIAN MIRON", "Adrian miron"], company: "Fast & Express S.R.L.", phone: "0740-111111", email: "adrian.miron@fastexpress.ro" },
      { drivers: ["Andrei Serban Badea"], company: "Fast & Express S.R.L.", phone: "0740-111112", email: "andrei.badea@fastexpress.ro" },
      { drivers: ["Petrisor Besteala"], company: "Fast & Express S.R.L.", phone: "0740-111113", email: "petrisor.besteala@fastexpress.ro" },
      { drivers: ["Georgian Florentin Moise"], company: "Fast & Express S.R.L.", phone: "0740-111114", email: "georgian.moise@fastexpress.ro" },
      { drivers: ["Gabriel Marian Ivan"], company: "Fast & Express S.R.L.", phone: "0740-111115", email: "gabriel.ivan@fastexpress.ro" },
      { drivers: ["Olteanu Ionut"], company: "Fast & Express S.R.L.", phone: "0740-111116", email: "ionut.olteanu@fastexpress.ro" },
      { drivers: ["Marius Condila"], company: "Fast & Express S.R.L.", phone: "0740-111117", email: "marius.condila@fastexpress.ro" },
      { drivers: ["Teodor Petrișor Chiar"], company: "Fast & Express S.R.L.", phone: "0740-111118", email: "teodor.chiar@fastexpress.ro" },
      { drivers: ["Tiberiu Iulian Ivan"], company: "Fast & Express S.R.L.", phone: "0740-111119", email: "tiberiu.ivan@fastexpress.ro" },
      { drivers: ["Marius Adrian Badea"], company: "Fast & Express S.R.L.", phone: "0740-111120", email: "marius.badea@fastexpress.ro" },
      { drivers: ["Florin Oprea"], company: "Fast & Express S.R.L.", phone: "0740-111121", email: "florin.oprea@fastexpress.ro" },
      { drivers: ["George Mihaita Butnaru"], company: "Fast & Express S.R.L.", phone: "0740-111122", email: "george.butnaru@fastexpress.ro" },
      { drivers: ["Dan Costinel Savu"], company: "Fast & Express S.R.L.", phone: "0740-111123", email: "dan.savu@fastexpress.ro" },
      { drivers: ["Iosip Ionel"], company: "Fast & Express S.R.L.", phone: "0740-111124", email: "iosip.ionel@fastexpress.ro" },
      { drivers: ["Andrei Tanase"], company: "Fast & Express S.R.L.", phone: "0740-111125", email: "andrei.tanase@fastexpress.ro" },
      { drivers: ["Pana Stefan Daniel"], company: "Fast & Express S.R.L.", phone: "0740-111126", email: "stefan.pana@fastexpress.ro" },
      { drivers: ["Vasilică Roman"], company: "Fast & Express S.R.L.", phone: "0740-111127", email: "vasilica.roman@fastexpress.ro" },
      { drivers: ["Florin Nicolae Sanislai"], company: "Fast & Express S.R.L.", phone: "0740-111128", email: "florin.sanislai@fastexpress.ro" },
      
      // Daniel Ontheroad S.R.L. drivers
      { drivers: ["Costica Mihalcea"], company: "Daniel Ontheroad S.R.L.", phone: "0762-653911", email: "costica.mihalcea@danielontheroad.ro" },
      { drivers: ["Adrian Budescu"], company: "Daniel Ontheroad S.R.L.", phone: "0762-653912", email: "adrian.budescu@danielontheroad.ro" },
      { drivers: ["Danut Feleaga"], company: "Daniel Ontheroad S.R.L.", phone: "0762-653913", email: "danut.feleaga@danielontheroad.ro" },
      { drivers: ["Razvan Jurubita"], company: "Daniel Ontheroad S.R.L.", phone: "0762-653914", email: "razvan.jurubita@danielontheroad.ro" },
      { drivers: ["Feleagă Marian"], company: "Daniel Ontheroad S.R.L.", phone: "0762-653915", email: "marian.feleaga@danielontheroad.ro" },
      { drivers: ["Dimitrov F"], company: "Daniel Ontheroad S.R.L.", phone: "0762-653916", email: "dimitrov.f@danielontheroad.ro" },
      
      // De Cargo Sped S.R.L. drivers
      { drivers: ["Cernat Lucian Marian"], company: "De Cargo Sped S.R.L.", phone: "0763-698696", email: "lucian.cernat@decargosped.ro" },
      { drivers: ["Draghici Marius Sorin"], company: "De Cargo Sped S.R.L.", phone: "0763-698697", email: "marius.draghici@decargosped.ro" },
      { drivers: ["Sorin petrisor Dumitrache"], company: "De Cargo Sped S.R.L.", phone: "0763-698698", email: "sorin.dumitrache@decargosped.ro" },
      { drivers: ["Petre Iulian LEUCE"], company: "De Cargo Sped S.R.L.", phone: "0763-698699", email: "petre.leuce@decargosped.ro" },
      
      // Stef Trans S.R.L. drivers
      { drivers: ["Gorgos Adrian"], company: "Stef Trans S.R.L.", phone: "0729-897775", email: "adrian.gorgos@steftrans.ro" },
      { drivers: ["Barbuceanu Anghel"], company: "Stef Trans S.R.L.", phone: "0729-897776", email: "anghel.barbuceanu@steftrans.ro" },
      { drivers: ["Adi-Nicolae Gocea"], company: "Stef Trans S.R.L.", phone: "0729-897777", email: "adi.gocea@steftrans.ro" },
      { drivers: ["Dumitru Ciobanu"], company: "Stef Trans S.R.L.", phone: "0729-897778", email: "dumitru.ciobanu@steftrans.ro" },
      { drivers: ["Dimache Mihalache"], company: "Stef Trans S.R.L.", phone: "0729-897779", email: "dimache.mihalache@steftrans.ro" },
      
      // Bis General drivers
      { drivers: ["Toma Alin Marian"], company: "Bis General", phone: "0740-999999", email: "alin.toma@bisgeneral.ro" },
      { drivers: ["Balanean Daniel"], company: "Bis General", phone: "0740-999998", email: "daniel.balanean@bisgeneral.ro" }
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
          phone: mapping.phone || '',
          email: mapping.email || '',
        });
      }
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  const pgStore = connectPg(session);
  app.use(session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'transport-app-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: false // Set to true in production with HTTPS
    }
  }));

  // Apply tenant middleware to all API routes
  app.use('/api', tenantMiddleware);

  // Seed database on startup
  // await createDefaultUser(); // Disabled for security
  await seedDatabase();

  // Authentication routes
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      res.json({ message: 'Login successful', user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/user', (req: any, res) => {
    if (req.session?.userId) {
      storage.getUser(req.session.userId).then(user => {
        if (user) {
          res.json({ id: user.id, username: user.username });
        } else {
          res.status(401).json({ error: 'User not found' });
        }
      }).catch(() => {
        res.status(500).json({ error: 'Internal server error' });
      });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // Legacy company routes (backward compatibility - tenant 1)
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Multi-tenant company routes
  app.get("/api/tenant/:tenantId/companies", async (req: any, res) => {
    try {
      const tenantId = req.tenantId;
      const companies = await tenantStorage.getAllCompanies(tenantId);
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Legacy driver routes (backward compatibility - tenant 1)
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  // Multi-tenant driver routes
  app.get("/api/tenant/:tenantId/drivers", async (req: any, res) => {
    try {
      const tenantId = req.tenantId;
      const drivers = await tenantStorage.getAllDrivers(tenantId);
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.post("/api/tenant/:tenantId/drivers", async (req: any, res) => {
    try {
      const tenantId = req.tenantId;
      const { name, companyId } = req.body;
      
      if (!name || !companyId) {
        return res.status(400).json({ error: "Name and companyId are required" });
      }
      
      const driver = await tenantStorage.createDriver({
        name,
        companyId,
        nameVariants: [],
        phone: "",
        email: ""
      }, tenantId);
      
      console.log(`✅ Created driver for tenant ${tenantId}: "${name}" → companyId: ${companyId}`);
      res.json(driver);
    } catch (error) {
      console.error("❌ Error creating driver:", error);
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  // Legacy weekly processing routes (backward compatibility - tenant 1)
  app.get("/api/processing/:weekLabel", async (req, res) => {
    try {
      const { weekLabel } = req.params;
      const processing = await storage.getWeeklyProcessing(weekLabel);
      res.json(processing || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processing data" });
    }
  });

  // Multi-tenant weekly processing routes
  app.get("/api/tenant/:tenantId/processing/:weekLabel", requireTenantAuth, async (req: any, res) => {
    try {
      const { weekLabel } = req.params;
      const tenantId = req.tenantId;
      const processing = await tenantStorage.getWeeklyProcessing(weekLabel, tenantId);
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

  // Multi-tenant processing routes
  app.post("/api/tenant/:tenantId/processing", requireTenantAuth, async (req: any, res) => {
    try {
      const tenantId = req.tenantId;
      const validatedData = insertWeeklyProcessingSchema.parse(req.body);
      const existing = await tenantStorage.getWeeklyProcessing(validatedData.weekLabel, tenantId);
      
      if (existing) {
        const updated = await tenantStorage.updateWeeklyProcessing(validatedData.weekLabel, validatedData, tenantId);
        res.json(updated);
      } else {
        const created = await tenantStorage.createWeeklyProcessing(validatedData, tenantId);
        res.json(created);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to save processing data" });
    }
  });

  // Legacy payment routes (backward compatibility - tenant 1)
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

  // Multi-tenant payment routes
  app.get("/api/tenant/:tenantId/payments", requireTenantAuth, async (req: any, res) => {
    try {
      const { weekLabel } = req.query;
      const tenantId = req.tenantId;
      
      if (weekLabel) {
        const payments = await tenantStorage.getPaymentsByWeek(weekLabel as string, tenantId);
        res.json(payments);
      } else {
        const payments = await tenantStorage.getAllPayments(tenantId);
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
      
      // Automatically send payment notification email
      try {
        // Get company information
        const companies = await storage.getAllCompanies();
        
        // Create a company name mapping to handle variations
        const getCompanyByPaymentName = (paymentCompanyName: string) => {
          // Direct match first
          let company = companies.find(c => c.name === paymentCompanyName);
          if (company) return company;
          
          // Handle common name variations
          const nameMap: Record<string, string[]> = {
            "Fast & Express S.R.L.": ["Fast Express", "Fast & Express"],
            "De Cargo Sped S.R.L.": ["DE Cargo Speed", "De Cargo Speed"],
            "Stef Trans S.R.L.": ["Stef Trans"],
            "Daniel Ontheroad S.R.L.": ["Daniel Ontheroad"],
            "Toma SRL": ["Toma", "Toma SRL"],
            "Bis General": ["Bis General"]
          };
          
          // Find company by checking all variations
          for (const [dbName, variations] of Object.entries(nameMap)) {
            if (variations.includes(paymentCompanyName)) {
              company = companies.find(c => c.name === dbName);
              if (company) {
                console.log(`📧 Company name mapped: "${paymentCompanyName}" → "${dbName}"`);
                return company;
              }
            }
          }
          
          // Fallback: partial matching
          company = companies.find(c => 
            c.name.toLowerCase().includes(paymentCompanyName.toLowerCase()) ||
            paymentCompanyName.toLowerCase().includes(c.name.toLowerCase())
          );
          
          if (company) {
            console.log(`📧 Company found via partial match: "${paymentCompanyName}" → "${company.name}"`);
          } else {
            console.log(`⚠️ No company found for payment name: "${paymentCompanyName}"`);
          }
          
          return company;
        };
        
        const company = getCompanyByPaymentName(payment.companyName);
        
        if (company && company.contact && company.contact.includes('@')) {
          // Extract email from contact field
          const emailMatch = company.contact.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            const companyEmail = emailMatch[0];
            
            // Calculate remaining balances for all weeks for this company
            const balances = await storage.getCompanyBalances();
            const companyBalances = balances
              .filter(b => b.companyName === payment.companyName && parseFloat(b.outstandingBalance) !== 0)
              .map(b => {
                let remainingAmount = parseFloat(b.outstandingBalance);
                
                // If this balance is for the same week as the payment, subtract the payment amount
                if (b.weekLabel === payment.weekLabel) {
                  remainingAmount = remainingAmount - parseFloat(payment.amount);
                }
                
                return {
                  weekLabel: b.weekLabel,
                  remainingAmount: remainingAmount,
                  totalInvoiced: parseFloat(b.totalInvoiced)
                };
              })
              .filter(b => b.remainingAmount !== 0) // Only show non-zero balances
              .sort((a, b) => b.weekLabel.localeCompare(a.weekLabel)); // Sort by week, newest first
            
            // Send email using the free email service (more reliable)
            await FreeEmailService.sendPaymentNotificationEmail({
              to: companyEmail,
              companyName: payment.companyName,
              paymentData: {
                amount: parseFloat(payment.amount),
                paymentDate: payment.paymentDate?.toISOString() || new Date().toISOString(),
                weekLabel: payment.weekLabel,
                notes: payment.description || undefined
              },
              remainingBalances: companyBalances
            });
            
            console.log(`✅ Payment notification sent to ${companyEmail} for ${payment.companyName}`);
          }
        }
      } catch (emailError) {
        console.error('❌ Failed to send payment notification email:', emailError);
        // Don't fail the payment creation if email fails
      }
      
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

  // Payment deletion with proper history handling
  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🗑️ Deleting payment with id: ${id}`);
      
      // Get current payment for history BEFORE deleting
      const currentPayments = await storage.getAllPayments();
      const currentPayment = currentPayments.find(p => p.id === id);
      
      if (currentPayment) {
        console.log(`🗑️ Found payment to delete: ${currentPayment.companyName} - ${currentPayment.weekLabel} - ${currentPayment.amount} EUR`);
        
        // First, update any existing payment history records to remove FK reference
        await storage.clearPaymentHistoryReferences(id);
        
        // Create history record for the deletion with null paymentId
        await storage.createPaymentHistoryRecord({
          paymentId: null, // Set to null for deleted payments to avoid FK constraint
          action: "deleted",
          previousData: currentPayment,
        });
        
        // Now delete the payment
        await storage.deletePayment(id);
        
        console.log(`✅ Payment ${id} deleted successfully`);
        res.json({ success: true, message: "Payment deleted successfully" });
      } else {
        console.log(`⚠️ Payment ${id} not found`);
        res.status(404).json({ error: "Payment not found" });
      }
    } catch (error) {
      console.error("❌ Error deleting payment:", error);
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  // Manual payment email endpoint for testing
  app.post("/api/manual-payment-email", async (req, res) => {
    try {
      const { to, companyName, paymentData, remainingBalances } = req.body;
      
      console.log(`📧 Manual email test for ${companyName} to ${to}`);
      
      // Send email using the free email service
      await FreeEmailService.sendPaymentNotificationEmail({
        to,
        companyName,
        paymentData,
        remainingBalances: remainingBalances || []
      });
      
      res.json({ 
        success: true, 
        message: `Manual email sent to ${to}`,
        companyName,
        paymentAmount: paymentData.amount
      });
      
    } catch (error) {
      console.error('❌ Failed to send manual payment email:', error);
      res.status(500).json({ 
        error: "Failed to send manual email",
        details: error.message
      });
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

  // Weekly processing routes with VRID historical matching
  app.post("/api/weekly-processing", async (req, res) => {
    try {
      const { weekLabel, data, processedAt, tripData, invoice7Data, invoice30Data } = req.body;
      
      // Enhanced processing with historical VRID matching
      if (tripData && invoice7Data && invoice30Data) {
        console.log(`Processing with historical VRID matching for week: ${weekLabel}`);
        const savedProcessing = await storage.saveWeeklyDataWithHistory(
          weekLabel,
          tripData,
          invoice7Data,
          invoice30Data,
          data // Add the processed data parameter
        );
        res.json(savedProcessing);
      } else {
        // Fallback for basic data save
        const weeklyProcessingData = {
          weekLabel,
          processingDate: processedAt ? new Date(processedAt) : new Date(),
          tripDataCount: 0,
          invoice7Count: 0, 
          invoice30Count: 0,
          processedData: data
        };

        const savedProcessing = await storage.createWeeklyProcessing(weeklyProcessingData);
        res.json(savedProcessing);
      }
    } catch (error) {
      console.error("Error saving weekly processing:", error);
      res.status(500).json({ error: "Failed to save processed data" });
    }
  });

  app.get("/api/weekly-processing", async (req, res) => {
    try {
      const { weekLabel } = req.query;
      
      if (weekLabel) {
        const processing = await storage.getWeeklyProcessingByWeek(weekLabel as string);
        res.json(processing);
      } else {
        const allProcessing = await storage.getAllWeeklyProcessing();
        res.json(allProcessing);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly processing data" });
    }
  });

  // VRID historical search route  
  app.post("/api/search-historical-vrids", async (req, res) => {
    try {
      const { vrids } = req.body;
      
      if (!vrids || !Array.isArray(vrids)) {
        return res.status(400).json({ error: "Invalid VRID list provided" });
      }

      console.log(`🔍 Căutare istorică pentru ${vrids.length} VRIDs: ${vrids.slice(0, 3).join(', ')}${vrids.length > 3 ? '...' : ''}`);
      const historicalTrips = await storage.searchHistoricalTripsByVrids(vrids);
      
      // Group by VRID for easy lookup
      const historicalByVrid = historicalTrips.reduce((acc, trip) => {
        acc[trip.vrid] = trip;
        return acc;
      }, {} as Record<string, any>);

      const response = {
        found: historicalTrips.length,
        total: vrids.length,
        historicalData: historicalByVrid
      };

      console.log(`📊 Rezultat căutare: ${response.found}/${response.total} VRID-uri găsite în istoric`);
      if (response.found > 0) {
        historicalTrips.forEach(trip => {
          console.log(`   ✓ ${trip.vrid} → ${trip.driverName || 'N/A'} (${trip.weekLabel})`);
        });
      }

      res.json(response);
    } catch (error) {
      console.error("Error searching historical VRIDs:", error);
      res.status(500).json({ error: "Failed to search historical data" });
    }
  });

  // Get historical trips statistics
  app.get("/api/historical-trips/stats", async (req, res) => {
    try {
      const totalTrips = await storage.getHistoricalTripsCount();
      const uniqueVrids = await storage.getUniqueVridsCount();
      const weeksCovered = await storage.getHistoricalWeeksCount();
      
      res.json({
        totalTrips,
        uniqueVrids,
        weeksCovered,
        message: `Istoric permanent: ${totalTrips} cursuri, ${uniqueVrids} VRID-uri unice din ${weeksCovered} săptămâni`
      });
    } catch (error) {
      console.error("Error fetching historical stats:", error);
      res.status(500).json({ error: "Failed to fetch historical statistics" });
    }
  });

  // Transport orders routes
  app.get("/api/transport-orders", async (req, res) => {
    try {
      const { weekLabel, companyName } = req.query;
      
      if (weekLabel) {
        const orders = await storage.getTransportOrdersByWeek(weekLabel as string);
        res.json(orders);
      } else if (companyName) {
        const orders = await storage.getTransportOrdersByCompany(companyName as string);
        res.json(orders);
      } else {
        const orders = await storage.getAllTransportOrders();
        res.json(orders);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transport orders" });
    }
  });

  // Get next order number
  app.get("/api/next-order-number", async (req, res) => {
    try {
      const nextNumber = await storage.getNextOrderNumber();
      res.json({ orderNumber: nextNumber });
    } catch (error) {
      console.error("Error getting next order number:", error);
      res.status(500).json({ error: "Failed to get next order number" });
    }
  });

  // Admin routes for subscription management
  app.get("/api/admin/subscribers", async (req, res) => {
    try {
      const subscribers = await storage.getAllUsers();
      res.json(subscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const analytics = {
        totalSubscribers: users.length,
        activeSubscriptions: users.filter(u => u.subscriptionStatus === 'active').length,
        trialUsers: users.filter(u => u.subscriptionStatus === 'trialing').length,
        monthlyRevenue: users.filter(u => u.subscriptionStatus === 'active').length * 99.99
      };
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/subscriber/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "Subscriber not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching subscriber:", error);
      res.status(500).json({ error: "Failed to fetch subscriber" });
    }
  });

  app.put("/api/admin/subscriber/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedUser = await storage.updateUser(id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating subscriber:", error);
      res.status(500).json({ error: "Failed to update subscriber" });
    }
  });

  // Additional admin user management endpoints
  app.put('/api/admin/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      await storage.updateUser(parseInt(id), updateData);
      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.post('/api/admin/users', async (req, res) => {
    try {
      const userData = req.body;
      
      // Generate a default password for new users
      const defaultPassword = 'TempPass123!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      res.json({ 
        message: 'User created successfully', 
        user: newUser,
        defaultPassword // In production, send this via email
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.delete('/api/admin/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteUser(parseInt(id));
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  app.post("/api/transport-orders", async (req, res) => {
    try {
      console.log("Received transport order data:", req.body);
      
      // Convert orderDate string to Date object if needed
      const orderData = {
        ...req.body,
        orderDate: new Date(req.body.orderDate)
      };
      
      console.log("Processed order data:", orderData);
      
      const validatedData = insertTransportOrderSchema.parse(orderData);
      const order = await storage.createTransportOrder(validatedData);
      res.json(order);
    } catch (error: any) {
      console.error("Error creating transport order:", error);
      console.error("Error details:", error.issues || error.message);
      res.status(500).json({ 
        error: "Failed to create transport order",
        details: error.issues || error.message
      });
    }
  });

  app.delete("/api/transport-orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      await storage.deleteTransportOrder(orderId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting transport order:", error);
      res.status(500).json({ error: "Failed to delete transport order" });
    }
  });

  // Company management routes
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(id, validatedData);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCompany(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Driver management routes with company join  
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      const companies = await storage.getAllCompanies();
      
      const result = drivers.map(driver => {
        const company = companies.find(c => c.id === driver.companyId);
        const driverWithCompany = {
          id: driver.id,
          name: driver.name,
          companyId: driver.companyId,
          nameVariants: driver.nameVariants,
          phone: driver.phone,
          email: driver.email,
          createdAt: driver.createdAt
        };
        
        // Explicitly add company field
        (driverWithCompany as any).company = company || null;
        
        return driverWithCompany;
      });
      
      res.set('Cache-Control', 'no-cache');
      res.json(result);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  // TEST ENDPOINT to verify company join works
  app.get("/api/test-drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      const companies = await storage.getAllCompanies();
      
      const result = drivers.map(driver => {
        const company = companies.find(c => c.id === driver.companyId);
        return {
          id: driver.id,
          name: driver.name,
          companyId: driver.companyId,
          nameVariants: driver.nameVariants,
          phone: driver.phone,
          email: driver.email,
          createdAt: driver.createdAt,
          company: company
        };
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Test failed" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(validatedData);
      res.json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDriverSchema.partial().parse(req.body);
      const driver = await storage.updateDriver(id, validatedData);
      res.json(driver);
    } catch (error) {
      console.error("Error updating driver:", error);
      res.status(500).json({ error: "Failed to update driver" });
    }
  });

  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDriver(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ error: "Failed to delete driver" });
    }
  });

  // Email functionality routes
  // Send weekly report email route
  // REMOVED DUPLICATE ENDPOINT - using the cleaner one below

  // Test email endpoint
  app.post('/api/test-email', async (req, res) => {
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email address required' 
        });
      }

      const htmlTemplate = `
        <h2>🚚 Test Email - Transport Pro</h2>
        <p>Acesta este un email de test pentru verificarea funcționalității.</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString('ro-RO')}</p>
        <p><strong>Status:</strong> Sistemul email funcționează perfect!</p>
        <p><strong>Serviciu:</strong> Brevo SMTP (300 emailuri/zi GRATUIT)</p>
      `;

      const emailSuccess = await FreeEmailService.sendEmail({
        to: testEmail,
        subject: `Test Email - Transport Pro ${new Date().toLocaleDateString('ro-RO')}`,
        html: htmlTemplate
      });

      if (emailSuccess === 'brevo_real') {
        res.json({
          success: true,
          message: `REAL email sent via Brevo SMTP to ${testEmail}. Check Brevo dashboard for delivery status.`,
          type: 'brevo'
        });
      } else if (emailSuccess === 'ethereal_preview') {
        res.json({
          success: true,
          message: `Email PREVIEW generated successfully. Check server logs for preview URL!`,
          type: 'preview'
        });
      } else if (emailSuccess === true) {
        res.json({
          success: true,
          message: `REAL email sent successfully to ${testEmail}`,
          type: 'real'
        });
      } else {
        res.json({
          success: false,
          message: 'Email service not configured properly'
        });
      }

    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test email: ' + error.message
      });
    }
  });

  // Update company email endpoint
  app.post('/api/update-company-email', async (req, res) => {
    try {
      const { companyName, newEmail } = req.body;
      
      if (!companyName || !newEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company name and email required' 
        });
      }

      await storage.updateCompanyEmail(companyName, newEmail);
      
      res.json({
        success: true,
        message: `Email updated for ${companyName} to ${newEmail}`
      });

    } catch (error) {
      console.error('Error updating company email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update company email: ' + error.message
      });
    }
  });

  app.post("/api/send-transport-order", async (req, res) => {
    try {
      const { orderData, companyEmail, pdfContent } = req.body;
      
      if (!orderData || !companyEmail || !pdfContent) {
        return res.status(400).json({ error: "Missing required fields for email" });
      }

      const success = await FreeEmailService.sendEmail({
        to: companyEmail,
        subject: `Comandă Transport #${orderData.orderNumber} - ${orderData.companyName}`,
        html: EmailService.generateTransportOrderHTML(orderData),
        attachments: [{
          filename: `Comanda_Transport_${orderData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${orderData.orderNumber}.pdf`,
          content: pdfContent,
          type: 'application/pdf',
          disposition: 'attachment'
        }]
      });

      if (success) {
        // Update order status to 'sent'
        await storage.updateTransportOrder(orderData.id, { status: 'sent' });
        
        if (success === 'demo' || success === true) {
          res.json({ 
            success: true, 
            message: "DEMO MODE: Email functionality working, but SendGrid API key needs to be configured" 
          });
        } else {
          res.json({ success: true, message: "Email sent successfully" });
        }
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending transport order email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/send-weekly-report", async (req, res) => {
    try {
      console.log('📧 Weekly report request received:', {
        body: req.body ? 'Present' : 'Missing',
        companyName: req.body?.companyName,
        companyEmail: req.body?.companyEmail,
        weekLabel: req.body?.weekLabel,
        reportData: req.body?.reportData ? 'Present' : 'Missing',
        pdfContent: req.body?.pdfContent ? `${req.body.pdfContent.length} chars` : 'Missing'
      });
      
      const { companyEmail, companyName, weekLabel, reportData, pdfContent } = req.body;
      
      if (!companyEmail || !companyName || !weekLabel || !reportData || !pdfContent) {
        console.log('❌ Missing required fields:', { companyEmail: !!companyEmail, companyName: !!companyName, weekLabel: !!weekLabel, reportData: !!reportData, pdfContent: !!pdfContent });
        return res.status(400).json({ error: "Missing required fields for weekly report" });
      }

      console.log('📝 Generating HTML template...');
      const htmlTemplate = `
        <h2>🚚 Raport Săptămânal - ${companyName}</h2>
        <p><strong>Perioada:</strong> ${weekLabel}</p>
        <p>Găsiți în atașament raportul complet pentru această perioadă.</p>
        <p>Cu respect,<br>Echipa Transport Pro</p>
      `;
      
      console.log('📧 Sending weekly report via Brevo...');
      const success = await FreeEmailService.sendEmail({
        to: companyEmail,
        subject: `Raport Săptămânal - ${companyName} (${weekLabel})`,
        html: htmlTemplate,
        attachments: [{
          filename: `Raport_${companyName}_${weekLabel.replace(/\s/g, '_')}.pdf`,
          content: pdfContent,
          type: 'application/pdf',
          disposition: 'attachment'
        }]
      });

      if (success) {
        res.json({ success: true, message: "Weekly report sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send weekly report" });
      }
    } catch (error) {
      console.error("❌ DETAILED weekly report error:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        error: error
      });
      res.status(500).json({ error: `Failed to send weekly report: ${error.message}` });
    }
  });

  app.post("/api/send-payment-notification", async (req, res) => {
    try {
      const { companyEmail, companyName, paymentData } = req.body;
      
      if (!companyEmail || !companyName || !paymentData) {
        return res.status(400).json({ error: "Missing required fields for payment notification" });
      }

      const success = await EmailService.sendPaymentNotification(
        companyEmail,
        companyName,
        paymentData
      );

      if (success) {
        res.json({ success: true, message: "Payment notification sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send payment notification" });
      }
    } catch (error) {
      console.error("Error sending payment notification email:", error);
      res.status(500).json({ error: "Failed to send payment notification" });
    }
  });

  // Stripe routes for subscription management
  if (stripe) {
    // Stripe subscription routes would go here
  }

  // Company balance endpoints
  app.get("/api/company-balances", async (req, res) => {
    try {
      const balances = await storage.getCompanyBalances();
      res.json(balances);
    } catch (error) {
      console.error("Error fetching company balances:", error);
      res.status(500).json({ message: "Failed to fetch company balances" });
    }
  });

  app.post("/api/company-balances/generate", async (req, res) => {
    try {
      const balances = await storage.generateCompanyBalancesFromCalendarData();
      res.json(balances);
    } catch (error) {
      console.error("Error generating company balances:", error);
      res.status(500).json({ message: "Failed to generate company balances" });
    }
  });

  app.post("/api/company-balances", async (req, res) => {
    try {
      const balanceData = req.body;
      const balance = await storage.createOrUpdateCompanyBalance(balanceData);
      res.json(balance);
    } catch (error) {
      console.error("Error creating/updating company balance:", error);
      res.status(500).json({ message: "Failed to create/update balance" });
    }
  });

  app.post("/api/company-balances/payment", async (req, res) => {
    try {
      const { companyName, weekLabel, paidAmount, balanceId } = req.body;
      
      if (!companyName || !weekLabel || !paidAmount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if payment already exists to prevent duplicates
      const existingPayments = await storage.getPaymentsByCompanyAndWeek(companyName, weekLabel);
      const totalPaid = existingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const newTotal = totalPaid + parseFloat(paidAmount);
      
      // Get the balance to check total invoiced
      const balance = await storage.getCompanyBalanceByWeek(companyName, weekLabel);
      if (balance && newTotal > parseFloat(balance.totalInvoiced) + 1) {
        return res.status(400).json({ 
          message: `Suma plății (${paidAmount}) depășește restanța de ${balance.outstandingBalance} EUR` 
        });
      }

      // First create the payment record in the payments table
      const paymentData = {
        companyName: companyName,
        amount: paidAmount.toString(),
        description: `Plată pentru ${weekLabel}`,
        paymentDate: new Date(),
        weekLabel: weekLabel,
        paymentType: 'full'
      };

      const payment = await storage.createPayment(paymentData);
      console.log(`💾 Plată salvată în tabelul payments: ${payment.companyName} - ${payment.weekLabel} - ${payment.amount} EUR`);

      // Then update the balance record
      const balance = await storage.updateCompanyBalancePayment(companyName, weekLabel, paidAmount);
      
      // Create payment history record
      await storage.createPaymentHistoryRecord({
        paymentId: payment.id,
        action: "created",
        previousData: null,
      });

      res.json(balance);
    } catch (error) {
      console.error("Error updating company balance payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // Delete payment endpoint
  app.delete("/api/company-balances/payment/:companyName/:weekLabel", async (req, res) => {
    try {
      const { companyName, weekLabel } = req.params;
      const { paymentAmount } = req.body;
      
      console.log(`🗑️ Ștergere plată: ${companyName} - ${weekLabel} - ${paymentAmount} EUR`);
      
      const balance = await storage.deleteCompanyBalancePayment(companyName, weekLabel, paymentAmount);
      res.json({ 
        success: true, 
        message: `Plată de ${paymentAmount} EUR ștearsă cu succes`,
        balance: balance
      });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });


  // Stripe subscription routes WITH AUTOMATIC TENANT CREATION
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const keyStart = process.env.STRIPE_SECRET_KEY?.substring(0, 7);
      if (!stripe || keyStart === 'pk_test') {
        return res.status(500).json({ 
          error: "Stripe not configured", 
          message: keyStart === 'pk_test' 
            ? "Secret key required (currently using publishable key)" 
            : "Please set STRIPE_SECRET_KEY" 
        });
      }

      const { 
        planId, 
        trialDays = 3,
        // Tenant information
        companyName,
        contactEmail,
        contactPhone,
        firstName,
        lastName,
        tenantName
      } = req.body;
      
      // Create Stripe customer with tenant information
      const customer = await stripe.customers.create({
        email: contactEmail || 'temp@example.com',
        name: `${firstName || ''} ${lastName || ''}`.trim(),
        metadata: {
          planId,
          // Tenant creation data for webhook
          companyName: companyName || '',
          tenantName: tenantName || companyName || '',
          contactPhone: contactPhone || '',
          firstName: firstName || '',
          lastName: lastName || '',
          tenantCreation: 'pending',
          autoCreateTenant: 'true'
        }
      });

      // Pentru perioada de probă, creează un Setup Intent (nu Payment Intent)
      // Aceasta va salva metoda de plată fără să perceapă bani
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          planId,
          trialDays: trialDays.toString(),
          type: 'trial_setup'
        }
      });

      console.log(`✅ Created trial setup for ${trialDays} days for ${companyName || 'Unknown Company'} - tenant will be auto-created after payment`);
      res.json({ 
        clientSecret: setupIntent.client_secret,
        customerId: customer.id,
        trialDays,
        message: 'După confirmarea plății, tenant-ul va fi creat automat și veți primi credențialele pe email!'
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        error: "Error creating subscription", 
        message: error.message 
      });
    }
  });

  // Advanced Webhook for AUTOMATIC TENANT CREATION
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      const event = req.body;
      console.log(`🎣 Webhook primit: ${event.type}`);
      
      switch (event.type) {
        case 'setup_intent.succeeded':
          // 🎆 PAYMENT SUCCESSFUL - CREATE TENANT AUTOMATICALLY!
          await handleTenantCreationAfterPayment(event.data.object);
          break;
        case 'payment_intent.succeeded':
          // Handle successful subscription payment
          console.log('💰 Subscription payment succeeded:', event.data.object.id);
          await handleTenantCreationAfterPayment(event.data.object);
          break;
        case 'customer.subscription.created':
          // Handle new subscription
          console.log('🎆 New subscription created:', event.data.object.id);
          break;
        case 'customer.subscription.updated':
          // Handle subscription updates
          console.log('⚙️ Subscription updated:', event.data.object.id);
          break;
        default:
          console.log('❔ Unhandled event type:', event.type);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("🔥 Webhook error:", error);
      res.status(400).json({ error: "Webhook failed" });
    }
  });
  
  // 🎩 MAGIC FUNCTION: Auto-create tenant after successful payment
  async function handleTenantCreationAfterPayment(paymentObject: any) {
    try {
      if (!stripe) return;
      
      console.log('🎩 Starting automatic tenant creation...');
      
      // Get customer info from Stripe
      const customer = await stripe.customers.retrieve(paymentObject.customer);
      
      if (customer.deleted || !customer.metadata) {
        console.log('⚠️ Customer not found or no metadata');
        return;
      }
      
      const metadata = customer.metadata;
      
      // Check if this customer needs tenant creation
      if (metadata.autoCreateTenant !== 'true' || metadata.tenantCreation !== 'pending') {
        console.log('🙃 No tenant creation needed for this customer');
        return;
      }
      
      // Extract tenant data from metadata
      const tenantName = metadata.tenantName || metadata.companyName || 'New Tenant';
      const companyName = metadata.companyName || '';
      const contactEmail = (customer as any).email || '';
      const contactPhone = metadata.contactPhone || '';
      const firstName = metadata.firstName || '';
      const lastName = metadata.lastName || '';
      
      console.log(`🏢 Creating tenant: ${tenantName}`);
      
      // Create the tenant
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: tenantName,
          description: `Tenant creat automat după plata Stripe pentru ${companyName}`,
          status: 'active',
          companyName,
          contactEmail,
          contactPhone,
          subscriptionPlan: 'professional'
        })
        .returning();
      
      // Generate secure credentials
      const adminUsername = `admin_${newTenant.id}`;
      const adminPassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create admin user
      const adminUser = await storage.createUser({
        username: adminUsername,
        password: hashedPassword,
        email: contactEmail,
        firstName,
        lastName,
        role: 'admin',
        tenantId: newTenant.id,
        companyName,
        subscriptionStatus: 'active'
      });
      
      // Initialize order sequence
      await tenantStorage.initializeOrderSequence(newTenant.id);
      
      // Update Stripe customer metadata
      await stripe.customers.update(paymentObject.customer, {
        metadata: {
          ...metadata,
          tenantCreation: 'completed',
          tenantId: newTenant.id.toString(),
          adminUsername
        }
      });
      
      console.log(`✅ Tenant creat cu succes: ${tenantName} (ID: ${newTenant.id})`);
      console.log(`👤 Admin user: ${adminUsername}`);
      
      // 📧 Send welcome email with credentials
      await sendWelcomeEmailWithCredentials({
        tenantName,
        companyName,
        contactEmail,
        adminUsername,
        adminPassword,
        tenantId: newTenant.id,
        firstName,
        lastName
      });
      
    } catch (error) {
      console.error('🔥 Error creating tenant after payment:', error);
    }
  }
  
  // 🔑 Generate secure password
  function generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
  
  // 📧 Send welcome email with login credentials
  async function sendWelcomeEmailWithCredentials(tenantData: any) {
    try {
      const { 
        tenantName, 
        companyName, 
        contactEmail, 
        adminUsername, 
        adminPassword, 
        tenantId,
        firstName,
        lastName 
      } = tenantData;
      
      const emailService = new FreeEmailService();
      
      const subject = `🎆 Bun venit la ${tenantName} - Credențialele tale de acces`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center; margin-bottom: 30px;">
              🎆 Bun venit în Transport Management System!
            </h1>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h2 style="color: #667eea; margin-top: 0;">🏢 Tenant-ul tău a fost creat!</h2>
              <p><strong>Numele tenant-ului:</strong> ${tenantName}</p>
              ${companyName ? `<p><strong>Compania:</strong> ${companyName}</p>` : ''}
              <p><strong>ID Tenant:</strong> #${tenantId}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h2 style="color: #28a745; margin-top: 0;">🔑 Credențialele tale de acces</h2>
              <p><strong>Username:</strong> <code style="background: #f1f1f1; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${adminUsername}</code></p>
              <p><strong>Parola:</strong> <code style="background: #f1f1f1; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${adminPassword}</code></p>
              <p style="color: #d32f2f; font-size: 14px; margin-top: 15px;">
                ⚠️ <strong>Important:</strong> Salvează aceste credențiale într-un loc sigur și schimbă parola la prima conectare!
              </p>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h2 style="color: #856404; margin-top: 0;">🚀 Cum te conectezi</h2>
              <ol style="color: #856404; line-height: 1.6;">
                <li>Accsesează pagina de login pentru tenanți</li>
                <li>Selectează tenant-ul tău: <strong>${tenantName}</strong></li>
                <li>Introduceți username-ul și parola de mai sus</li>
                <li>Startă să gestionezi transporturile tale!</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://your-domain.com'}/tenant-login" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🔐 Conectează-te Acum
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
              <p>Ai întrebări? Contactează-ne pe support@transport-system.com</p>
              <p style="margin-top: 15px;">
                Cu drag,<br>
                <strong>Echipa Transport Management System</strong> 🚚
              </p>
            </div>
          </div>
        </div>
      `;
      
      await emailService.sendEmail(
        contactEmail,
        subject,
        htmlContent
      );
      
      console.log(`📧 Welcome email sent to ${contactEmail} pentru ${tenantName}`);
      
    } catch (error) {
      console.error('📧 Error sending welcome email:', error);
    }
  }

  // Backup routes
  app.post('/api/backup', async (req, res) => {
    try {
      const { backupManager } = await import('./backup');
      const filePath = await backupManager.createBackup('manual');
      res.json({ 
        success: true, 
        message: 'Backup created successfully',
        filePath 
      });
    } catch (error: any) {
      console.error('Backup error:', error);
      res.status(500).json({ 
        error: 'Failed to create backup',
        message: error.message 
      });
    }
  });

  app.get('/api/backup/history', async (req, res) => {
    try {
      const { backupManager } = await import('./backup');
      const history = await backupManager.getBackupHistory();
      res.json(history);
    } catch (error: any) {
      console.error('Backup history error:', error);
      res.status(500).json({ 
        error: 'Failed to get backup history',
        message: error.message 
      });
    }
  });

  // Secondary database routes
  app.get('/api/secondary/users', getSecondaryUsers);
  app.get('/api/secondary/projects', getSecondaryProjects);
  app.get('/api/secondary/tasks', getSecondaryTasks);
  app.get('/api/secondary/stats', getSecondaryStats);

  // Multi-tenant system status endpoint
  app.get('/api/tenant/status', async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Multi-tenant system is operational',
        features: [
          'Schema-based tenant isolation',
          'Tenant-aware API routes', 
          'Automatic tenant ID extraction',
          'Backward compatibility with legacy routes'
        ]
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get system status' });
    }
  });

  // Multi-tenant company balance routes
  app.get("/api/tenant/:tenantId/company-balances", requireTenantAuth, async (req: any, res) => {
    try {
      const tenantId = req.tenantId;
      const balances = await tenantStorage.getCompanyBalances(tenantId);
      res.json(balances);
    } catch (error) {
      console.error("Error fetching company balances for tenant:", error);
      res.status(500).json({ error: "Failed to fetch company balances" });
    }
  });

  // Multi-tenant payments creation
  app.post("/api/tenant/:tenantId/payments", requireTenantAuth, async (req: any, res) => {
    try {
      const tenantId = req.tenantId;
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await tenantStorage.createPayment(validatedData, tenantId);
      
      // Create history record
      await tenantStorage.createPaymentHistoryRecord({
        paymentId: payment.id,
        action: "created", 
        previousData: null,
      }, tenantId);
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // ===== TENANT REGISTRATION & AUTH ENDPOINTS =====
  
  // Tenant registration with first admin user
  app.post('/api/register-tenant', async (req, res) => {
    try {
      const { 
        tenantName, 
        tenantDescription, 
        companyName, 
        contactEmail, 
        contactPhone,
        adminUsername, 
        adminPassword,
        adminEmail 
      } = req.body;
      
      // Validate required fields
      if (!tenantName || !adminUsername || !adminPassword) {
        return res.status(400).json({ error: 'Tenant name, admin username și parola sunt obligatorii' });
      }
      
      // Check if admin username already exists
      const existingUser = await storage.getUserByUsername(adminUsername);
      if (existingUser) {
        return res.status(400).json({ error: 'Username-ul există deja în sistem' });
      }
      
      // Create the tenant first
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: tenantName,
          description: tenantDescription,
          status: 'active',
          companyName,
          contactEmail,
          contactPhone,
          subscriptionPlan: 'professional'
        })
        .returning();
      
      // Hash the admin password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create the admin user for this tenant
      const adminUser = await storage.createUser({
        username: adminUsername,
        password: hashedPassword,
        email: adminEmail,
        role: 'admin',
        tenantId: newTenant.id,
        companyName: companyName
      });
      
      // Initialize order sequence for the new tenant
      await tenantStorage.initializeOrderSequence(newTenant.id);
      
      console.log(`✅ Tenant înregistrat: ${newTenant.name} (ID: ${newTenant.id}) cu admin: ${adminUsername}`);
      
      res.json({
        success: true,
        message: `Tenant "${newTenant.name}" a fost creat cu succes!`,
        tenant: {
          id: newTenant.id,
          name: newTenant.name,
          companyName: newTenant.companyName
        },
        admin: {
          username: adminUser.username,
          email: adminUser.email
        }
      });
    } catch (error) {
      console.error('Error registering tenant:', error);
      res.status(500).json({ error: 'Nu s-a putut înregistra tenant-ul' });
    }
  });
  
  // Tenant-specific login
  app.post('/api/tenant/:tenantId/login', async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username și parola sunt obligatorii' });
      }
      
      // Get user and verify tenant
      const user = await tenantStorage.getUserByUsername(username, parseInt(tenantId));
      if (!user) {
        return res.status(401).json({ error: 'Username sau parolă incorectă' });
      }
      
      // Verify tenant association
      if (user.tenantId !== parseInt(tenantId)) {
        return res.status(401).json({ error: 'Utilizatorul nu aparține acestui tenant' });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Username sau parolă incorectă' });
      }
      
      // Store user session
      req.session.userId = user.id;
      req.session.tenantId = user.tenantId;
      
      console.log(`🔐 Login reușit pentru tenant ${tenantId}: ${username}`);
      
      res.json({
        success: true,
        message: 'Autentificare reușită!',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          companyName: user.companyName
        }
      });
    } catch (error) {
      console.error('Error in tenant login:', error);
      res.status(500).json({ error: 'Eroare la autentificare' });
    }
  });
  
  // Get current tenant user
  app.get('/api/tenant/:tenantId/auth/user', async (req, res) => {
    try {
      const { tenantId } = req.params;
      const userId = req.session.userId;
      const sessionTenantId = req.session.tenantId;
      
      if (!userId || !sessionTenantId) {
        return res.status(401).json({ error: 'Nu sunteți autentificat' });
      }
      
      if (sessionTenantId !== parseInt(tenantId)) {
        return res.status(403).json({ error: 'Nu aveți acces la acest tenant' });
      }
      
      const user = await tenantStorage.getUser(userId, sessionTenantId);
      if (!user) {
        return res.status(404).json({ error: 'Utilizatorul nu a fost găsit' });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        companyName: user.companyName
      });
    } catch (error) {
      console.error('Error getting tenant user:', error);
      res.status(500).json({ error: 'Eroare la obținerea utilizatorului' });
    }
  });
  
  // ==================== ADMIN TENANT MANAGEMENT ====================
  
  // Creează tenant nou (pentru admin)
  app.post('/api/admin/create-tenant', async (req, res) => {
    try {
      const { companyName, firstName, lastName, contactEmail, contactPhone } = req.body;
      
      if (!companyName || !firstName || !lastName || !contactEmail) {
        return res.status(400).json({ error: 'Toate câmpurile obligatorii trebuie completate' });
      }

      console.log(`🏗️ Creare tenant nou: ${companyName} (${contactEmail})`);
      
      const result = await SubscriptionManager.createTenant({
        companyName,
        firstName,
        lastName,
        contactEmail,
        contactPhone: contactPhone || ''
      });

      // Notifică admin prin email despre noul tenant
      await FreeEmailService.sendEmail(
        'admin@transportpro.com', // Înlocuiește cu email-ul tău
        `🎉 Tenant nou creat: ${companyName}`,
        `
        <h2>Tenant nou creat cu succes!</h2>
        <p><strong>Companie:</strong> ${companyName}</p>
        <p><strong>Contact:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${contactEmail}</p>
        <p><strong>Telefon:</strong> ${contactPhone}</p>
        <p><strong>Username generat:</strong> ${result.credentials.username}</p>
        <p><strong>Tenant ID:</strong> ${result.tenant.id}</p>
        <p>Credențialele au fost trimise automat clientului la ${contactEmail}</p>
        `
      );

      console.log(`✅ Tenant ${companyName} creat cu succes (ID: ${result.tenant.id})`);

      res.json({
        success: true,
        message: 'Tenant creat cu succes și credențiale trimise',
        tenant: result.tenant,
        credentials: result.credentials
      });

    } catch (error: any) {
      console.error('❌ Eroare la crearea tenant-ului:', error);
      res.status(500).json({ error: error.message || 'Nu s-a putut crea tenant-ul' });
    }
  });

  // Lista tenant-urilor (pentru admin)
  app.get('/api/admin/tenants', async (req, res) => {
    try {
      const tenantsList = await db.select({
        id: tenants.id,
        name: tenants.name,
        adminEmail: tenants.adminEmail,
        contactPerson: tenants.contactPerson,
        contactPhone: tenants.contactPhone,
        status: tenants.status,
        subscriptionId: tenants.subscriptionId,
        createdAt: tenants.createdAt
      }).from(tenants).orderBy(tenants.id);

      // Adaugă username-ul adminului pentru fiecare tenant
      const tenantsWithAdmin = await Promise.all(
        tenantsList.map(async (tenant) => {
          const [adminUser] = await db.select({ username: users.username })
            .from(users)
            .where(eq(users.tenantId, tenant.id))
            .where(eq(users.role, 'admin'))
            .limit(1);

          return {
            ...tenant,
            adminUsername: adminUser?.username
          };
        })
      );

      res.json(tenantsWithAdmin);
    } catch (error: any) {
      console.error('❌ Eroare la obținerea tenant-urilor:', error);
      res.status(500).json({ error: 'Nu s-au putut obține tenant-urile' });
    }
  });

  // Webhook Stripe pentru notificare abonamente
  app.post('/api/stripe/webhook', async (req, res) => {
    try {
      const event = req.body;

      console.log('📧 Webhook Stripe primit:', event.type);

      switch (event.type) {
        case 'invoice.payment_succeeded':
          const subscription = event.data.object;
          console.log(`💰 Plată reușită pentru subscription: ${subscription.subscription}`);
          
          // Notifică admin prin email
          await FreeEmailService.sendEmail(
            'admin@transportpro.com', // Înlocuiește cu email-ul tău
            '💰 Plată nouă primită - Transport Pro',
            `
            <h2>Plată nouă primită!</h2>
            <p><strong>Subscription ID:</strong> ${subscription.subscription}</p>
            <p><strong>Sumă:</strong> ${subscription.amount_paid / 100} ${subscription.currency.toUpperCase()}</p>
            <p><strong>Email client:</strong> ${subscription.customer_email}</p>
            <p><strong>Status:</strong> ${subscription.status}</p>
            <p>Te rog să creezi tenant-ul pentru acest client în panoul de administrare.</p>
            <a href="${process.env.BASE_URL || 'http://localhost:5000'}/admin/tenants">Accesează panoul admin</a>
            `
          );
          break;

        case 'customer.subscription.created':
          console.log(`🎉 Abonament nou creat: ${event.data.object.id}`);
          break;
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('❌ Eroare webhook Stripe:', error);
      res.status(500).json({ error: 'Webhook error' });
    }
  });

  // Tenant logout
  app.post('/api/tenant/:tenantId/logout', async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ error: 'Eroare la deconectare' });
        }
        res.json({ success: true, message: 'Deconectare reușită!' });
      });
    } catch (error) {
      console.error('Error in tenant logout:', error);
      res.status(500).json({ error: 'Eroare la deconectare' });
    }
  });
  
  // ===== COMPLETE TENANT MANAGEMENT ENDPOINTS =====
  
  // List all tenants
  app.get('/api/admin/tenants', async (req, res) => {
    try {
      const allTenants = await db.select().from(tenants);
      res.json(allTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ error: 'Failed to fetch tenants' });
    }
  });
  
  // Get specific tenant details
  app.get('/api/admin/tenants/:id', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      
      res.json(tenant);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      res.status(500).json({ error: 'Failed to fetch tenant' });
    }
  });

  // Create new tenant
  app.post('/api/admin/tenants', async (req, res) => {
    try {
      const validatedData = insertTenantSchema.parse(req.body);
      
      const [newTenant] = await db
        .insert(tenants)
        .values(validatedData)
        .returning();
      
      // Initialize order sequence for new tenant
      await tenantStorage.initializeOrderSequence(newTenant.id);
      
      console.log(`✅ New tenant created: ${newTenant.name} (ID: ${newTenant.id})`);
      
      res.json({
        success: true,
        message: `Tenant "${newTenant.name}" created successfully`,
        tenant: newTenant
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      res.status(500).json({ error: 'Failed to create tenant' });
    }
  });
  
  // Update tenant
  app.put('/api/admin/tenants/:id', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const updateData = { ...req.body, updatedAt: new Date() };
      
      const [updatedTenant] = await db
        .update(tenants)
        .set(updateData)
        .where(eq(tenants.id, tenantId))
        .returning();
        
      if (!updatedTenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      
      console.log(`✅ Tenant updated: ${updatedTenant.name} (ID: ${tenantId})`);
      
      res.json({
        success: true,
        message: `Tenant "${updatedTenant.name}" updated successfully`,
        tenant: updatedTenant
      });
    } catch (error) {
      console.error('Error updating tenant:', error);
      res.status(500).json({ error: 'Failed to update tenant' });
    }
  });
  
  // Delete tenant (with safety checks)
  app.delete('/api/admin/tenants/:id', async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      
      if (tenantId === 1) {
        return res.status(400).json({ error: 'Cannot delete primary tenant (ID: 1)' });
      }
      
      // Get tenant info before deleting
      const [tenantToDelete] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
      
      if (!tenantToDelete) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      
      // Delete the tenant (note: in production, you might want to soft delete)
      await db.delete(tenants).where(eq(tenants.id, tenantId));
      
      console.log(`🗑️ Tenant deleted: ${tenantToDelete.name} (ID: ${tenantId})`);
      
      res.json({
        success: true,
        message: `Tenant "${tenantToDelete.name}" deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      res.status(500).json({ error: 'Failed to delete tenant' });
    }
  });
  
  // Tenant statistics endpoint
  app.get('/api/admin/tenant-stats', async (req, res) => {
    try {
      const allTenants = await db.select().from(tenants);
      const activeTenants = allTenants.filter(t => t.status === 'active');
      const inactiveTenants = allTenants.filter(t => t.status !== 'active');
      
      res.json({
        totalTenants: allTenants.length,
        activeTenants: activeTenants.length,
        inactiveTenants: inactiveTenants.length,
        tenants: allTenants
      });
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      res.status(500).json({ error: 'Failed to fetch tenant statistics' });
    }
  });

  // Initialize backup system after a delay
  const initializeBackup = async () => {
    try {
      const { backupManager } = await import('./backup');
      await backupManager.scheduleAutomaticBackup();
      console.log('✅ Automatic backup system initialized - daily at 02:00 AM');
    } catch (error) {
      console.error('Failed to initialize backup system:', error);
    }
  };
  
  setTimeout(initializeBackup, 2000);

  const httpServer = createServer(app);

  return httpServer;
}
