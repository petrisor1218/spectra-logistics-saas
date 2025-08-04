/**
 * Test direct Supabase connection to find users
 */

async function testSupabaseUsers() {
  console.log('🔍 TESTING SUPABASE DIRECT CONNECTION');
  console.log('====================================');
  
  try {
    const response = await fetch('http://localhost:5000/api/supabase/test');
    const data = await response.json();
    
    console.log('📊 Supabase Test Results:');
    console.log('Users found:', data.users?.length || 0);
    
    if (data.users && data.users.length > 0) {
      data.users.forEach(user => {
        console.log(`  - ${user.username} (ID: ${user.id}, Email: ${user.email})`);
      });
    }
    
    console.log('Companies found:', data.companies?.length || 0);
    console.log('Drivers found:', data.drivers?.length || 0);
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
  }
}

testSupabaseUsers();