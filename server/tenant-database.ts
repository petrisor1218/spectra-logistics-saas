import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema.js';
import { sql } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

interface TenantDatabase {
  db: ReturnType<typeof drizzle>;
  pool: Pool;
  schema: string;
}

class TenantDatabaseManager {
  private databases: Map<string, TenantDatabase> = new Map();
  private mainDb: ReturnType<typeof drizzle>;

  constructor() {
    // Conexiunea principală
    const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.mainDb = drizzle(mainPool, { schema });
  }

  // Obține baza de date principală pentru utilizatori
  getMainDatabase() {
    return this.mainDb;
  }

  // Creează schema separată pentru tenant
  async createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    try {
      // Creează schema PostgreSQL separată
      await this.mainDb.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schemaName)}`);
      
      // Creează toate tabelele în schema tenant-ului
      await this.createTenantTables(schemaName);
      
      // Creează conexiunea specifică pentru tenant
      const tenantPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        options: `--search_path=${schemaName},public`
      });
      
      const tenantDb = drizzle(tenantPool, { schema });
      
      this.databases.set(tenantId, {
        db: tenantDb,
        pool: tenantPool,
        schema: schemaName
      });
      
      // Inițializează datele default pentru tenant
      await this.initializeTenantData(tenantDb);
      
      console.log(`✅ Created separate schema ${schemaName} for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Failed to create tenant schema for ${tenantId}:`, error);
      throw error;
    }
  }

  // Creează toate tabelele în schema tenant-ului
  private async createTenantTables(schemaName: string): Promise<void> {
    const createTableQueries = [
      // Companies table (fără tenant_id pentru că schema este deja separată)
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        commission_rate DECIMAL(5,4) NOT NULL,
        cif VARCHAR(50),
        trade_register_number VARCHAR(100),
        address TEXT,
        location VARCHAR(100),
        county VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Romania',
        contact TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Drivers table
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        company_id INTEGER REFERENCES ${sql.identifier(schemaName)}.companies(id),
        name_variants JSONB,
        phone VARCHAR(20) DEFAULT '',
        email VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Weekly processing table
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.weekly_processing (
        id SERIAL PRIMARY KEY,
        week_label VARCHAR(100) NOT NULL,
        processing_date TIMESTAMP DEFAULT NOW(),
        trip_data_count INTEGER DEFAULT 0,
        invoice7_count INTEGER DEFAULT 0,
        invoice30_count INTEGER DEFAULT 0,
        processed_data JSONB,
        trip_data JSONB,
        invoice7_data JSONB,
        invoice30_data JSONB
      )`,
      
      // Historical trips table
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.historical_trips (
        id SERIAL PRIMARY KEY,
        vrid VARCHAR(100) NOT NULL,
        driver_name VARCHAR(200),
        week_label VARCHAR(100) NOT NULL,
        trip_date TIMESTAMP,
        route VARCHAR(200),
        raw_trip_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Payments table
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.payments (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        payment_date TIMESTAMP DEFAULT NOW(),
        week_label VARCHAR(100) NOT NULL,
        payment_type VARCHAR(50) DEFAULT 'partial'
      )`,
      
      // Company balances table
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.company_balances (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(100) NOT NULL,
        week_label VARCHAR(100) NOT NULL,
        total_invoiced DECIMAL(10,2) NOT NULL,
        total_paid DECIMAL(10,2) DEFAULT 0,
        outstanding_balance DECIMAL(10,2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        last_updated TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Payment history table
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.payment_history (
        id SERIAL PRIMARY KEY,
        payment_id INTEGER REFERENCES ${sql.identifier(schemaName)}.payments(id),
        action VARCHAR(50) NOT NULL,
        previous_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Transport orders table
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.transport_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(100) NOT NULL,
        company_name VARCHAR(100) NOT NULL,
        order_date TIMESTAMP NOT NULL,
        week_label VARCHAR(100) NOT NULL,
        vrids JSONB,
        total_amount DECIMAL(10,2) NOT NULL,
        route VARCHAR(200) DEFAULT 'DE-BE-NL',
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const query of createTableQueries) {
      await this.mainDb.execute(query);
    }
  }

  // Inițializează datele default pentru tenant
  private async initializeTenantData(tenantDb: ReturnType<typeof drizzle>): Promise<void> {
    try {
      // Adaugă compania default (fără tenant_id pentru că schema este deja separată)
      await tenantDb.insert(schema.companies).values({
        name: 'SC FAST & EXPRESS SRL',
        commissionRate: '0.02',
        cif: 'RO35986465',
        tradeRegisterNumber: 'J40/12345/2015',
        address: 'Str. Transportului nr. 1',
        location: 'București',
        county: 'București',
        country: 'Romania',
        contact: 'contact@fastexpress.ro'
      }).onConflictDoNothing();

      console.log('✅ Initialized default data for tenant');
    } catch (error) {
      console.error('Error initializing tenant data:', error);
    }
  }

  // Obține baza de date pentru tenant
  async getTenantDatabase(tenantId: string): Promise<ReturnType<typeof drizzle>> {
    let tenantDb = this.databases.get(tenantId);
    
    if (!tenantDb) {
      // Creează schema pentru tenant dacă nu există
      await this.createTenantSchema(tenantId);
      tenantDb = this.databases.get(tenantId);
      
      if (!tenantDb) {
        throw new Error(`Failed to create database for tenant ${tenantId}`);
      }
    }
    
    return tenantDb.db;
  }

  // Șterge toate datele pentru un tenant
  async deleteTenantData(tenantId: string): Promise<void> {
    const tenantDb = this.databases.get(tenantId);
    if (!tenantDb) {
      return;
    }

    try {
      // Șterge schema complet
      await this.mainDb.execute(sql`DROP SCHEMA IF EXISTS ${sql.identifier(tenantDb.schema)} CASCADE`);
      
      // Închide conexiunea
      await tenantDb.pool.end();
      
      // Elimină din cache
      this.databases.delete(tenantId);
      
      console.log(`✅ Deleted all data for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Error deleting tenant data for ${tenantId}:`, error);
      throw error;
    }
  }

  // Închide toate conexiunile
  async closeAllConnections(): Promise<void> {
    for (const [tenantId, tenantDb] of this.databases) {
      try {
        await tenantDb.pool.end();
        console.log(`Closed connection for tenant ${tenantId}`);
      } catch (error) {
        console.error(`Error closing connection for tenant ${tenantId}:`, error);
      }
    }
    
    this.databases.clear();
  }
}

// Export singleton
export const tenantDatabaseManager = new TenantDatabaseManager();

// Cleanup
process.on('SIGINT', async () => {
  console.log('Closing tenant database connections...');
  await tenantDatabaseManager.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing tenant database connections...');
  await tenantDatabaseManager.closeAllConnections();
  process.exit(0);
});