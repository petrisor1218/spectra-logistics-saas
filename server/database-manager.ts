import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema.js';

neonConfig.webSocketConstructor = ws;

interface DatabaseConnection {
  db: ReturnType<typeof drizzle>;
  pool: Pool;
}

class DatabaseManager {
  private connections: Map<string, DatabaseConnection> = new Map();
  private mainDb: DatabaseConnection;

  constructor() {
    // Conexiunea principală pentru gestionarea utilizatorilor și tenant-ilor
    const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.mainDb = {
      db: drizzle(mainPool, { schema }),
      pool: mainPool
    };
  }

  // Obține conexiunea principală pentru autentificare și gestionarea utilizatorilor
  getMainDatabase() {
    return this.mainDb.db;
  }

  // Creează o nouă bază de date pentru tenant
  async createTenantDatabase(tenantId: string): Promise<string> {
    try {
      // Pentru dezvoltare, folosim aceeași bază de date cu izolare completă prin namespace
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const db = drizzle(pool, { schema });
      
      const connection = { db, pool };
      this.connections.set(tenantId, connection);
      
      // Inițializează datele pentru tenant (nu schema, pentru că e comună)
      await this.initializeTenantData(db, tenantId);
      
      console.log(`✅ Created tenant database for ${tenantId}`);
      return process.env.DATABASE_URL || '';
    } catch (error) {
      console.error(`Failed to create tenant database for ${tenantId}:`, error);
      throw new Error('Failed to create tenant database');
    }
  }

  // Generează connection string pentru tenant
  private generateTenantConnectionString(tenantId: string): string {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Pentru dezvoltare, folosim același DATABASE_URL
    // În producție, aici ar fi logica pentru baze de date separate
    return baseUrl;
  }

  // Obține conexiunea pentru un tenant specific
  async getTenantDatabase(tenantId: string): Promise<ReturnType<typeof drizzle>> {
    let connection = this.connections.get(tenantId);
    
    if (!connection) {
      // Creează conexiunea dacă nu există
      await this.createTenantDatabase(tenantId);
      connection = this.connections.get(tenantId);
      
      if (!connection) {
        throw new Error(`Failed to create connection for tenant ${tenantId}`);
      }
    }
    
    return connection.db;
  }

  // Inițializează datele pentru un tenant nou (cu izolare completă)
  private async initializeTenantData(db: ReturnType<typeof drizzle>, tenantId: string) {
    try {
      // Verifică dacă tenant-ul are deja date
      const existingCompanies = await db.select().from(schema.companies)
        .where(schema.companies.tenantId ? eq(schema.companies.tenantId, tenantId) : sql`1=0`);
      
      if (existingCompanies.length > 0) {
        console.log(`Tenant ${tenantId} already has data, skipping initialization`);
        return;
      }

      // Inițializează secvența pentru numerele de comenzi (globală, nu per tenant)
      await db.insert(schema.orderSequence).values({
        currentNumber: 1554
      }).onConflictDoNothing();

      // Adaugă companiile default pentru tenant cu tenantId
      const defaultCompanies = [
        {
          name: 'SC FAST & EXPRESS SRL',
          commissionRate: '0.02',
          cif: 'RO35986465',
          tradeRegisterNumber: 'J40/12345/2015',
          address: 'Str. Transportului nr. 1',
          location: 'București',
          county: 'București',
          country: 'Romania',
          contact: 'contact@fastexpress.ro',
          tenantId: tenantId
        }
      ];

      for (const company of defaultCompanies) {
        await db.insert(schema.companies).values(company).onConflictDoNothing();
      }

      console.log(`✅ Initialized data for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Error initializing tenant data for ${tenantId}:`, error);
    }
  }

  // Închide toate conexiunile
  async closeAllConnections() {
    for (const [tenantId, connection] of this.connections) {
      try {
        await connection.pool.end();
        console.log(`Closed connection for tenant ${tenantId}`);
      } catch (error) {
        console.error(`Error closing connection for tenant ${tenantId}:`, error);
      }
    }
    
    try {
      await this.mainDb.pool.end();
      console.log('Closed main database connection');
    } catch (error) {
      console.error('Error closing main database connection:', error);
    }
    
    this.connections.clear();
  }

  // Șterge toate datele pentru un tenant
  async deleteTenantData(tenantId: string) {
    const db = await this.getTenantDatabase(tenantId);
    
    try {
      // Șterge în ordine pentru a evita problemele cu foreign keys
      await db.delete(schema.paymentHistory);
      await db.delete(schema.payments);
      await db.delete(schema.companyBalances);
      await db.delete(schema.transportOrders);
      await db.delete(schema.historicalTrips);
      await db.delete(schema.weeklyProcessing);
      await db.delete(schema.drivers);
      await db.delete(schema.companies);
      await db.delete(schema.orderSequence);
      
      console.log(`✅ Deleted all data for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Error deleting tenant data for ${tenantId}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();

// Cleanup la închiderea aplicației
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await databaseManager.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await databaseManager.closeAllConnections();
  process.exit(0);
});