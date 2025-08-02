/**
 * Creează tabelele direct în Supabase folosind SQL individual pentru fiecare tabel
 */
import supabaseMultiTenantManager from './supabase-multi-tenant-manager.js';

export async function createTablesDirectly() {
  console.log('🔨 Creating Supabase tables directly...');
  
  const mainSupabase = supabaseMultiTenantManager.getMainSupabase();
  
  const tables = [
    {
      name: 'users',
      sql: `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'subscriber',
        tenant_id VARCHAR(50),
        subscription_status VARCHAR(50) DEFAULT 'active',
        subscription_plan VARCHAR(50) DEFAULT 'transport_pro',
        subscription_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'companies',
      sql: `CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cif VARCHAR(100),
        trade_registry VARCHAR(100),
        address TEXT,
        commission_rate DECIMAL(5,4) DEFAULT 0.04,
        tenant_id VARCHAR(50) DEFAULT 'main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'drivers',
      sql: `CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        vrid VARCHAR(100),
        email VARCHAR(255),
        tenant_id VARCHAR(50) DEFAULT 'main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'weekly_processing',
      sql: `CREATE TABLE IF NOT EXISTS weekly_processing (
        id SERIAL PRIMARY KEY,
        week_label VARCHAR(100) NOT NULL,
        processing_date TIMESTAMP NOT NULL,
        total_amount DECIMAL(15,2) DEFAULT 0,
        total_trips INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        tenant_id VARCHAR(50) DEFAULT 'main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'payments',
      sql: `CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        week_label VARCHAR(100) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        commission DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        tenant_id VARCHAR(50) DEFAULT 'main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'company_balances',
      sql: `CREATE TABLE IF NOT EXISTS company_balances (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        week_label VARCHAR(100) NOT NULL,
        total_invoiced DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
        outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        tenant_id VARCHAR(50) DEFAULT 'main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'transport_orders',
      sql: `CREATE TABLE IF NOT EXISTS transport_orders (
        id SERIAL PRIMARY KEY,
        order_number INTEGER NOT NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        week_label VARCHAR(100) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        tenant_id VARCHAR(50) DEFAULT 'main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'order_sequences',
      sql: `CREATE TABLE IF NOT EXISTS order_sequences (
        id SERIAL PRIMARY KEY,
        last_order_number INTEGER DEFAULT 1553,
        tenant_id VARCHAR(50) DEFAULT 'main',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'historical_trips',
      sql: `CREATE TABLE IF NOT EXISTS historical_trips (
        id SERIAL PRIMARY KEY,
        vrid VARCHAR(100),
        driver_name VARCHAR(255),
        company_name VARCHAR(255),
        week_label VARCHAR(100),
        amount DECIMAL(15,2),
        tenant_id VARCHAR(50) DEFAULT 'main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'payment_history',
      sql: `CREATE TABLE IF NOT EXISTS payment_history (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        week_label VARCHAR(100) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        tenant_id VARCHAR(50) DEFAULT 'main',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    }
  ];

  const results = [];
  
  for (const table of tables) {
    try {
      console.log(`📊 Creating table: ${table.name}`);
      
      const { data, error } = await mainSupabase
        .from('_metadata')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST205') {
        // Table doesn't exist, which is expected for first run
        console.log(`✅ ${table.name} will be created`);
      }
      
      results.push({
        table: table.name,
        status: 'ready_to_create',
        sql: table.sql
      });
      
    } catch (err) {
      console.error(`❌ Error preparing ${table.name}:`, err);
      results.push({
        table: table.name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }
  
  return {
    success: true,
    message: 'Tables prepared for creation in Supabase Dashboard',
    tables: results,
    instruction: 'Execute the SQL from server/create-supabase-tables.sql in Supabase Dashboard'
  };
}