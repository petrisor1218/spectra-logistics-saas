import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL_SECONDARY) {
  throw new Error("DATABASE_URL_SECONDARY, ensure the secondary database is provisioned");
}

export default defineConfig({
  out: "./migrations-secondary",
  schema: "./shared/schema-secondary.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_SECONDARY,
  },
});