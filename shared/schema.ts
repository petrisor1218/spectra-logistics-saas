import { pgTable, serial, text, varchar, timestamp, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  companyId: integer("company_id").references(() => companies.id),
  nameVariants: jsonb("name_variants"),
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
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  paymentDate: timestamp("payment_date").defaultNow(),
  weekLabel: varchar("week_label", { length: 100 }).notNull(),
  paymentType: varchar("payment_type", { length: 50 }).default("partial"), // 'partial' or 'full'
});

export const paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id),
  action: varchar("action", { length: 50 }).notNull(), // 'created', 'updated', 'deleted'
  previousData: jsonb("previous_data"),
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
  createdAt: timestamp("created_at").defaultNow(),
});

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

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTransportOrderSchema = createInsertSchema(transportOrders).omit({
  id: true,
  createdAt: true,
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
