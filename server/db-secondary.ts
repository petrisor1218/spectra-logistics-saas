import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema-secondary.js";

// Baza de date secundară pentru management-ul tenantilor
const secondaryDbUrl = process.env.SECONDARY_DATABASE_URL;
if (!secondaryDbUrl) {
  throw new Error("SECONDARY_DATABASE_URL is required for multi-tenant management");
}

const secondarySql = neon(secondaryDbUrl);
export const secondaryDb = drizzle(secondarySql, { schema });

// Pool de conexiuni pentru bazele de date ale tenantilor
const tenantDbConnections = new Map<string, any>();

export const getTenantDb = async (databaseUrl: string) => {
  if (tenantDbConnections.has(databaseUrl)) {
    return tenantDbConnections.get(databaseUrl);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema: await import("../shared/schema.js") });
  
  tenantDbConnections.set(databaseUrl, db);
  return db;
};

export const closeTenantDbConnection = (databaseUrl: string) => {
  if (tenantDbConnections.has(databaseUrl)) {
    tenantDbConnections.delete(databaseUrl);
  }
};

export const closeAllTenantConnections = () => {
  tenantDbConnections.clear();
};