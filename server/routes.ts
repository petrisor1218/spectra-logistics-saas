import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SupabaseMainStorage } from "./supabase-main-storage.js";
import { registerTenantRoutes } from "./tenant-routes.js";
import { multiTenantManager } from "./multi-tenant-manager.js";
import { IsolationEnforcer, isolationMiddleware } from "./isolation-enforcer.js";
import supabaseMultiTenantManager from "./supabase-multi-tenant-manager.js";
import { supabaseTenantManager } from "./supabase-tenant-manager.js";
import { registerSupabaseTestRoutes } from "./supabase-test-route.js";

// Create Supabase storage instance for main user
const supabaseMainStorage = new SupabaseMainStorage(supabaseMultiTenantManager.getMainSupabase());

// Switch to use Supabase for main user (Petrisor)
const USE_SUPABASE_FOR_MAIN = true;

// Import tenant isolation enforcer
import { 
  createTenantDetectionMiddleware, 
  getTenantStorage, 
  logIsolationStatus,
  validateNoDataLeakage,
  type TenantRequest 
} from "./isolation-enforcer.js";
import { 
  companies, 
  drivers, 
  insertPaymentSchema, 
  insertWeeklyProcessingSchema, 
  insertTransportOrderSchema, 
  insertCompanySchema, 
  insertDriverSchema, 
  insertUserSchema 
} from "@shared/schema";
import bcrypt from 'bcryptjs';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import Stripe from "stripe";

let stripe: Stripe | null = null;

// Use LIVE keys if available, otherwise fall back to test keys
const stripeSecretKey = process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
console.log('🔍 Available Stripe env vars:');
console.log('- STRIPE_LIVE_SECRET_KEY:', process.env.STRIPE_LIVE_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');

if (stripeSecretKey) {
  const keyStart = stripeSecretKey.substring(0, 10);
  const isLive = stripeSecretKey.startsWith('sk_live_');
  console.log(`STRIPE_SECRET_KEY starts with: ${keyStart} (${isLive ? '🔴 LIVE MODE - PLĂȚI REALE' : '🟡 TEST MODE - CARDURI DE TEST'})`);
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-07-30.basil",
  });
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY not found - Stripe functionality will be disabled');
}

