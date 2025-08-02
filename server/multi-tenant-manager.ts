import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema.js';
import { sql, eq } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

interface TenantDatabase {
  db: ReturnType<typeof drizzle>;
  pool: Pool;
  databaseName: string;
  connectionString: string;
}

/**
 * Manager pentru baze de date multi-tenant complete separate
 * Fiecare tenant va avea propria bază de date PostgreSQL
 */
class MultiTenantManager {
  private tenantDatabases: Map<string, TenantDatabase> = new Map();
  private mainDb: ReturnType<typeof drizzle>;
  private mainPool: Pool;

  constructor() {
    // Conexiunea principală pentru gestionarea utilizatorilor și tenant-ilor
    this.mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.mainDb = drizzle(this.mainPool, { schema });
  }

  /**
   * Obține baza de date principală pentru autentificare și gestionarea utilizatorilor
   */
  getMainDatabase() {
    return this.mainDb;
  }

  /**
   * Creează o bază de date complet separată pentru un tenant nou
   */
  async createTenantDatabase(tenantId: string): Promise<string> {
    try {
      const databaseName = `tenant_${tenantId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      const schemaName = databaseName;
      
      // Verifică dacă schema deja există
      const existingSchemas = await this.mainDb.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = ${schemaName}
      `);
      
      if (existingSchemas.length === 0) {
        console.log(`🔨 Creating separate database: ${databaseName} for tenant: ${tenantId}`);
        
        // Creează schema separată
        await this.mainDb.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schemaName)}`);
        
        // Creează toate tabelele în schema separată
        await this.createTenantTables(schemaName);
        
        // Creează conexiunea cu search_path setat pe schema tenant-ului
        const tenantConnectionString = this.buildTenantConnectionString(schemaName);
        const tenantPool = new Pool({ 
          connectionString: tenantConnectionString,
          options: `--search_path=${schemaName},public`
        });
        
        const tenantDb = drizzle(tenantPool, { schema });
        
        // Salvează conexiunea tenant-ului
        this.tenantDatabases.set(tenantId, {
          db: tenantDb,
          pool: tenantPool,
          databaseName: schemaName,
          connectionString: tenantConnectionString
        });
        
        // Inițializează datele default pentru tenant
        await this.initializeTenantData(tenantDb, tenantId);
        
        console.log(`✅ Successfully created separate database schema ${schemaName} for tenant ${tenantId}`);
      } else {
        console.log(`✅ Using existing tenant database schema ${schemaName} for tenant ${tenantId}`);
        
        // Creează conexiunea pentru schema existentă
        const tenantConnectionString = this.buildTenantConnectionString(schemaName);
        const tenantPool = new Pool({ 
          connectionString: tenantConnectionString,
          options: `--search_path=${schemaName},public`
        });
        
        const tenantDb = drizzle(tenantPool, { schema });
        
        // Salvează conexiunea tenant-ului
        this.tenantDatabases.set(tenantId, {
          db: tenantDb,
          pool: tenantPool,
          databaseName: schemaName,
          connectionString: tenantConnectionString
        });
      }
      
      return this.buildTenantConnectionString(schemaName);
      
    } catch (error) {
      console.error(`❌ Failed to create tenant database for ${tenantId}:`, error);
      throw new Error(`Failed to create tenant database: ${error}`);
    }
  }

  /**
   * Creează toate tabelele necesare în schema tenant-ului
   */
  private async createTenantTables(schemaName: string): Promise<void> {
    const queries = [
      // Companies table - fără tenantId pentru că schema este deja separată
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
        is_main_company BOOLEAN DEFAULT FALSE,
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
      )`,
      
