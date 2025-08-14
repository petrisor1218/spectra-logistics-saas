import { pgTable, serial, text, varchar, timestamp, integer, decimal, jsonb, unique, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Baza de date secundară - complet separată
export const usersSecondary = pgTable("users_secondary", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exemplu de tabel pentru a doua bază de date
export const projectsSecondary = pgTable("projects_secondary", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => usersSecondary.id),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasksSecondary = pgTable("tasks_secondary", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  projectId: integer("project_id").references(() => projectsSecondary.id),
  assignedTo: integer("assigned_to").references(() => usersSecondary.id),
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersSecondaryRelations = relations(usersSecondary, ({ many }) => ({
  projects: many(projectsSecondary),
  assignedTasks: many(tasksSecondary),
}));

export const projectsSecondaryRelations = relations(projectsSecondary, ({ one, many }) => ({
  owner: one(usersSecondary, {
    fields: [projectsSecondary.userId],
    references: [usersSecondary.id],
  }),
  tasks: many(tasksSecondary),
}));

export const tasksSecondaryRelations = relations(tasksSecondary, ({ one }) => ({
  project: one(projectsSecondary, {
    fields: [tasksSecondary.projectId],
    references: [projectsSecondary.id],
  }),
  assignee: one(usersSecondary, {
    fields: [tasksSecondary.assignedTo],
    references: [usersSecondary.id],
  }),
}));

// Insert schemas
export const insertUserSecondarySchema = createInsertSchema(usersSecondary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSecondarySchema = createInsertSchema(projectsSecondary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSecondarySchema = createInsertSchema(tasksSecondary).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUserSecondary = z.infer<typeof insertUserSecondarySchema>;
export type UserSecondary = typeof usersSecondary.$inferSelect;

export type InsertProjectSecondary = z.infer<typeof insertProjectSecondarySchema>;
export type ProjectSecondary = typeof projectsSecondary.$inferSelect;

export type InsertTaskSecondary = z.infer<typeof insertTaskSecondarySchema>;
export type TaskSecondary = typeof tasksSecondary.$inferSelect;

// Schema pentru baza de date secundară (management și admin)
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  subdomain: varchar("subdomain", { length: 100 }).notNull().unique(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, suspended, trial
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  adminUserId: integer("admin_user_id"),
  
  // Database configuration
  databaseUrl: text("database_url").notNull(),
  databaseName: varchar("database_name", { length: 100 }).notNull(),
  
  // Stripe subscription fields
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("trial"), // trial, active, past_due, canceled, suspended
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  promotionalEndsAt: timestamp("promotional_ends_at"), // When €99.99 price ends
  
  // Usage tracking
  databaseSize: integer("database_size").default(0), // in MB
  apiCallsCount: integer("api_calls_count").default(0),
  lastApiCall: timestamp("last_api_call"),
  activeUsersCount: integer("active_users_count").default(0),
  
  // Billing
  monthlyRecurringRevenue: decimal("monthly_recurring_revenue", { precision: 10, scale: 2 }).default("0"),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  subdomainIdx: index("subdomain_idx").on(table.subdomain),
  statusIdx: index("status_idx").on(table.status),
  stripeCustomerIdx: index("stripe_customer_idx").on(table.stripeCustomerId),
}));

export const tenantUsers = pgTable("tenant_users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  userId: integer("user_id").notNull(), // ID from tenant's database
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("user"), // admin, user
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tenantUserIdx: index("tenant_user_idx").on(table.tenantId, table.userId),
  emailIdx: index("email_idx").on(table.email),
}));

export const tenantActivityLogs = pgTable("tenant_activity_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details"),
  userId: integer("user_id"), // ID from tenant's database
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tenantActionIdx: index("tenant_action_idx").on(table.tenantId, table.action),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // mrr, churn, database_usage, etc.
  metricValue: decimal("metric_value", { precision: 15, scale: 4 }).notNull(),
  metricData: jsonb("metric_data"), // Additional data for the metric
  recordedAt: timestamp("recorded_at").defaultNow(),
}, (table) => ({
  metricTypeIdx: index("metric_type_idx").on(table.metricType),
  recordedAtIdx: index("recorded_at_idx").on(table.recordedAt),
}));

export const stripeEvents = pgTable("stripe_events", {
  id: serial("id").primaryKey(),
  stripeEventId: varchar("stripe_event_id", { length: 100 }).notNull().unique(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: jsonb("event_data").notNull(),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventTypeIdx: index("event_type_idx").on(table.eventType),
  processedIdx: index("processed_idx").on(table.processed),
}));

export const databaseBackups = pgTable("database_backups", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  backupUrl: text("backup_url").notNull(),
  backupSize: integer("backup_size"), // in MB
  backupType: varchar("backup_type", { length: 20 }).default("automatic"), // automatic, manual
  status: varchar("status", { length: 20 }).default("completed"), // in_progress, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tenantBackupIdx: index("tenant_backup_idx").on(table.tenantId),
  statusIdx: index("status_idx").on(table.status),
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantUserSchema = createInsertSchema(tenantUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantActivityLogSchema = createInsertSchema(tenantActivityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  recordedAt: true,
});

export const insertStripeEventSchema = createInsertSchema(stripeEvents).omit({
  id: true,
  createdAt: true,
});

export const insertDatabaseBackupSchema = createInsertSchema(databaseBackups).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

export type InsertTenantUser = z.infer<typeof insertTenantUserSchema>;
export type TenantUser = typeof tenantUsers.$inferSelect;

export type InsertTenantActivityLog = z.infer<typeof insertTenantActivityLogSchema>;
export type TenantActivityLog = typeof tenantActivityLogs.$inferSelect;

export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;

export type InsertStripeEvent = z.infer<typeof insertStripeEventSchema>;
export type StripeEvent = typeof stripeEvents.$inferSelect;

export type InsertDatabaseBackup = z.infer<typeof insertDatabaseBackupSchema>;
export type DatabaseBackup = typeof databaseBackups.$inferSelect;