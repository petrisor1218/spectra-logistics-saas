import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema-secondary";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL_SECONDARY) {
  throw new Error(
    "DATABASE_URL_SECONDARY must be set. Did you forget to provision the secondary database?",
  );
}

export const poolSecondary = new Pool({ connectionString: process.env.DATABASE_URL_SECONDARY });
export const dbSecondary = drizzle({ client: poolSecondary, schema });