import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseTables() {
  console.log('🔍 Checking Supabase tables...');

  // Verify users table exists
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ Users table not found:', usersError.code, usersError.message);
    } else {
      console.log('✅ Users table exists. Sample data:', users);
    }
  } catch (error) {
    console.error('❌ Error checking users table:', error);
  }

  // Check companies table
  try {
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (companiesError) {
      console.log('❌ Companies table not found:', companiesError.code, companiesError.message);
    } else {
      console.log('✅ Companies table exists. Sample data:', companies);
    }
  } catch (error) {
    console.error('❌ Error checking companies table:', error);
  }

  // Check company_balances table
  try {
    const { data: balances, error: balancesError } = await supabase
      .from('company_balances')
      .select('*')
      .limit(1);

    if (balancesError) {
      console.log('❌ Company_balances table not found:', balancesError.code, balancesError.message);
    } else {
      console.log('✅ Company_balances table exists. Sample data:', balances);
    }
  } catch (error) {
    console.error('❌ Error checking company_balances table:', error);
  }
}

checkSupabaseTables();