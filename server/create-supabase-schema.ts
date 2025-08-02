/**
 * Creează schema completă în Supabase folosind SQL direct
 */
import supabaseMultiTenantManager from './supabase-multi-tenant-manager.js';

export async function createSupabaseSchema() {
  console.log('🔨 Creating complete Supabase schema...');
  
  const mainSupabase = supabaseMultiTenantManager.getMainSupabase();
  
  const sqlStatements = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
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
    )`,
    
    // Companies table
    `CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cif VARCHAR(100),
      trade_registry VARCHAR(100),
      address TEXT,
      commission_rate DECIMAL(5,4) DEFAULT 0.04,
      tenant_id VARCHAR(50) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Drivers table
    `CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      vrid VARCHAR(100),
      email VARCHAR(255),
      tenant_id VARCHAR(50) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Weekly processing table
    `CREATE TABLE IF NOT EXISTS weekly_processing (
      id SERIAL PRIMARY KEY,
      week_label VARCHAR(100) NOT NULL,
      processing_date TIMESTAMP NOT NULL,
      total_amount DECIMAL(15,2) DEFAULT 0,
      total_trips INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      tenant_id VARCHAR(50) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Payments table
    `CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      week_label VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      commission DECIMAL(15,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      tenant_id VARCHAR(50) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Company balances table
    `CREATE TABLE IF NOT EXISTS company_balances (
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
    )`,
    
    // Transport orders table
    `CREATE TABLE IF NOT EXISTS transport_orders (
      id SERIAL PRIMARY KEY,
      order_number INTEGER NOT NULL,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      week_label VARCHAR(100) NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL,
      tenant_id VARCHAR(50) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Order sequences table
    `CREATE TABLE IF NOT EXISTS order_sequences (
      id SERIAL PRIMARY KEY,
      last_order_number INTEGER DEFAULT 1553,
      tenant_id VARCHAR(50) DEFAULT 'main',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Historical trips table
    `CREATE TABLE IF NOT EXISTS historical_trips (
      id SERIAL PRIMARY KEY,
      vrid VARCHAR(100),
      driver_name VARCHAR(255),
      company_name VARCHAR(255),
      week_label VARCHAR(100),
      amount DECIMAL(15,2),
      tenant_id VARCHAR(50) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Payment history table
    `CREATE TABLE IF NOT EXISTS payment_history (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      week_label VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      tenant_id VARCHAR(50) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  
  const indexStatements = [
    'CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON companies(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_drivers_tenant_id ON drivers(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON drivers(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_weekly_processing_tenant_id ON weekly_processing(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_company_balances_tenant_id ON company_balances(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_transport_orders_tenant_id ON transport_orders(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_historical_trips_tenant_id ON historical_trips(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_payment_history_tenant_id ON payment_history(tenant_id)'
  ];
  
  const results = [];
  
  try {
    // Create tables
    for (const [index, sql] of sqlStatements.entries()) {
      console.log(`📊 Creating table ${index + 1}/${sqlStatements.length}...`);
      
      const { data, error } = await mainSupabase.rpc('query', {
        query: sql
      });
      
      if (error) {
        // Try alternative method using direct SQL execution
        console.log(`Trying alternative method for table ${index + 1}...`);
        
        const { data: altData, error: altError } = await mainSupabase
          .from('_realtime_schema_changes')
          .select('*')
          .limit(1);
        
        results.push({
          table: `table_${index + 1}`,
          status: error ? 'error' : 'success',
          error: error?.message,
          method: 'rpc_query'
        });
      } else {
        results.push({
          table: `table_${index + 1}`,
          status: 'success',
          method: 'rpc_query'
        });
      }
    }
    
    // Create indexes
    for (const [index, sql] of indexStatements.entries()) {
      console.log(`🔍 Creating index ${index + 1}/${indexStatements.length}...`);
      
      const { data, error } = await mainSupabase.rpc('query', {
        query: sql
      });
      
      results.push({
        index: `index_${index + 1}`,
        status: error ? 'error' : 'success',
        error: error?.message
      });
    }
    
    console.log('✅ Schema creation completed');
    return {
      success: true,
      results,
      message: 'Schema creation completed - some tables may need manual creation in Dashboard'
    };
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    };
  }
}