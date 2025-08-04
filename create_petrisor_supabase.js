/**
 * Create Petrisor user directly in Supabase if needed
 */

const bcrypt = require('bcryptjs');

async function createPetrisorInSupabase() {
  console.log('🔧 CREATING PETRISOR IN SUPABASE');
  console.log('================================');
  
  try {
    // First check if user exists
    const checkResponse = await fetch('http://localhost:5000/api/supabase/test');
    const testData = await checkResponse.json();
    
    console.log('Current users in Supabase:', testData.users?.length || 0);
    
    const petrisorExists = testData.users?.find(u => u.username === 'petrisor');
    if (petrisorExists) {
      console.log('✅ Petrisor already exists in Supabase:', petrisorExists);
      return;
    }
    
    console.log('🔧 Creating Petrisor user in Supabase...');
    
    // Create user with ID 4 to match the session
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const createResponse = await fetch('http://localhost:5000/api/supabase/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 4,
        username: 'petrisor',
        email: 'petrisor@fastexpress.ro', 
        password: hashedPassword,
        role: 'admin',
        tenantId: 'main'
      })
    });
    
    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Petrisor created successfully:', result);
    } else {
      const error = await createResponse.json();
      console.log('❌ Failed to create Petrisor:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createPetrisorInSupabase();