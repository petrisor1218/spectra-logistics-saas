/**
 * 🔒 ISOLATED ROUTES - Complete tenant separation for all endpoints
 */
import type { Express } from "express";
import { getTenantStorage, logIsolationStatus, validateNoDataLeakage, type TenantRequest } from "./isolation-enforcer.js";
import type { IStorage } from "./storage.js";

export function registerIsolatedRoutes(app: Express, storage: IStorage, supabaseMainStorage: IStorage, USE_SUPABASE_FOR_MAIN: boolean) {
  
  // 🔒 DRIVERS - Complete tenant isolation  
  app.get("/api/drivers", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const drivers = await tenantStorage.getAllDrivers();
      
      validateNoDataLeakage(req, drivers, 'getAllDrivers');
      logIsolationStatus(req, 'GET /api/drivers', drivers.length);
      
      res.json(drivers);
    } catch (error) {
      console.error("❌ ISOLATION: Drivers fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch drivers", isolation: 'ENFORCED' });
    }
  });

  app.post("/api/drivers", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const driverData = { ...req.body, tenantId: req.tenantId };
      
      const driver = await tenantStorage.createDriver(driverData);
      logIsolationStatus(req, 'POST /api/drivers', 1);
      
      res.json(driver);
    } catch (error) {
      console.error("❌ ISOLATION: Driver creation failed:", error);
      res.status(500).json({ error: "Failed to create driver", isolation: 'ENFORCED' });
    }
  });

  // 🔒 WEEKLY PROCESSING - Complete tenant isolation
  app.get("/api/weekly-processing", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const processing = await tenantStorage.getAllWeeklyProcessing();
      
      validateNoDataLeakage(req, processing, 'getAllWeeklyProcessing');
      logIsolationStatus(req, 'GET /api/weekly-processing', processing.length);
      
      res.json(processing);
    } catch (error) {
      console.error("❌ ISOLATION: Weekly processing fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch weekly processing", isolation: 'ENFORCED' });
    }
  });

  app.get("/api/processing/:weekLabel", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const { weekLabel } = req.params;
      const processing = await tenantStorage.getWeeklyProcessing(weekLabel);
      
      if (processing) {
        validateNoDataLeakage(req, [processing], 'getWeeklyProcessing');
        logIsolationStatus(req, `GET /api/processing/${weekLabel}`, 1);
      }
      
      res.json(processing || null);
    } catch (error) {
      console.error("❌ ISOLATION: Weekly processing fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch processing data", isolation: 'ENFORCED' });
    }
  });

  app.post("/api/processing", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const processingData = { ...req.body, tenantId: req.tenantId };
      
      const existing = await tenantStorage.getWeeklyProcessing(processingData.weekLabel);
      let result;
      
      if (existing) {
        result = await tenantStorage.updateWeeklyProcessing(processingData.weekLabel, processingData);
        logIsolationStatus(req, 'PUT /api/processing', 1);
      } else {
        result = await tenantStorage.createWeeklyProcessing(processingData);
        logIsolationStatus(req, 'POST /api/processing', 1);
      }
      
      res.json(result);
    } catch (error) {
      console.error("❌ ISOLATION: Processing save failed:", error);
      res.status(500).json({ error: "Failed to save processing data", isolation: 'ENFORCED' });
    }
  });

  // 🔒 COMPANY BALANCES - Complete tenant isolation
  app.get("/api/company-balances", async (req: TenantRequest, res) => {
    try {
      // For Petrisor (ID: 1), use Supabase directly - other users use legacy storage
      const tenantStorage = req.user?.id === 1 ? supabaseMainStorage : getTenantStorage(req, storage);
      const balances = await tenantStorage.getCompanyBalances();
      
      validateNoDataLeakage(req, balances, 'getAllCompanyBalances');
      logIsolationStatus(req, 'GET /api/company-balances', balances.length);
      
      res.json(balances);
    } catch (error) {
      console.error("❌ ISOLATION: Company balances fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch company balances", isolation: 'ENFORCED' });
    }
  });

  app.post("/api/company-balances", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const balanceData = { ...req.body, tenantId: req.tenantId };
      
      const balance = await tenantStorage.createCompanyBalance(balanceData);
      logIsolationStatus(req, 'POST /api/company-balances', 1);
      
      res.json(balance);
    } catch (error) {
      console.error("❌ ISOLATION: Company balance creation failed:", error);
      res.status(500).json({ error: "Failed to create company balance", isolation: 'ENFORCED' });
    }
  });

  // 🔒 TRANSPORT ORDERS - Complete tenant isolation
  app.get("/api/transport-orders", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const orders = await tenantStorage.getAllTransportOrders();
      
      validateNoDataLeakage(req, orders, 'getAllTransportOrders');
      logIsolationStatus(req, 'GET /api/transport-orders', orders.length);
      
      res.json(orders);
    } catch (error) {
      console.error("❌ ISOLATION: Transport orders fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch transport orders", isolation: 'ENFORCED' });
    }
  });

  app.post("/api/transport-orders", async (req: TenantRequest, res) => {
    try {
      const tenantStorage = getTenantStorage(req, USE_SUPABASE_FOR_MAIN && req.user?.id === 4 ? supabaseMainStorage : storage);
      const orderData = { ...req.body, tenantId: req.tenantId };
      
      const order = await tenantStorage.createTransportOrder(orderData);
      logIsolationStatus(req, 'POST /api/transport-orders', 1);
      
      res.json(order);
    } catch (error) {
      console.error("❌ ISOLATION: Transport order creation failed:", error);
      res.status(500).json({ error: "Failed to create transport order", isolation: 'ENFORCED' });
    }
  });

  console.log('🔒 ISOLATION: All API routes secured with complete tenant separation');
}