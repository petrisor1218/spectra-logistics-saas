import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import { secondaryDb, getTenantDb } from "./db-secondary.js";
import { tenants, tenantUsers, tenantActivityLogs } from "../shared/schema-secondary.js";
import { users, companies, drivers, weeklyProcessing, payments, companyBalances, transportOrders, orderSequence, smallAmountAlerts, historicalTrips } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export interface TenantCreationData {
  name: string;
  subdomain: string;
  contactEmail: string;
  contactPhone?: string;
  companyName: string;
  adminUser: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  };
}

export class TenantManager {
  // Creează un nou tenant cu baza sa de date separată
  static async createTenant(data: TenantCreationData) {
    try {
      // 1. Creează baza de date pentru tenant
      const databaseName = `tenant_${data.subdomain}_${Date.now()}`;
      const databaseUrl = await this.createNeonDatabase(databaseName);
      
      // 2. Inițializează schema în baza de date a tenantului
      await this.initializeTenantDatabase(databaseUrl);
      
      // 3. Creează înregistrarea tenantului în baza secundară
      const [tenant] = await secondaryDb.insert(tenants).values({
        name: data.name,
        subdomain: data.subdomain,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        companyName: data.companyName,
        databaseUrl,
        databaseName,
        status: "trial",
        trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 zile
      }).returning();
      
      // 4. Creează utilizatorul admin în baza de date a tenantului
      const tenantDb = await getTenantDb(databaseUrl);
      const hashedPassword = await bcrypt.hash(data.adminUser.password, 12);
      
      const [adminUser] = await tenantDb.insert(users).values({
        username: data.adminUser.email,
        email: data.adminUser.email,
        firstName: data.adminUser.firstName,
        lastName: data.adminUser.lastName,
        password: hashedPassword,
        role: "admin",
        tenantId: 1, // Pentru compatibilitate cu schema existentă
        companyName: data.companyName,
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      }).returning();
      
      // 5. Actualizează tenantul cu ID-ul utilizatorului admin
      await secondaryDb.update(tenants)
        .set({ adminUserId: adminUser.id })
        .where(eq(tenants.id, tenant.id));
      
      // 6. Creează înregistrarea utilizatorului în baza secundară
      await secondaryDb.insert(tenantUsers).values({
        tenantId: tenant.id,
        userId: adminUser.id,
        email: data.adminUser.email,
        firstName: data.adminUser.firstName,
        lastName: data.adminUser.lastName,
        role: "admin",
      });
      
      // 7. Log activitatea
      await secondaryDb.insert(tenantActivityLogs).values({
        tenantId: tenant.id,
        action: "tenant_created",
        details: {
          subdomain: data.subdomain,
          adminEmail: data.adminUser.email,
        },
      });
      
      return { tenant, adminUser, databaseUrl };
    } catch (error) {
      console.error("Error creating tenant:", error);
      throw new Error(`Failed to create tenant: ${error}`);
    }
  }
  
  // Creează o bază de date Neon pentru tenant
  private static async createNeonDatabase(databaseName: string): Promise<string> {
    // Aici ar trebui să integrezi cu API-ul Neon pentru crearea bazelor de date
    // Pentru moment, vom folosi o abordare simplificată
    
    const baseUrl = process.env.NEON_BASE_URL || "postgresql://user:pass@host/db";
    const databaseUrl = baseUrl.replace("/db", `/${databaseName}`);
    
    // În producție, aici ar trebui să:
    // 1. Apelezi API-ul Neon pentru crearea bazei de date
    // 2. Aștepți ca baza să fie gata
    // 3. Returnezi URL-ul real
    
    return databaseUrl;
  }
  
