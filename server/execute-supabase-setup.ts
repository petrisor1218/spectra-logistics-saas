import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSupabaseTables() {
  console.log('🔨 Setting up Supabase tables...');

  try {
    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email VARCHAR(255) UNIQUE,
          role VARCHAR(20) NOT NULL DEFAULT 'subscriber',
          tenant_id VARCHAR(100) UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (usersError) {
      console.error('❌ Error creating users table:', usersError);
    } else {
      console.log('✅ Users table created successfully');
    }

    // Create companies table
    const { error: companiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          commission_rate DECIMAL(5,4) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (companiesError) {
      console.error('❌ Error creating companies table:', companiesError);
    } else {
      console.log('✅ Companies table created successfully');
    }

    // Insert test users
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username: 'petrisor',
          password: hashedPassword,
          email: 'petrisor@fastexpress.ro',
          role: 'admin',
          tenant_id: 'main'
        },
        {
          username: 'toma', 
          password: hashedPassword,
          email: 'toma@test.com',
          role: 'subscriber',
          tenant_id: 'tenant_1754291118685_qi17iipyv'
        }
      ]);

    if (insertError) {
      console.error('❌ Error inserting test users:', insertError);
    } else {
      console.log('✅ Test users inserted successfully');
    }

    console.log('🎉 Supabase setup completed!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run setup
setupSupabaseTables();