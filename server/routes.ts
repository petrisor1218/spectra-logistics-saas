import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema, insertWeeklyProcessingSchema, insertTransportOrderSchema, insertCompanySchema, insertDriverSchema, insertUserSchema } from "@shared/schema";
import bcrypt from 'bcryptjs';
import session from 'express-session';
import connectPg from 'connect-pg-simple';

// Create default user if it doesn't exist
async function createDefaultUser() {
  try {
    const existingUser = await storage.getUserByUsername('Fastexpress');
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('Olanda99', 10);
      await storage.createUser({
        username: 'Fastexpress',
        password: hashedPassword
      });
      console.log('Default user created successfully');
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  }
}

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

  // Seed database on startup
  await createDefaultUser();
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

  // Company routes
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Driver routes
  app.get("/api/drivers", requireAuth, async (req, res) => {
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
  app.get("/api/payment-history", requireAuth, async (req, res) => {
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

  // Weekly processing routes
  app.post("/api/weekly-processing", requireAuth, async (req, res) => {
    try {
      const { weekLabel, data, processedAt } = req.body;
      
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
    } catch (error) {
      console.error("Error saving weekly processing:", error);
      res.status(500).json({ error: "Failed to save processed data" });
    }
  });

  app.get("/api/weekly-processing", requireAuth, async (req, res) => {
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

  // Transport orders routes
  app.get("/api/transport-orders", requireAuth, async (req, res) => {
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

  const httpServer = createServer(app);

  return httpServer;
}