      // Order sequence table
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.order_sequence (
        id SERIAL PRIMARY KEY,
        current_number INTEGER NOT NULL DEFAULT 1000,
        last_updated TIMESTAMP DEFAULT NOW()
      )`,
      
      // Username reservations table
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(schemaName)}.username_reservations (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        reserved_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      )`
    ];

    // Execută toate query-urile pentru crearea tabelelor
    for (const query of queries) {
      await this.mainDb.execute(query);
    }
  }

  /**
   * Construiește connection string pentru tenant cu schema specificată
   */
  private buildTenantConnectionString(schemaName: string): string {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    // Pentru conexiunile tenant, folosim același connection string
    // dar setăm search_path prin opțiuni
    return baseUrl;
  }

  /**
   * Obține baza de date pentru un tenant specific
   */
  async getTenantDatabase(tenantId: string): Promise<ReturnType<typeof drizzle>> {
    let tenantDb = this.tenantDatabases.get(tenantId);
    
    if (!tenantDb) {
      // Creează baza de date pentru tenant dacă nu există
      await this.createTenantDatabase(tenantId);
      tenantDb = this.tenantDatabases.get(tenantId);
      
      if (!tenantDb) {
        throw new Error(`Failed to create database for tenant ${tenantId}`);
      }
    }
    
    return tenantDb.db;
  }

  /**
   * Inițializează datele default pentru un tenant nou
   * NOTA: Pentru testarea SaaS, tenant-ul TEST rămâne complet gol
   */
  private async initializeTenantData(db: ReturnType<typeof drizzle>, tenantId: string): Promise<void> {
    try {
      // Inițializează doar secvența pentru numerele de comenzi (necesar pentru funcționarea sistemului)
      await db.insert(schema.orderSequence).values({
        currentNumber: 1000 + Math.floor(Math.random() * 100) // Fiecare tenant începe cu un număr diferit
      }).onConflictDoNothing();

      // IMPORTANT: Nu mai populez companiile automat pentru TEST tenant
      // Clientul nou trebuie să aibă posibilitatea să testeze sistemul gol complet
      const isTestTenant = tenantId.includes('tenant_1754113011277_752jg7hxg') || 
                          tenantId === 'test' || 
                          tenantId.toLowerCase().includes('test');
      
      if (!isTestTenant) {
        // Pentru tenant-ii reali (nu test), adaugă companiile default
        const defaultCompanies = [
          {
            name: 'FAST EXPRESS',
            commissionRate: '0.0400',
            cif: '35986465',
            tradeRegisterNumber: '',
            address: '',
            location: '',
            county: '',
            country: 'Romania',
            contact: ''
          },
          {
            name: 'DE CARGO SPEED',
            commissionRate: '0.0400',
            cif: '23456',
            tradeRegisterNumber: '',
            address: '',
            location: '',
            county: '',
            country: 'Romania',
            contact: ''
          },
          {
            name: 'STEF TRANS ',
            commissionRate: '0.0400',
            cif: '',
            tradeRegisterNumber: '',
            address: '',
            location: '',
            county: '',
            country: 'Romania',
            contact: ''
          },
          {
            name: 'TOMA',
            commissionRate: '0.0400',
            cif: '',
            tradeRegisterNumber: '',
            address: '',
            location: '',
            county: '',
            country: 'Romania',
            contact: ''
          }
        ];

        for (const company of defaultCompanies) {
          await db.insert(schema.companies).values(company).onConflictDoNothing();
        }
        
        console.log(`✅ Initialized default companies for tenant ${tenantId}`);
      } else {
        console.log(`🧪 TEST TENANT - Nu populez companiile automat pentru testare: ${tenantId}`);
      }

    } catch (error) {
      console.error(`Error initializing tenant data for ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Verifică dacă un tenant are baza de date creată
   */
  hasTenantDatabase(tenantId: string): boolean {
    return this.tenantDatabases.has(tenantId);
  }

  /**
   * Obține informații despre toate bazele de date tenant
   */
  getTenantDatabasesInfo(): Array<{tenantId: string, databaseName: string, connectionString: string}> {
    const info = [];
    for (const [tenantId, dbInfo] of Array.from(this.tenantDatabases.entries())) {
      info.push({
        tenantId,
        databaseName: dbInfo.databaseName,
        connectionString: dbInfo.connectionString
      });
    }
    return info;
  }

  /**
   * Șterge complet baza de date pentru un tenant
   */
  async deleteTenantDatabase(tenantId: string): Promise<void> {
    try {
      const tenantDb = this.tenantDatabases.get(tenantId);
      if (!tenantDb) {
        console.log(`No database found for tenant ${tenantId}`);
        return;
      }

      // Închide conexiunea
      await tenantDb.pool.end();
      
      // Șterge schema complet
      await this.mainDb.execute(sql`DROP SCHEMA IF EXISTS ${sql.identifier(tenantDb.databaseName)} CASCADE`);
      
      // Șterge din map
      this.tenantDatabases.delete(tenantId);
      
      console.log(`✅ Deleted database for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Error deleting tenant database for ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Închide toate conexiunile
   */
  async closeAllConnections(): Promise<void> {
    // Închide conexiunile tenant
    for (const [tenantId, tenantDb] of Array.from(this.tenantDatabases.entries())) {
      try {
        await tenantDb.pool.end();
        console.log(`Closed connection for tenant ${tenantId}`);
      } catch (error) {
        console.error(`Error closing connection for tenant ${tenantId}:`, error);
      }
    }
    
    // Închide conexiunea principală
    try {
      await this.mainPool.end();
      console.log('Closed main database connection');
    } catch (error) {
      console.error('Error closing main database connection:', error);
    }
    
    this.tenantDatabases.clear();
  }

  /**
   * Obține un storage izolat pentru tenant specific
   */
  async getTenantStorage(tenantId: string) {
    const db = await this.getTenantDatabase(tenantId);
    
    // Importăm DatabaseStorage și creăm o instanță cu baza de date tenant
    const { DatabaseStorage } = await import('./storage.js');
    return new DatabaseStorage(db);
  }

  /**
   * Statistici despre sistemul multi-tenant
   */
  getSystemStats() {
    return {
      totalTenants: this.tenantDatabases.size,
      maxTenants: 100, // Conform cerințelor
      tenantIds: Array.from(this.tenantDatabases.keys())
    };
  }
}

// Singleton instance
export const multiTenantManager = new MultiTenantManager();

// Cleanup la închiderea aplicației
process.on('SIGINT', async () => {
  console.log('🔄 Closing all tenant database connections...');
  await multiTenantManager.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing all tenant database connections...');
  await multiTenantManager.closeAllConnections();
  process.exit(0);
});