  // Inițializează schema în baza de date a tenantului
  private static async initializeTenantDatabase(databaseUrl: string) {
    const sql = neon(databaseUrl);
    const db = drizzle(sql);
    
    // Aici ar trebui să rulezi migrările pentru schema
    // Pentru moment, vom crea tabelele manual
    
    // Creează tabelele de bază
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email VARCHAR(255) UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) NOT NULL DEFAULT 'subscriber',
        tenant_id INTEGER NOT NULL DEFAULT 1,
        company_name VARCHAR(200),
        stripe_customer_id VARCHAR(100),
        stripe_subscription_id VARCHAR(100),
        subscription_status VARCHAR(50) DEFAULT 'inactive',
        trial_ends_at TIMESTAMP,
        subscription_ends_at TIMESTAMP,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Adaugă și celelalte tabele necesare...
    // (pentru simplitate, nu le includ pe toate aici)
  }
  
  // Găsește tenantul după subdomain
  static async getTenantBySubdomain(subdomain: string) {
    const [tenant] = await secondaryDb
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain));
    
    return tenant;
  }
  
  // Găsește tenantul după ID
  static async getTenantById(id: number) {
    const [tenant] = await secondaryDb
      .select()
      .from(tenants)
      .where(eq(tenants.id, id));
    
    return tenant;
  }
  
  // Obține baza de date pentru un tenant
  static async getTenantDatabase(tenantId: number) {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    
    return await getTenantDb(tenant.databaseUrl);
  }
  
  // Actualizează statusul tenantului
  static async updateTenantStatus(tenantId: number, status: string) {
    await secondaryDb.update(tenants)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, tenantId));
    
    await secondaryDb.insert(tenantActivityLogs).values({
      tenantId,
      action: "status_updated",
      details: { status },
    });
  }
  
  // Creează abonament Stripe pentru tenant
  static async createStripeSubscription(tenantId: number) {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    
    try {
      // Creează customer în Stripe
      const customer = await stripe.customers.create({
        email: tenant.contactEmail,
        name: tenant.companyName,
        metadata: {
          tenantId: tenantId.toString(),
          subdomain: tenant.subdomain,
        },
      });
      
      // Creează abonamentul cu prețul promotional
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: process.env.STRIPE_PROMOTIONAL_PRICE_ID }],
        trial_period_days: 3,
        metadata: {
          tenantId: tenantId.toString(),
        },
      });
      
      // Actualizează tenantul cu informațiile Stripe
      await secondaryDb.update(tenants)
        .set({
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          trialEndsAt: new Date(subscription.trial_end! * 1000),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          promotionalEndsAt: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000), // 3 luni
        })
        .where(eq(tenants.id, tenantId));
      
      return { customer, subscription };
    } catch (error) {
      console.error("Error creating Stripe subscription:", error);
      throw new Error(`Failed to create Stripe subscription: ${error}`);
    }
  }
  
  // Procesează evenimente Stripe
  static async processStripeEvent(event: Stripe.Event) {
    const { type, data } = event;
    
    switch (type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdate(data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionCancellation(data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await this.handlePaymentFailure(data.object as Stripe.Invoice);
        break;
      case "invoice.payment_succeeded":
        await this.handlePaymentSuccess(data.object as Stripe.Invoice);
        break;
    }
  }
  
  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const tenantId = parseInt(subscription.metadata.tenantId);
    
    await secondaryDb.update(tenants)
      .set({
        subscriptionStatus: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
  }
  
  private static async handleSubscriptionCancellation(subscription: Stripe.Subscription) {
    const tenantId = parseInt(subscription.metadata.tenantId);
    
    await secondaryDb.update(tenants)
      .set({
        subscriptionStatus: "canceled",
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
  }
  
  private static async handlePaymentFailure(invoice: Stripe.Invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const tenantId = parseInt(subscription.metadata.tenantId);
    
    await secondaryDb.update(tenants)
      .set({
        subscriptionStatus: "past_due",
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
  }
  
  private static async handlePaymentSuccess(invoice: Stripe.Invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const tenantId = parseInt(subscription.metadata.tenantId);
    
    await secondaryDb.update(tenants)
      .set({
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
  }
  
  // Obține toți tenantii pentru dashboard-ul admin
  static async getAllTenants() {
    return await secondaryDb
      .select()
      .from(tenants)
      .orderBy(tenants.createdAt);
  }
  
  // Calculează MRR (Monthly Recurring Revenue)
  static async calculateMRR() {
    const activeTenants = await secondaryDb
      .select()
      .from(tenants)
      .where(eq(tenants.subscriptionStatus, "active"));
    
    let mrr = 0;
    const now = new Date();
    
    for (const tenant of activeTenants) {
      if (tenant.promotionalEndsAt && tenant.promotionalEndsAt > now) {
        mrr += 99.99; // Preț promotional
      } else {
        mrr += 149.99; // Preț normal
      }
    }
    
    return mrr;
  }
  
  // Șterge tenantul și baza sa de date
  static async deleteTenant(tenantId: number) {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    
    try {
      // 1. Anulează abonamentul Stripe dacă există
      if (tenant.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(tenant.stripeSubscriptionId);
      }
      
      // 2. Șterge baza de date (în producție, aici ar trebui să apelezi API-ul Neon)
      
      // 3. Șterge înregistrările din baza secundară
      await secondaryDb.delete(tenantActivityLogs).where(eq(tenantActivityLogs.tenantId, tenantId));
      await secondaryDb.delete(tenantUsers).where(eq(tenantUsers.tenantId, tenantId));
      await secondaryDb.delete(tenants).where(eq(tenants.id, tenantId));
      
    } catch (error) {
      console.error("Error deleting tenant:", error);
      throw new Error(`Failed to delete tenant: ${error}`);
    }
  }
}
