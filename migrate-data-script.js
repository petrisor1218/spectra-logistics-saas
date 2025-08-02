// Script pentru testarea și executarea migrării datelor în Supabase
import './server/migrate-to-supabase.js';

console.log('🚀 Preparing to migrate main user data to Supabase...');
console.log('');
console.log('📋 Steps needed:');
console.log('1. Create tables in Supabase Dashboard using server/create-supabase-tables.sql');
console.log('2. Run migration via API: POST /api/supabase/migrate-main-user');
console.log('3. Verify data integrity');
console.log('');
console.log('🔗 Supabase URL:', process.env.SUPABASE_URL);
console.log('');
console.log('Ready to proceed with migration!');