#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as schema from "../shared/schema.js";
import * as schemaSecondary from "../shared/schema-secondary.js";

async function main() {
  console.log("🚀 Începe migrarea bazelor de date...");

  // Migrarea bazei de date secundare (admin)
  try {
    console.log("📊 Migrarea bazei de date secundare (admin)...");
    const secondaryDbUrl = process.env.SECONDARY_DATABASE_URL;
    
    if (!secondaryDbUrl) {
      throw new Error("SECONDARY_DATABASE_URL nu este setat");
    }

    const secondarySql = neon(secondaryDbUrl);
    const secondaryDb = drizzle(secondarySql, { schema: schemaSecondary });
    
    await migrate(secondaryDb, { migrationsFolder: "./drizzle-secondary" });
    console.log("✅ Baza de date secundară migrată cu succes!");
  } catch (error) {
    console.error("❌ Eroare la migrarea bazei secundare:", error);
    process.exit(1);
  }

  // Migrarea bazei de date principale (pentru tenantii existenți)
  try {
    console.log("🏢 Migrarea bazei de date principale...");
    const mainDbUrl = process.env.DATABASE_URL;
    
    if (!mainDbUrl) {
      throw new Error("DATABASE_URL nu este setat");
    }

    const mainSql = neon(mainDbUrl);
    const mainDb = drizzle(mainSql, { schema });
    
    await migrate(mainDb, { migrationsFolder: "./drizzle" });
    console.log("✅ Baza de date principală migrată cu succes!");
  } catch (error) {
    console.error("❌ Eroare la migrarea bazei principale:", error);
    process.exit(1);
  }

  console.log("🎉 Toate migrările au fost finalizate cu succes!");
}

main().catch((error) => {
  console.error("❌ Eroare fatală:", error);
  process.exit(1);
});
