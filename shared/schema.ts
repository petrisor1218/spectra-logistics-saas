import { pgTable, serial, text, varchar, timestamp, integer, decimal, jsonb, unique, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("subscriber"), // admin, subscriber
  tenantId: integer("tenant_id").notNull().default(1), // Integer pentru multi-tenancy eficient
  companyName: varchar("company_name", { length: 200 }), // Numele companiei utilizatorului
  // Stripe fields for subscription management
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("inactive"), // inactive, trialing, active, canceled
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }).notNull(),
  cif: varchar("cif", { length: 50 }),
  tradeRegisterNumber: varchar("trade_register_number", { length: 100 }),
  address: text("address"),
  location: varchar("location", { length: 100 }),
  county: varchar("county", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Romania"),
  contact: text("contact"),
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  createdAt: timestamp("created_at").defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  companyId: integer("company_id").references(() => companies.id),
  nameVariants: jsonb("name_variants"),
  phone: varchar("phone", { length: 20 }).default(""),
  email: varchar("email", { length: 100 }).default(""),
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  createdAt: timestamp("created_at").defaultNow(),
});

export const weeklyProcessing = pgTable("weekly_processing", {
  id: serial("id").primaryKey(),
  weekLabel: varchar("week_label", { length: 100 }).notNull(),
  processingDate: timestamp("processing_date").defaultNow(),
  tripDataCount: integer("trip_data_count").default(0),
  invoice7Count: integer("invoice7_count").default(0),
  invoice30Count: integer("invoice30_count").default(0),
  processedData: jsonb("processed_data"),
  // New fields for storing raw file data
  tripData: jsonb("trip_data"), // Raw TRIP file content
  invoice7Data: jsonb("invoice7_data"), // Raw 7-day invoice content  
  invoice30Data: jsonb("invoice30_data"), // Raw 30-day invoice content
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  // Year-end closure fields
  isHistorical: boolean("is_historical").default(false),
  historicalYear: integer("historical_year"),
}, (table) => ({
  uniqueWeekTenant: unique().on(table.weekLabel, table.tenantId)
}));

// New table for historical VRID tracking
export const historicalTrips = pgTable("historical_trips", {
  id: serial("id").primaryKey(),
  vrid: varchar("vrid", { length: 100 }).notNull(),
  driverName: varchar("driver_name", { length: 200 }),
  weekLabel: varchar("week_label", { length: 100 }).notNull(),
  tripDate: timestamp("trip_date"),
  route: varchar("route", { length: 200 }),
  rawTripData: jsonb("raw_trip_data"), // Full trip record
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  paymentDate: timestamp("payment_date").defaultNow(),
  weekLabel: varchar("week_label", { length: 100 }).notNull(),
  paymentType: varchar("payment_type", { length: 50 }).default("partial"), // 'partial' or 'full'
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  // Year-end closure fields
  isHistorical: boolean("is_historical").default(false),
  historicalYear: integer("historical_year"),
});

// New table for company balances tracking
export const companyBalances = pgTable("company_balances", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  weekLabel: varchar("week_label", { length: 100 }).notNull(),
  totalInvoiced: decimal("total_invoiced", { precision: 10, scale: 2 }).notNull(), // Total amount invoiced
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).default("0"), // Amount paid so far
  outstandingBalance: decimal("outstanding_balance", { precision: 10, scale: 2 }).notNull(), // Amount still owed
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // 'pending', 'partial', 'paid'
  lastUpdated: timestamp("last_updated").defaultNow(),
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  createdAt: timestamp("created_at").defaultNow(),
  // Year-end closure fields
  isHistorical: boolean("is_historical").default(false),
  historicalYear: integer("historical_year"),
});

export const paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id), // Nullable for deleted payments
  action: varchar("action", { length: 50 }).notNull(), // 'created', 'updated', 'deleted'
  previousData: jsonb("previous_data"),
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  createdAt: timestamp("created_at").defaultNow(),
});

export const transportOrders = pgTable("transport_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull(),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  orderDate: timestamp("order_date").notNull(),
  weekLabel: varchar("week_label", { length: 100 }).notNull(),
  vrids: jsonb("vrids"), // Array of VRID numbers
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  route: varchar("route", { length: 200 }).default("DE-BE-NL"),
  status: varchar("status", { length: 50 }).default("draft"), // 'draft', 'sent', 'confirmed'
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  createdAt: timestamp("created_at").defaultNow(),
});

