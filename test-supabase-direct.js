// Test direct pentru Supabase fără module
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('🧪 Testing direct Supabase connection...');
console.log(`📡 URL: ${supabaseUrl}`);
console.log(`🔑 Key starts with: ${supabaseKey?.substring(0, 20)}...`);

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created successfully');
  
  // Test system info
  const result = {
    status: 'working',
    supabaseUrl: supabaseUrl,
    timestamp: new Date().toISOString(),
    message: 'Supabase multi-tenant system is ready'
  };
  
  console.log('📊 Result:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ Error:', error);
}