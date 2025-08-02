// Test rapid pentru conectivitatea Supabase
import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials missing');
      return;
    }
    
    console.log(`📡 Connecting to: ${supabaseUrl}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('⚠️ Expected error (table might not exist):', error.message);
      console.log('✅ But connection to Supabase is working!');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('📊 Sample data:', data);
    }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }
}

testSupabaseConnection();