// Auto-increment sequence for order numbers
export const orderSequence = pgTable("order_sequence", {
  id: serial("id").primaryKey(),
  currentNumber: integer("current_number").notNull().default(1554), // Start from 1554
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  lastUpdated: timestamp("last_updated").defaultNow()
});

// Small Amount Alerts - Track €0.01 invoices awaiting real amounts
export const smallAmountAlerts = pgTable("small_amount_alerts", {
  id: serial("id").primaryKey(),
  vrid: varchar("vrid", { length: 50 }).notNull(), // VRID number (e.g., T-114QYYSH3)
  companyName: varchar("company_name", { length: 100 }).notNull(), // Company name (e.g., DE Cargo Speed)
  invoiceType: varchar("invoice_type", { length: 20 }).notNull(), // "7-day" or "30-day"
  initialAmount: decimal("initial_amount", { precision: 10, scale: 4 }).notNull(), // Usually €0.01
  realAmount: decimal("real_amount", { precision: 10, scale: 2 }), // The actual amount when updated
  weekDetected: varchar("week_detected", { length: 100 }).notNull(), // Week when first detected
  weekResolved: varchar("week_resolved", { length: 100 }), // Week when real amount was found
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'resolved', 'ignored'
  notes: text("notes"), // Optional notes about the alert
  tenantId: integer("tenant_id").notNull().default(1), // Pentru multi-tenancy
  detectedAt: timestamp("detected_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  // Year-end closure fields
  isHistorical: boolean("is_historical").default(false),
  historicalYear: integer("historical_year"),
}, (table) => ({
  uniqueVridWeek: unique().on(table.vrid, table.weekDetected, table.tenantId) // Prevent duplicates
}));

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  drivers: many(drivers),
}));

export const driversRelations = relations(drivers, ({ one }) => ({
  company: one(companies, {
    fields: [drivers.companyId],
    references: [companies.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ many }) => ({
  history: many(paymentHistory),
}));

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentHistory.paymentId],
    references: [payments.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklyProcessingSchema = createInsertSchema(weeklyProcessing).omit({
  id: true,
  processingDate: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  paymentDate: true,
});

export const insertCompanyBalanceSchema = createInsertSchema(companyBalances).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTransportOrderSchema = createInsertSchema(transportOrders).omit({
  id: true,
  createdAt: true,
});

export const insertHistoricalTripSchema = createInsertSchema(historicalTrips).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSequenceSchema = createInsertSchema(orderSequence).omit({
  id: true,
  lastUpdated: true,
});

export const insertSmallAmountAlertSchema = createInsertSchema(smallAmountAlerts).omit({
  id: true,
  detectedAt: true,
  resolvedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

export type InsertWeeklyProcessing = z.infer<typeof insertWeeklyProcessingSchema>;
export type WeeklyProcessing = typeof weeklyProcessing.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
export type PaymentHistoryRecord = typeof paymentHistory.$inferSelect;

export type InsertTransportOrder = z.infer<typeof insertTransportOrderSchema>;
export type TransportOrder = typeof transportOrders.$inferSelect;

export type InsertHistoricalTrip = z.infer<typeof insertHistoricalTripSchema>;
export type HistoricalTrip = typeof historicalTrips.$inferSelect;

export type InsertOrderSequence = z.infer<typeof insertOrderSequenceSchema>;
export type OrderSequence = typeof orderSequence.$inferSelect;

export type InsertSmallAmountAlert = z.infer<typeof insertSmallAmountAlertSchema>;
export type SmallAmountAlert = typeof smallAmountAlerts.$inferSelect;

export type InsertCompanyBalance = z.infer<typeof insertCompanyBalanceSchema>;
export type CompanyBalance = typeof companyBalances.$inferSelect;

// Tenants table for multi-tenant management
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, suspended
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  companyName: varchar("company_name", { length: 200 }),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).default("professional"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// Driver Activity Analysis table - for tracking work/home time analysis
export const driverActivityAnalysis = pgTable("driver_activity_analysis", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  analysisData: jsonb("analysis_data"), // Store the complete analysis results
  tenantId: integer("tenant_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueYearMonthTenant: unique().on(table.year, table.month, table.tenantId)
}));

export const insertDriverActivityAnalysisSchema = createInsertSchema(driverActivityAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDriverActivityAnalysis = z.infer<typeof insertDriverActivityAnalysisSchema>;
export type DriverActivityAnalysis = typeof driverActivityAnalysis.$inferSelect;