// Create default users if they don't exist
async function createDefaultUser() {
  try {
    // Create main user (Petrisor) with ID 4
    const existingPetrisor = await storage.getUserByUsername('petrisor');
    if (!existingPetrisor) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      // Create with specific ID to match migrated data
      const newUser = await storage.createUser({
        username: 'petrisor',
        email: 'petrisor@fastexpress.ro',
        password: hashedPassword,
        role: 'admin',
        tenantId: 'main'
      });
      console.log('✅ Main user "petrisor" created successfully with ID:', newUser.id);
    } else {
      console.log('✅ Main user "petrisor" already exists with ID:', existingPetrisor.id);
    }

    // Create admin user
    const existingAdmin = await storage.getUserByUsername('admin');
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await storage.createUser({
        username: 'admin',
        email: 'admin@transport.pro',
        password: hashedPassword,
        role: 'admin',
        tenantId: 'admin'
      });
      console.log('✅ Admin user created successfully');
    }
    
    // Create Fastexpress user (legacy)
    const existingUser = await storage.getUserByUsername('Fastexpress');
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('Olanda99', 10);
      await storage.createUser({
        username: 'Fastexpress',
        email: 'fastexpress@test.com',
        password: hashedPassword,
        role: 'subscriber',
        tenantId: 'tenant_fastexpress'
      });
      console.log('✅ Fastexpress user created successfully');
    }
  } catch (error) {
    console.error('Error creating default users:', error);
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
      // REMOVED: Fast & Express S.R.L. - această companie aparține utilizatorului principal (Petrisor)
      // și nu trebuie să fie în tenant databases
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
      // REMOVED: Daniel Ontheroad S.R.L. - această companie aparține utilizatorului principal (Petrisor)
      // și nu trebuie să apară în bazele de date ale tenant-ilor
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
      // REMOVED: All Fast & Express S.R.L. and Daniel Ontheroad S.R.L. drivers
      // Aceștia sunt datele personale ale utilizatorului principal (Petrisor) și nu trebuie să apară în tenant databases
      
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

  // 🔒 CRITICAL: Apply tenant isolation middleware to ALL requests
  app.use(createTenantDetectionMiddleware(storage));
  console.log('🔒 ISOLATION ENFORCER: Middleware activated for complete tenant separation');

  // Seed database on startup
  await createDefaultUser();
  await seedDatabase();

  // Import and register isolated routes
  const { registerIsolatedRoutes } = await import('./isolated-routes.js');
  registerIsolatedRoutes(app, storage, supabaseMainStorage, USE_SUPABASE_FOR_MAIN);

  // Authentication routes
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      let user = null;
      
      // For now, use main storage for all users (Supabase is empty)
      user = await storage.getUserByUsername(username);
      console.log(`🔍 LOGIN: Checking user "${username}" in main storage:`, user ? 'FOUND' : 'NOT_FOUND');
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      (req.session as any).userId = user.id;
      console.log(`✅ LOGIN: User ${user.username} (ID: ${user.id}) logged in successfully`);
      
      res.json({ 
        message: 'Login successful', 
        user: { 
          id: user.id, 
          username: user.username,
          email: user.email,
          role: user.role || 'subscriber'
        } 
      });
    } catch (error) {
      console.error('❌ LOGIN: Error occurred:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/logout', (req, res) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ error: 'Could not log out' });
        }
        // Clear the session cookie
        res.clearCookie('connect.sid');
        console.log('🚪 User logged out successfully');
        res.json({ message: 'Logout successful' });
      });
    } else {
      // No session exists, consider it a successful logout
      res.json({ message: 'Logout successful' });
    }
  });

  app.get('/api/auth/user', async (req: any, res) => {
    console.log('🔍 AUTH CHECK: Session userId:', req.session?.userId);
    if (req.session?.userId) {
      try {
        let user = null;
        
        // Use main storage for all users (Supabase migration will come later)
        user = await storage.getUser(req.session.userId);
        console.log(`🔍 AUTH: Checking user ID ${req.session.userId}:`, user ? `FOUND (${user.username})` : 'NOT_FOUND');
        
        if (user) {
          console.log(`✅ AUTH: User ${user.username} authenticated successfully`);
          res.json({ 
            id: user.id, 
            username: user.username,
            email: user.email,
            role: user.role || 'subscriber',
            tenantId: user.tenantId || 'main',
            subscriptionStatus: user.subscriptionStatus || 'inactive',
            trialEndsAt: user.trialEndsAt,
            subscriptionEndsAt: user.subscriptionEndsAt,
            stripeCustomerId: user.stripeCustomerId,
            stripeSubscriptionId: user.stripeSubscriptionId
          });
        } else {
          console.log('❌ AUTH: User not found in any storage');
          res.status(401).json({ error: 'User not found' });
        }
      } catch (error) {
        console.error('❌ AUTH: Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    } else {
      console.log('❌ AUTH: No session found');
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // Main company management routes
  app.get("/api/main-company", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Get main company from tenant database
      if (user.tenantId && user.tenantId !== 'main') {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        const { CompanyManagementExtensions } = await import('./storage-extensions.js');
        
        const mainCompany = await CompanyManagementExtensions.getMainCompany(tenantStorage);
        res.json(mainCompany || null);
      } else {
        // Legacy user - get from main database
        const { CompanyManagementExtensions } = await import('./storage-extensions.js');
        const mainCompany = await CompanyManagementExtensions.getMainCompany(storage);
        res.json(mainCompany || null);
      }
    } catch (error) {
      console.error("Error fetching main company:", error);
      res.status(500).json({ error: "Failed to fetch main company" });
    }
  });

  app.post("/api/main-company", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const companyData = req.body;
      console.log("Creating/updating main company:", companyData);

      // Save main company to tenant database
      if (user.tenantId && user.tenantId !== 'main') {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        const { CompanyManagementExtensions } = await import('./storage-extensions.js');
        
        const mainCompany = await CompanyManagementExtensions.saveMainCompany(tenantStorage, companyData);
        console.log(`✅ Main company saved for tenant ${user.tenantId}:`, mainCompany.name);
        res.status(201).json(mainCompany);
      } else {
        // Legacy user - save to main database
        const { CompanyManagementExtensions } = await import('./storage-extensions.js');
        const mainCompany = await CompanyManagementExtensions.saveMainCompany(storage, companyData);
        console.log(`✅ Main company saved for legacy user:`, mainCompany.name);
        res.status(201).json(mainCompany);
      }
    } catch (error: any) {
      console.error("Error saving main company:", error);
      res.status(500).json({ 
        error: "Failed to save main company",
        details: error.message
      });
    }
  });

  app.put("/api/main-company", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const companyData = req.body;
      console.log("Updating main company:", companyData);

      // Update main company in tenant database
      if (user.tenantId && user.tenantId !== 'main') {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        const { CompanyManagementExtensions } = await import('./storage-extensions.js');
        
        const mainCompany = await CompanyManagementExtensions.saveMainCompany(tenantStorage, companyData);
        console.log(`✅ Main company updated for tenant ${user.tenantId}:`, mainCompany.name);
        res.json(mainCompany);
      } else {
        // Legacy user - update in main database
        const { CompanyManagementExtensions } = await import('./storage-extensions.js');
        const mainCompany = await CompanyManagementExtensions.saveMainCompany(storage, companyData);
        console.log(`✅ Main company updated for legacy user:`, mainCompany.name);
        res.json(mainCompany);
      }
    } catch (error: any) {
      console.error("Error updating main company:", error);
      res.status(500).json({ 
        error: "Failed to update main company",
        details: error.message
      });
    }
  });

  // 🔒 COMPANIES - Complete tenant isolation
  app.get("/api/companies", async (req: TenantRequest, res) => {
    try {
      // For now, use main storage for Petrisor, tenant storage for others
      const tenantStorage = getTenantStorage(req, storage);
      const companies = await tenantStorage.getAllCompanies();
      
      validateNoDataLeakage(req, companies, 'getAllCompanies');
      logIsolationStatus(req, 'GET /api/companies', companies.length);
      
      res.json(companies);
    } catch (error) {
      console.error("❌ ISOLATION: Companies fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch companies", isolation: 'ENFORCED' });
    }
  });

  app.post("/api/companies", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const companyData = { ...req.body, tenantId: req.tenantId };
      
      const company = await tenantStorage.createCompany(companyData);
      logIsolationStatus(req, 'POST /api/companies', 1);
      
      res.json(company);
    } catch (error) {
      console.error("❌ ISOLATION: Company creation failed:", error);
      res.status(500).json({ error: "Failed to create company", isolation: 'ENFORCED' });
    }
  });



  // 🚨 REMOVED - These routes moved to isolated-routes.ts for proper tenant isolation

  // 🔒 PAYMENTS - Complete tenant isolation
  app.get("/api/payments", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const { weekLabel } = req.query;
      
      let payments: any[] = [];
      if (weekLabel) {
        payments = await tenantStorage.getPaymentsByWeek(weekLabel as string);
      } else {
        payments = await tenantStorage.getAllPayments();
      }
      
      validateNoDataLeakage(req, payments, 'getAllPayments');
      logIsolationStatus(req, 'GET /api/payments', payments.length);
      
      res.json(payments);
    } catch (error) {
      console.error("❌ ISOLATION: Payments fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch payments", isolation: 'ENFORCED' });
    }
  });

  app.post("/api/payments", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const paymentData = { ...req.body, tenantId: req.tenantId };
      
      const payment = await tenantStorage.createPayment(paymentData);
      logIsolationStatus(req, 'POST /api/payments', 1);
      
      res.json(payment);
    } catch (error) {
      console.error("❌ ISOLATION: Payment creation failed:", error);
      res.status(500).json({ error: "Failed to create payment", isolation: 'ENFORCED' });
    }
  });

  // 🚨 REMOVED - Duplicate route, moved to isolated-routes.ts for proper tenant isolation

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

  // Weekly processing routes
  app.post("/api/weekly-processing", async (req, res) => {
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

  app.get("/api/weekly-processing", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const { weekLabel } = req.query;
      let processing;

      // Apply tenant isolation for weekly processing
      if (user.tenantId && user.tenantId !== 'main') {
        // Tenant user - read from tenant database
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        
        if (weekLabel) {
          processing = await tenantStorage.getWeeklyProcessingByWeek(weekLabel as string);
        } else {
          processing = await tenantStorage.getAllWeeklyProcessing();
        }
        console.log(`🔒 Tenant isolation: User ${user.username} sees ${Array.isArray(processing) ? processing.length : (processing ? 1 : 0)} weekly processing from tenant ${user.tenantId}`);
      } else {
        // Legacy users (no tenantId) - see all existing data
        if (weekLabel) {
          processing = await storage.getWeeklyProcessingByWeek(weekLabel as string);
        } else {
          processing = await storage.getAllWeeklyProcessing();
        }
        console.log(`👑 Legacy user access: User ${user.username} sees weekly processing data`);
      } 
      
      // Additional fallback check
      if (!user.tenantId && user.email !== 'petrisor@fastexpress.ro' && user.username !== 'petrisor') {
        // Safety fallback
        processing = weekLabel ? null : [];
        console.log(`⚠️ Unknown user ${user.username} - no weekly processing access`);
      }

      res.json(processing);
    } catch (error) {
      console.error("Error fetching weekly processing:", error);
      res.status(500).json({ error: "Failed to fetch weekly processing data" });
    }
  });

  // Transport orders routes with tenant isolation
  app.get("/api/transport-orders", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const { weekLabel, companyName } = req.query;
      let orders: any[] = [];

      // Apply tenant isolation for transport orders
      if (user.tenantId && user.tenantId !== 'main') {
        // Tenant user - read from tenant database
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        
        if (weekLabel) {
          orders = await tenantStorage.getTransportOrdersByWeek(weekLabel as string);
        } else if (companyName) {
          orders = await tenantStorage.getTransportOrdersByCompany(companyName as string);
        } else {
          orders = await tenantStorage.getAllTransportOrders();
        }
        console.log(`🔒 Tenant isolation: User ${user.username} sees ${orders.length} transport orders from tenant ${user.tenantId}`);
      } else if (user.email === 'petrisor@fastexpress.ro' || user.username === 'petrisor') {
        // Owner - see all existing data with filters
        if (weekLabel) {
          orders = await storage.getTransportOrdersByWeek(weekLabel as string);
        } else if (companyName) {
          orders = await storage.getTransportOrdersByCompany(companyName as string);
        } else {
          orders = await storage.getAllTransportOrders();
        }
        console.log(`👑 Admin access: User ${user.username} sees ${orders.length} transport orders`);
      } else {
        // Safety fallback
        orders = [];
        console.log(`⚠️ Unknown user ${user.username} - no transport orders access`);
      }

      res.json(orders);
    } catch (error) {
      console.error("Error fetching transport orders:", error);
      res.status(500).json({ error: "Failed to fetch transport orders" });
    }
  });

  // Get next order number
  app.get("/api/next-order-number", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      let nextNumber;
      
      // Use tenant-specific database for order number
      if (user.tenantId && user.tenantId !== 'main') {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        
        nextNumber = await tenantStorage.getNextOrderNumber();
        console.log(`📋 Next order number for tenant ${user.tenantId}: ${nextNumber}`);
      } else {
        // Main user - use regular storage
        nextNumber = await storage.getNextOrderNumber();
      }
      
      res.json({ orderNumber: nextNumber });
    } catch (error) {
      console.error("Error getting next order number:", error);
      res.status(500).json({ error: "Failed to get next order number" });
    }
  });

  // Order sequence management routes (removed - duplicate route exists below)

  // GET order sequence
  app.get("/api/order-sequence", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Use tenant-specific database for order sequence
      if (user.tenantId && user.tenantId !== 'main') {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        
        const sequence = await tenantStorage.getOrderSequence();
        if (!sequence) {
          await tenantStorage.initializeOrderSequence();
          const newSequence = await tenantStorage.getOrderSequence();
          res.json(newSequence);
        } else {
          res.json(sequence);
        }
      } else {
        const sequence = await storage.getOrderSequence();
        res.json(sequence);
      }
    } catch (error) {
      console.error("Error fetching order sequence:", error);
      res.status(500).json({ error: "Failed to fetch order sequence" });
    }
  });

  // PUT order sequence
  app.put("/api/order-sequence", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Allow any authenticated user to modify order sequence for their workflow
      // This is a tenant-specific setting that affects their order numbering

      const { currentNumber } = req.body;
      if (!currentNumber || currentNumber < 1) {
        return res.status(400).json({ error: 'Current number must be greater than 0' });
      }

      // Use tenant-specific database for order sequence
      if (user.tenantId && user.tenantId !== 'main') {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        
        const updatedSequence = await tenantStorage.updateOrderSequence(currentNumber);
        res.json(updatedSequence);
      } else {
        const updatedSequence = await storage.updateOrderSequence(currentNumber);
        res.json(updatedSequence);
      }
    } catch (error) {
      console.error("Error updating order sequence:", error);
      res.status(500).json({ error: "Failed to update order sequence" });
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
      
      // If password is provided, hash it
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
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
      
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        return res.status(400).json({ 
          error: 'Username, email and password are required' 
        });
      }
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Username already exists' 
        });
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      res.json({ 
        message: 'User created successfully', 
        user: newUser
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

  // Public registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        companyName,
        role = 'subscriber',
        subscriptionStatus = 'trialing'
      } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName || !companyName) {
        return res.status(400).json({
          error: 'All fields are required: username, email, password, firstName, lastName, companyName'
        });
      }

      // Validate that reservation still exists and user doesn't exist yet
      // This prevents race conditions where user was created between reservation and registration

      // Check if username or email already exists in main users table
      const [existingUser, existingEmailUser] = await Promise.all([
        storage.getUserByUsername(username),
        storage.getUserByEmail(email)
      ]);

      if (existingUser) {
        // Release reservation if username was taken between reservation and registration
        await storage.releaseReservation(username);
        return res.status(400).json({ 
          error: 'Username already exists' 
        });
      }

      if (existingEmailUser) {
        // Release reservation if email was taken between reservation and registration
        await storage.releaseReservation(username);
        return res.status(400).json({ 
          error: 'Email already exists' 
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique tenant ID for complete data isolation
      const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the user with isolated tenant
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        companyName,
        role,
        subscriptionStatus,
        tenantId: tenantId, // Each user gets isolated data space
        trialEndsAt: subscriptionStatus === 'trialing' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null
      });
      
      console.log(`🔒 NEW TENANT CREATED: ${tenantId} for user: ${username}`);
      console.log(`✅ User has isolated database - no access to existing data`);

      // Creează baza de date separată pentru noul tenant folosind noul multi-tenant manager
      try {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        await multiTenantManager.createTenantDatabase(tenantId);
        console.log(`✅ Successfully created separate database for user ${username} (tenant: ${tenantId})`);
        
        // Obține statistici despre sistemul multi-tenant
        const stats = multiTenantManager.getSystemStats();
        console.log(`📊 Multi-tenant system stats: ${stats.totalTenants}/${stats.maxTenants} tenants active`);
      } catch (dbError) {
        console.error(`❌ Failed to create separate database for tenant ${tenantId}:`, dbError);
        // Nu întrerup procesul de înregistrare pentru că utilizatorul a fost deja creat
        // Va folosi sistemul existent cu tenant_id până când problema se rezolvă
      }

      // Release the username reservation after successful creation
      await storage.releaseReservation(username);

      // Auto-login the new user after successful registration
      if (req.session) {
        req.session.userId = newUser.id;
        console.log(`🔐 Auto-logged in new user: ${username} (ID: ${newUser.id})`);
      }

      // Don't return the password in the response
      const { password: _, ...userResponse } = newUser;

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  // Username reservation endpoint (to prevent race conditions)
  app.post('/api/auth/reserve-username', async (req, res) => {
    try {
      const { username, email } = req.body;

      if (!username || !email) {
        return res.status(400).json({
          error: 'Username and email are required'
        });
      }

      // Check if username or email already exists in main users table
      const [existingUser, existingEmailUser] = await Promise.all([
        storage.getUserByUsername(username),
        storage.getUserByEmail(email)
      ]);

      if (existingUser) {
        // Release reservation if username was taken between reservation and registration
        await storage.releaseReservation(username);
        return res.status(400).json({ 
          error: 'Username already exists' 
        });
      }

      if (existingEmailUser) {
        // Release reservation if email was taken between reservation and registration
        await storage.releaseReservation(username);
        return res.status(400).json({ 
          error: 'Email already exists' 
        });
      }

      // Reserve the username
      const token = await storage.reserveUsername(username, email);

      res.json({
        success: true,
        token,
        message: 'Username reserved successfully'
      });
    } catch (error) {
      console.error('Error reserving username:', error);
      res.status(400).json({ 
        error: 'Username or email already taken' 
      });
    }
  });

  // Username availability check endpoint
  app.post('/api/auth/check-username', async (req, res) => {
    try {
      const { username } = req.body;

      if (!username || username.length < 3) {
        return res.json({
          available: false,
          message: 'Numele de utilizator trebuie să aibă cel puțin 3 caractere'
        });
      }

      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        res.json({
          available: false,
          message: 'Acest nume de utilizator este deja folosit'
        });
      } else {
        res.json({
          available: true,
          message: 'Nume de utilizator disponibil'
        });
      }
    } catch (error) {
      console.error('Error checking username:', error);
      res.status(500).json({
        available: false,
        message: 'Eroare la verificarea numelui de utilizator'
      });
    }
  });

  app.post("/api/transport-orders", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Allow tenant users to create transport orders in their own database
      if (user.tenantId && user.tenantId !== 'main') {
        // Tenant user - use their isolated database
        console.log(`🚛 Creating transport order for tenant user: ${user.username}`);
      } else if (user.email !== 'petrisor@fastexpress.ro' && user.username !== 'petrisor') {
        // Main database - only allow owner
        return res.status(403).json({ error: 'Access denied - admin only' });
      }

      console.log("Received transport order data:", req.body);
      
      // Convert orderDate string to Date object if needed
      const orderData = {
        ...req.body,
        orderDate: new Date(req.body.orderDate)
      };
      
      console.log("Processed order data:", orderData);
      
      const validatedData = insertTransportOrderSchema.parse(orderData);
      let order;
      
      // Use tenant-specific database for transport order creation
      if (user.tenantId && user.tenantId !== 'main') {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        
        console.log(`🚛 Creating transport order in tenant database ${user.tenantId}`);
        order = await tenantStorage.createTransportOrder(validatedData);
        console.log(`✅ Transport order created successfully in tenant ${user.tenantId}: ${order.id}`);
      } else {
        // Main user - use regular storage
        order = await storage.createTransportOrder(validatedData);
        console.log(`👑 Legacy transport order created: ${order.id}`);
      }
      
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

  // REMOVED: Duplicate companies route - using single route above with complete isolation

  app.post("/api/companies", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const validatedData = insertCompanySchema.parse(req.body);
      
      let company;
      
      // CRITICAL ISOLATION: Enforce strict database separation
      if (!user.tenantId) {
        // MAIN USER (Petrisor) - MAIN database ONLY
        console.log(`👑 MAIN USER: Creating company in MAIN database for ${user.username}`);
        company = await storage.createCompany(validatedData);
        console.log(`✅ MAIN USER: Company created in MAIN database: ${company.name}`);
      } else {
        // TENANT USER - SEPARATE database ONLY
        console.log(`🔒 TENANT USER: Creating company in SEPARATE database for ${user.username} (tenant: ${user.tenantId})`);
        try {
          const { multiTenantManager } = await import('./multi-tenant-manager.js');
          const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
          company = await tenantStorage.createCompany(validatedData);
          console.log(`✅ TENANT USER: Company created in SEPARATE database: ${company.name}`);
        } catch (error) {
          console.error(`❌ CRITICAL: Error creating company in tenant database:`, error);
          throw error;
        }
      }

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
      
      // Get user for tenant isolation
      const user = await storage.getUser(req.session?.userId);
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      let company;
      
      // Use tenant-specific database for company update
      if (user.tenantId && user.tenantId !== 'main') {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        
        console.log(`📝 Updating company ${id} in tenant database ${user.tenantId}`);
        company = await tenantStorage.updateCompany(id, validatedData);
        console.log(`✅ Successfully updated company ${id} in tenant ${user.tenantId}`);
      } else {
        // Main user - use regular storage
        company = await storage.updateCompany(id, validatedData);
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get user for tenant isolation
      const user = await storage.getUser(req.session?.userId);
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Use tenant-specific database for company deletion
      if (user.tenantId && user.tenantId !== 'main') {
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        
        console.log(`🗑️ ROUTE: Deleting company ${id} from tenant database ${user.tenantId}`);
        console.log(`🔍 ROUTE: Using tenantStorage.deleteCompany(${id})`);
        
        // Delete from tenant database
        await tenantStorage.deleteCompany(id);
        console.log(`✅ ROUTE: Successfully deleted company ${id} from tenant ${user.tenantId}`);
      } else {
        // Main user - use regular storage
        await storage.deleteCompany(id);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Driver management routes with company join and tenant isolation
  app.get("/api/drivers", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      let drivers: any[], companies: any[];

      // Apply tenant isolation for drivers using multi-tenant system
      if (user.tenantId && user.tenantId !== 'main') {
        // New user - get only their tenant data from separate database
        try {
          const { multiTenantManager } = await import('./multi-tenant-manager.js');
          const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
          
          drivers = await tenantStorage.getAllDrivers();
          companies = await tenantStorage.getAllCompanies();
          console.log(`👥 Separate DB: User ${user.username} accessing tenant database ${user.tenantId}`);
          console.log(`✅ Separate DB: User ${user.username} sees ${drivers.length} drivers from separate database`);
        } catch (error) {
          console.error(`❌ Error accessing tenant database for ${user.username}:`, error);
          drivers = [];
          companies = [];
        }
      } else if (user.email === 'petrisor@fastexpress.ro' || user.username === 'petrisor') {
        // Owner - see all existing data from main database
        drivers = await storage.getAllDrivers();
        companies = await storage.getAllCompanies();
        console.log(`👑 Admin access: User ${user.username} sees ${drivers.length} drivers`);
      } else {
        // Safety fallback
        drivers = [];
        companies = [];
        console.log(`⚠️ Unknown user ${user.username} - no drivers access`);
      }
      
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

  app.post("/api/drivers", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const validatedData = insertDriverSchema.parse(req.body);
      console.log(`🚛 Creating driver for user: ${user.username} (tenant: ${user.tenantId})`);
      
      let driver;
      let tenantStorage;
      
      if (user.tenantId && user.tenantId !== 'main') {
        // PROFESSIONAL LOGIC: Robust tenant driver creation with auto-recovery
        console.log(`🔒 Creating driver in tenant database: ${user.tenantId}`);
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        
        // Validate company exists before creating driver
        const companyId = validatedData.companyId;
        if (companyId) {
          try {
            const companies = await tenantStorage.getAllCompanies();
            const companyExists = companies.find((c: any) => c.id === companyId);
            
            if (!companyExists) {
              console.log(`🔄 RECUPERARE AUTOMATĂ: Company ID ${companyId} nu există în tenant. Încerc fallback...`);
              
              // Find any available transport company as fallback
              const fallbackCompany = companies.find((c: any) => !c.isMainCompany);
              if (fallbackCompany) {
                console.log(`✅ RECUPERARE REUȘITĂ: Folosesc compania fallback: ${fallbackCompany.name} (ID: ${fallbackCompany.id})`);
                validatedData.companyId = fallbackCompany.id;
              } else {
                return res.status(400).json({ 
                  error: 'No transport companies available',
                  details: 'Nu există companii de transport în sistem. Adaugă o companie de transport mai întâi.'
                });
              }
            }
          } catch (companyCheckError) {
            console.error('❌ Eroare la verificarea companiei:', companyCheckError);
          }
        }
        
        driver = await tenantStorage.createDriver(validatedData);
        console.log(`✅ Driver created successfully in tenant ${user.tenantId}: ${driver.name}`);
      } else {
        // Utilizator legacy - folosește sistemul vechi
        console.log(`👑 Creating driver in legacy system for user: ${user.username}`);
        driver = await storage.createDriver(validatedData);
        console.log(`✅ Legacy driver created: ${driver.name}`);
      }

      res.json(driver);
    } catch (error) {
      console.error("❌ Error creating driver:", error);
      console.error("Error details:", error);
      
      // Enhanced error response for debugging
      let errorMessage = 'Failed to create driver';
      let errorDetails = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof Error && 'code' in error && error.code === '23503') {
        errorMessage = 'Company reference error';
        errorDetails = `Compania specificată nu există în sistem. Sistemul va încerca recuperarea automată.`;
      }
      
      res.status(500).json({ 
        error: errorMessage, 
        details: errorDetails,
        code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN'
      });
    }
  });

  app.put("/api/drivers/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDriverSchema.partial().parse(req.body);
      
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user for tenant isolation
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      let driver;
      
      // CRITICAL ISOLATION: Enforce strict database separation
      if (!user.tenantId) {
        // MAIN USER (Petrisor) - MAIN database ONLY  
        console.log(`👑 MAIN USER: Updating driver ${id} in MAIN database for ${user.username}`);
        driver = await storage.updateDriver(id, validatedData);
        console.log(`✅ MAIN USER: Driver updated in MAIN database`);
      } else {
        // TENANT USER - SEPARATE database ONLY
        console.log(`🔒 TENANT USER: Updating driver ${id} in SEPARATE database for ${user.username} (tenant: ${user.tenantId})`);
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        driver = await tenantStorage.updateDriver(id, validatedData);
        console.log(`✅ TENANT USER: Driver updated in SEPARATE database`);
      }
      
      res.json(driver);
    } catch (error) {
      console.error("Error updating driver:", error);
      res.status(500).json({ error: "Failed to update driver" });
    }
  });

  app.delete("/api/drivers/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user for tenant isolation
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // CRITICAL ISOLATION: Enforce strict database separation  
      if (!user.tenantId) {
        // MAIN USER (Petrisor) - MAIN database ONLY
        console.log(`👑 MAIN USER: Deleting driver ${id} from MAIN database for ${user.username}`);
        await storage.deleteDriver(id);
        console.log(`✅ MAIN USER: Driver deleted from MAIN database`);
      } else {
        // TENANT USER - SEPARATE database ONLY
        console.log(`🔒 TENANT USER: Deleting driver ${id} from SEPARATE database for ${user.username} (tenant: ${user.tenantId})`);
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        await tenantStorage.deleteDriver(id);
        console.log(`✅ TENANT USER: Driver deleted from SEPARATE database`);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ error: "Failed to delete driver" });
    }
  });

  // Company balance endpoints
  app.get("/api/company-balances", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Apply tenant isolation for company balances
      let balances: any[] = [];
      if (user.tenantId && user.tenantId !== 'main') {
        // Tenant user - read from tenant database
        const { multiTenantManager } = await import('./multi-tenant-manager.js');
        const tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
        balances = await tenantStorage.getCompanyBalances();
        console.log(`🔒 Tenant isolation: User ${user.username} sees ${balances.length} balances from tenant ${user.tenantId}`);
      } else {
        // Legacy users (no tenantId) - see all existing data
        balances = await storage.getCompanyBalances();
        console.log(`👑 Legacy user access: User ${user.username} sees ${balances.length} balances`);
      }

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

  // Create or update Transport Pro product in Stripe with complete description
  app.post("/api/create-stripe-product", async (req, res) => {
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

      // Create or get the Transport Pro product with comprehensive description
      let product;
      try {
        // Try to find existing product
        const products = await stripe.products.list({ 
          active: true,
          limit: 100 
        });
        product = products.data.find(p => p.name === 'Transport Pro');
        
        if (!product) {
          // Create the product if it doesn't exist
          product = await stripe.products.create({
            name: 'Transport Pro',
            description: 'Platformă avansată de management transport cu automatizare inteligentă și design modern glassmorphism. Include: Gestionare comenzi transport cu auto-numerotare, calculatoare comisioane personalizabile per companie (2% Fast Express, 4% altele), generare PDF automată cu toate datele companiei și diacritice românești, urmărire plăți în timp real cu status inteligent și rounding pentru diferențe sub 1€, dashboard analitică cu statistici live și export Excel/CSV, istorică VRID cross-săptămână pentru trip matching, sistem multi-companii cu izolare completă date per tenant, monitorizare balanțe companii cu sincronizare automată din calendar și payment history, notificări inteligente pentru plăți și status changes, securitate avansată cu role-based access (admin/subscriber), interfață responsive glassmorphism pentru desktop și mobile, backup automat și recovery sistem, trial 3 zile gratuit.',
            images: [],
            metadata: {
              features: 'transport_orders,auto_numbering,commission_calc_2_4_percent,pdf_generation_romanian_diacritics,real_time_payment_tracking,smart_status_rounding,analytics_dashboard,excel_csv_export,vrid_cross_week_history,multi_tenant_isolation,balance_monitoring_sync,calendar_integration,payment_history,smart_notifications,role_based_security,glassmorphism_responsive_ui,auto_backup_recovery',
              trial_days: '3',
              billing_interval: 'monthly',
              category: 'logistics_management',
              target_users: 'transport_companies,logistics_operators,fleet_managers',
              price_eur: '99.99',
              commission_rates: 'fast_express_2_percent_others_4_percent',
              ui_design: 'glassmorphism_dark_light_mode',
              database: 'postgresql_neon_multi_tenant',
              authentication: 'stripe_subscription_based'
            }
          });
          console.log('✅ Created Transport Pro product in Stripe with complete description');
        } else {
          // Update existing product with new description
          product = await stripe.products.update(product.id, {
            description: 'Platformă avansată de management transport cu automatizare inteligentă și design modern glassmorphism. Include: Gestionare comenzi transport cu auto-numerotare, calculatoare comisioane personalizabile per companie (2% Fast Express, 4% altele), generare PDF automată cu toate datele companiei și diacritice românești, urmărire plăți în timp real cu status inteligent și rounding pentru diferențe sub 1€, dashboard analitică cu statistici live și export Excel/CSV, istorică VRID cross-săptămână pentru trip matching, sistem multi-companii cu izolare completă date per tenant, monitorizare balanțe companii cu sincronizare automată din calendar și payment history, notificări inteligente pentru plăți și status changes, securitate avansată cu role-based access (admin/subscriber), interfață responsive glassmorphism pentru desktop și mobile, backup automat și recovery sistem, trial 3 zile gratuit.',
            metadata: {
              features: 'transport_orders,auto_numbering,commission_calc_2_4_percent,pdf_generation_romanian_diacritics,real_time_payment_tracking,smart_status_rounding,analytics_dashboard,excel_csv_export,vrid_cross_week_history,multi_tenant_isolation,balance_monitoring_sync,calendar_integration,payment_history,smart_notifications,role_based_security,glassmorphism_responsive_ui,auto_backup_recovery',
              trial_days: '3',
              billing_interval: 'monthly',
              category: 'logistics_management',
              target_users: 'transport_companies,logistics_operators,fleet_managers',
              price_eur: '99.99',
              commission_rates: 'fast_express_2_percent_others_4_percent',
              ui_design: 'glassmorphism_dark_light_mode',
              database: 'postgresql_neon_multi_tenant',
              authentication: 'stripe_subscription_based',
              updated_at: new Date().toISOString()
            }
          });
          console.log('✅ Updated Transport Pro product in Stripe with complete description');
        }
      } catch (productError) {
        console.error('Error with product:', productError);
        throw productError;
      }

      // Create or get the price for this product (€99.99/month)
      let price;
      try {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true
        });
        price = prices.data.find(p => p.unit_amount === 9999 && p.currency === 'eur');
        
        if (!price) {
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: 9999, // €99.99 in cents
            currency: 'eur',
            recurring: {
              interval: 'month'
            },
            metadata: {
              plan_name: 'Transport Pro Monthly',
              trial_days: '3',
              features: 'all_transport_management_features'
            }
          });
          console.log('✅ Created Transport Pro price in Stripe (€99.99/month)');
        }
      } catch (priceError) {
        console.error('Error with price:', priceError);
        throw priceError;
      }

      res.json({
        success: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata
        },
        price: {
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval
        },
        message: 'Transport Pro product created/updated successfully in Stripe'
      });
    } catch (error: any) {
      console.error('Error creating/updating Stripe product:', error);
      res.status(500).json({ 
        error: 'Failed to create/update Stripe product', 
        message: error.message 
      });
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
  // Card verification endpoint - test with small amount then cancel
  app.post("/api/verify-card", async (req, res) => {
    try {
      const { paymentMethodId, amount, currency } = req.body;

      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      // Create a payment intent to test the card
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // amount in cents
        currency: currency || 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${req.protocol}://${req.get('host')}/subscription-success`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      // If successful, return the payment intent ID so we can cancel it
      res.json({ 
        success: true, 
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status 
      });

    } catch (error: any) {
      console.error("Card verification error:", error);
      
      // Return user-friendly error messages
      let errorMessage = "Card verification failed";
      if (error.code === 'card_declined') {
        if (error.decline_code === 'test_mode_live_card') {
          errorMessage = "Pentru testare, folosește carduri de test Stripe: 4242 4242 4242 4242 (orice CVC/dată viitoare). Pentru carduri reale, configurează cheile LIVE.";
        } else {
          errorMessage = "Cardul a fost respins de către bancă";
        }
      } else if (error.code === 'insufficient_funds') {
        errorMessage = "Fonduri insuficiente pe card";
      } else if (error.code === 'incorrect_cvc') {
        errorMessage = "Codul CVC este incorect";
      } else if (error.code === 'expired_card') {
        errorMessage = "Cardul a expirat";
      } else if (error.code === 'incorrect_number') {
        errorMessage = "Numărul cardului este incorect";
      }

      res.status(400).json({ error: errorMessage });
    }
  });

  // Cancel payment endpoint - immediately cancel the test payment
  app.post("/api/cancel-payment", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      // Cancel the payment intent immediately
      const canceledPayment = await stripe.paymentIntents.cancel(paymentIntentId);

      res.json({ 
        success: true, 
        status: canceledPayment.status 
      });

    } catch (error: any) {
      console.error("Payment cancellation error:", error);
      res.status(400).json({ error: "Failed to cancel payment" });
    }
  });

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

  // Email availability check endpoint
  app.post('/api/auth/check-email', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.json({
          available: false,
          message: 'Adresa de email nu este validă'
        });
      }

      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        res.json({
          available: false,
          message: 'Această adresă de email este deja înregistrată'
        });
      } else {
        res.json({
          available: true,
          message: 'Email disponibil'
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
      res.status(500).json({
        available: false,
        message: 'Eroare la verificarea email-ului'
      });
    }
  });

  // Delete user endpoint (admin only)
  app.delete('/api/admin/users/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent deleting admin users and main account (safety check)
      if (user.role === 'admin') {
        return res.status(403).json({ error: 'Cannot delete admin users' });
      }

      // Prevent deleting the main account
      if (user.email === 'petrisor@fastexpress.ro' || user.username === 'petrisor') {
        return res.status(403).json({ error: 'Cannot delete the main account' });
      }

      // Delete the user
      await storage.deleteUser(userId);
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Health check endpoint for Railway deployment
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Înregistrează rutele pentru funcționalitatea multi-tenant
  registerTenantRoutes(app);
  
  // Register Supabase test routes
  registerSupabaseTestRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
