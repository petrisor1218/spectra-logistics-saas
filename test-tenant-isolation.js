/**
 * 🔒 TEST TENANT ISOLATION - Verifică separarea completă a datelor
 */

const testUsers = [
  { username: 'petrisor', password: 'test123', expectedRole: 'main' },
  { username: 'testuser1', password: 'password123', expectedRole: 'tenant' },
  { username: 'testuser2', password: 'password123', expectedRole: 'tenant' }
];

const endpoints = [
  '/api/companies',
  '/api/drivers', 
  '/api/payments',
  '/api/weekly-processing',
  '/api/company-balances'
];

async function testIsolation() {
  console.log('🔒 TESTING TENANT ISOLATION SYSTEM');
  console.log('=====================================');
  
  for (const user of testUsers) {
    console.log(`\n👤 Testing user: ${user.username}`);
    
    // Login
    try {
      const loginResponse = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, password: user.password }),
        credentials: 'include'
      });
      
      if (!loginResponse.ok) {
        console.log(`❌ Login failed for ${user.username}`);
        continue;
      }
      
      const cookies = loginResponse.headers.get('set-cookie');
      console.log(`✅ Login successful for ${user.username}`);
      
      // Test each endpoint
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:5000${endpoint}`, {
            headers: { 'Cookie': cookies || '' }
          });
          
          if (response.ok) {
            const data = await response.json();
            const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
            console.log(`   ${endpoint}: ${count} records (${data.isolation || 'NO_ISOLATION_INFO'})`);
          } else {
            console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.log(`   ${endpoint}: ERROR - ${error.message}`);
        }
      }
      
      // Logout
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        headers: { 'Cookie': cookies || '' }
      });
      
    } catch (error) {
      console.log(`❌ Test failed for ${user.username}:`, error.message);
    }
  }
  
  console.log('\n🎯 ISOLATION TEST COMPLETED');
  console.log('Expected results:');
  console.log('- petrisor: Should see his existing data');
  console.log('- testuser1/testuser2: Should see 0 records (isolated)');
}

// Wait for server to be ready
setTimeout(testIsolation, 2000);