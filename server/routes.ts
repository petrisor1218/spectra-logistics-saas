import express from "express";
import { createServer } from "http";
import { tenantMiddleware, requireAuth, requireAdmin, requireSuperAdmin, TenantRequest } from "./middleware/tenant.js";
import { TenantManager } from "./tenant-manager.js";
import { secondaryDb } from "./db-secondary.js";
import { tenants, tenantActivityLogs, systemMetrics } from "../shared/schema-secondary.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function registerRoutes(app: express.Application) {
  const server = createServer(app);
  
  // Middleware pentru toate rutele
  app.use(tenantMiddleware);
  
  // Rute pentru landing page și autentificare
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  
  // Rute pentru înregistrarea tenantilor
  app.post("/api/tenants/register", async (req, res) => {
    try {
      const { name, subdomain, contactEmail, contactPhone, companyName, adminUser } = req.body;
      
      // Validare
      if (!name || !subdomain || !contactEmail || !companyName || !adminUser) {
        return res.status(400).json({ error: "All required fields must be provided" });
      }
      
      // Verifică dacă subdomain-ul este disponibil
      const existingTenant = await TenantManager.getTenantBySubdomain(subdomain);
      if (existingTenant) {
        return res.status(409).json({ error: "Subdomain already exists" });
      }
      
      // Creează tenantul
      const result = await TenantManager.createTenant({
        name,
        subdomain,
        contactEmail,
        contactPhone,
        companyName,
        adminUser,
      });
      
      res.status(201).json({
        message: "Tenant created successfully",
        tenant: {
          id: result.tenant.id,
          subdomain: result.tenant.subdomain,
          status: result.tenant.status,
          trialEndsAt: result.tenant.trialEndsAt,
        },
      });
    } catch (error) {
      console.error("Error registering tenant:", error);
      res.status(500).json({ error: "Failed to register tenant" });
    }
  });
  
  // Rute pentru Stripe webhooks
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!sig || !endpointSecret) {
      return res.status(400).json({ error: "Missing signature or endpoint secret" });
    }
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }
    
    try {
      await TenantManager.processStripeEvent(event);
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  
  // Rute pentru super admin dashboard
  app.get("/api/admin/tenants", requireSuperAdmin, async (req, res) => {
    try {
      const allTenants = await TenantManager.getAllTenants();
      res.json({ tenants: allTenants });
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });
  
  app.get("/api/admin/metrics", requireSuperAdmin, async (req, res) => {
    try {
      const mrr = await TenantManager.calculateMRR();
      const activeTenants = await secondaryDb
        .select()
        .from(tenants)
        .where(eq(tenants.subscriptionStatus, "active"));
      
      const trialTenants = await secondaryDb
        .select()
        .from(tenants)
        .where(eq(tenants.status, "trial"));
      
      res.json({
        mrr,
        activeTenantsCount: activeTenants.length,
        trialTenantsCount: trialTenants.length,
        totalTenantsCount: activeTenants.length + trialTenants.length,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });
  
  app.post("/api/admin/tenants/:id/suspend", requireSuperAdmin, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      await TenantManager.updateTenantStatus(tenantId, "suspended");
      res.json({ message: "Tenant suspended successfully" });
    } catch (error) {
      console.error("Error suspending tenant:", error);
      res.status(500).json({ error: "Failed to suspend tenant" });
    }
  });
  
  app.post("/api/admin/tenants/:id/activate", requireSuperAdmin, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      await TenantManager.updateTenantStatus(tenantId, "active");
      res.json({ message: "Tenant activated successfully" });
    } catch (error) {
      console.error("Error activating tenant:", error);
      res.status(500).json({ error: "Failed to activate tenant" });
    }
  });
  
  app.delete("/api/admin/tenants/:id", requireSuperAdmin, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      await TenantManager.deleteTenant(tenantId);
      res.json({ message: "Tenant deleted successfully" });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ error: "Failed to delete tenant" });
    }
  });
  
  // Rute pentru tenantii (cu middleware de autentificare)
  app.get("/api/companies", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const companies = await tenantDb.select().from(import("../shared/schema.js").companies);
      res.json({ companies });
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });
  
  app.post("/api/companies", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const { companies } = await import("../shared/schema.js");
      const { insertCompanySchema } = await import("../shared/schema.js");
      
      const validatedData = insertCompanySchema.parse(req.body);
      const [company] = await tenantDb.insert(companies).values(validatedData).returning();
      
      res.status(201).json({ company });
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });
  
  app.get("/api/drivers", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const drivers = await tenantDb.select().from(import("../shared/schema.js").drivers);
      res.json({ drivers });
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });
  
  app.post("/api/drivers", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const { drivers } = await import("../shared/schema.js");
      const { insertDriverSchema } = await import("../shared/schema.js");
      
      const validatedData = insertDriverSchema.parse(req.body);
      const [driver] = await tenantDb.insert(drivers).values(validatedData).returning();
      
      res.status(201).json({ driver });
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ error: "Failed to create driver" });
    }
  });
  
  app.get("/api/payments", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const payments = await tenantDb.select().from(import("../shared/schema.js").payments);
      res.json({ payments });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  
  app.post("/api/payments", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const { payments } = await import("../shared/schema.js");
      const { insertPaymentSchema } = await import("../shared/schema.js");
      
      const validatedData = insertPaymentSchema.parse(req.body);
      const [payment] = await tenantDb.insert(payments).values(validatedData).returning();
      
      res.status(201).json({ payment });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });
  
  app.get("/api/transport-orders", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const transportOrders = await tenantDb.select().from(import("../shared/schema.js").transportOrders);
      res.json({ transportOrders });
    } catch (error) {
      console.error("Error fetching transport orders:", error);
      res.status(500).json({ error: "Failed to fetch transport orders" });
    }
  });
  
  app.post("/api/transport-orders", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const { transportOrders } = await import("../shared/schema.js");
      const { insertTransportOrderSchema } = await import("../shared/schema.js");
      
      const validatedData = insertTransportOrderSchema.parse(req.body);
      const [order] = await tenantDb.insert(transportOrders).values(validatedData).returning();
      
      res.status(201).json({ order });
    } catch (error) {
      console.error("Error creating transport order:", error);
      res.status(500).json({ error: "Failed to create transport order" });
    }
  });
  
  // Rute pentru procesarea datelor (funcționalitatea existentă)
  app.post("/api/process-weekly-data", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const { weeklyProcessing } = await import("../shared/schema.js");
      const { insertWeeklyProcessingSchema } = await import("../shared/schema.js");
      
      const validatedData = insertWeeklyProcessingSchema.parse(req.body);
      const [processing] = await tenantDb.insert(weeklyProcessing).values(validatedData).returning();
      
      res.status(201).json({ processing });
    } catch (error) {
      console.error("Error processing weekly data:", error);
      res.status(500).json({ error: "Failed to process weekly data" });
    }
  });
  
  // Rute pentru export și rapoarte
  app.get("/api/export/companies", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const companies = await tenantDb.select().from(import("../shared/schema.js").companies);
      
      // Aici ar trebui să generezi Excel sau PDF
      res.json({ companies });
    } catch (error) {
      console.error("Error exporting companies:", error);
      res.status(500).json({ error: "Failed to export companies" });
    }
  });
  
  // Rute pentru dashboard-ul tenantului
  app.get("/api/dashboard/stats", requireAuth, async (req: TenantRequest, res) => {
    try {
      const tenantDb = req.tenantDb;
      const { companies, drivers, payments, transportOrders } = await import("../shared/schema.js");
      
      const [companiesCount] = await tenantDb.select({ count: import("drizzle-orm").count() }).from(companies);
      const [driversCount] = await tenantDb.select({ count: import("drizzle-orm").count() }).from(drivers);
      const [paymentsCount] = await tenantDb.select({ count: import("drizzle-orm").count() }).from(payments);
      const [ordersCount] = await tenantDb.select({ count: import("drizzle-orm").count() }).from(transportOrders);
      
      res.json({
        stats: {
          companies: companiesCount.count,
          drivers: driversCount.count,
          payments: paymentsCount.count,
          orders: ordersCount.count,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  
  return server;
}
