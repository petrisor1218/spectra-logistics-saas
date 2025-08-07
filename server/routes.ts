import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema, insertWeeklyProcessingSchema, insertTransportOrderSchema, insertCompanySchema, insertDriverSchema, insertUserSchema } from "@shared/schema";
import bcrypt from 'bcryptjs';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import Stripe from "stripe";

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  console.log('STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY.substring(0, 10));
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
} else {
  console.warn('STRIPE_SECRET_KEY not found - Stripe functionality will be disabled');
}

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
          invoice30Data
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
      const { companyName, weekLabel, paidAmount } = req.body;
      const balance = await storage.updateCompanyBalancePayment(companyName, weekLabel, paidAmount);
      res.json(balance);
    } catch (error) {
      console.error("Error updating company balance payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // Stripe subscription routes
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

      const { planId, trialDays = 3 } = req.body;
      
      // Creează customer pentru user-ul curent (dacă nu există)
      const customer = await stripe.customers.create({
        email: `test@example.com`, // În producție, va fi email-ul real al user-ului
        metadata: {
          planId,
          userId: 'demo-user'
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

      console.log(`✅ Created trial setup for ${trialDays} days - no charge during trial`);
      res.json({ 
        clientSecret: setupIntent.client_secret,
        customerId: customer.id,
        trialDays 
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        error: "Error creating subscription", 
        message: error.message 
      });
    }
  });

  // Webhook endpoint for Stripe events
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      // Handle Stripe webhook events for subscription updates
      const event = req.body;
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Handle successful subscription payment
          console.log('Subscription payment succeeded:', event.data.object);
          break;
        case 'customer.subscription.created':
          // Handle new subscription
          console.log('New subscription created:', event.data.object);
          break;
        case 'customer.subscription.updated':
          // Handle subscription updates
          console.log('Subscription updated:', event.data.object);
          break;
        default:
          console.log('Unhandled event type:', event.type);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
