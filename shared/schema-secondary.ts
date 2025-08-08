import { pgTable, serial, text, varchar, timestamp, integer, decimal, jsonb } from "drizzle-orm/pg-core";
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