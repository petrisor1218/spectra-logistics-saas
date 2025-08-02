/**
 * Test direct pentru crearea tabelelor în Supabase
 * Folosește API-ul Supabase pentru a crea tabelele manual
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('🔗 Connecting to Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key available:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

// Test conectivitate
async function testConnection() {
  try {
    const { data, error } = await supabase.from('test').select('*').limit(1);
    console.log('✅ Connection test result:', error ? error.message : 'Connected');
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
}

// Creează tabelele folosind SQL direct
async function createTables() {
  console.log('🔨 Creating tables in Supabase...');
  
  const sqlCommands = [
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
    );`,
    
    `CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      vrid VARCHAR(100),
      email VARCHAR(255),
      tenant_id VARCHAR(50) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    
    `CREATE TABLE IF NOT EXISTS weekly_processing (
      id SERIAL PRIMARY KEY,
      week_label VARCHAR(100) NOT NULL,
      processing_date TIMESTAMP NOT NULL,
      total_amount DECIMAL(15,2) DEFAULT 0,
      total_trips INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      tenant_id VARCHAR(50) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ];
  
  for (const [index, sql] of sqlCommands.entries()) {
    try {
      console.log(`📊 Running SQL ${index + 1}...`);
      console.log('SQL:', sql.substring(0, 100) + '...');
      
      // Folosim funcția sql pentru a executa SQL direct
      const { data, error } = await supabase.rpc('sql', { query: sql });
      
      if (error) {
        console.error(`❌ Error creating table ${index + 1}:`, error);
      } else {
        console.log(`✅ Table ${index + 1} created successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception creating table ${index + 1}:`, err);
    }
  }
}

// Rulează testele
await testConnection();
await createTables();

console.log('🎯 Manual table creation completed');
console.log('📋 Next: Check Supabase Dashboard to verify tables were created');