import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function activateVehicles() {
  console.log('🔧 Activating vehicles with correct company mappings...');
  
  // Activate all vehicles that now have correct company mappings
  const result = await sql`
    UPDATE vehicles 
    SET is_active = true
    WHERE vehicle_id IN (
      'TR04FST', 'TR80FST', 'TR82FST', 'TR94FST', 'TR95FST', 'TR98FST', 'TR99FST',  -- Fast Express
      'TR86FEX', 'TR94FEX',  -- Fast Express
      'TR11WDE', 'TR22WDE', 'TR33WDE',  -- DE Cargo
      'TR17PAA', 'TR71PAA', 'TR98PAA'   -- Daniel Ontheroad
    )
  `;
  
  console.log(`✅ Activated ${result.count} vehicles`);
  
  // Show final status
  const vehicles = await sql`
    SELECT v.vehicle_id, c.name as company_name, v.is_active, v.notes
    FROM vehicles v
    JOIN companies c ON v.company_id = c.id
    WHERE v.vehicle_id LIKE 'TR%'
    ORDER BY c.name, v.vehicle_id
  `;
  
  console.log('\n📊 VEHICULE FINALE:');
  
  const byCompany = vehicles.reduce((acc, v) => {
    if (!acc[v.company_name]) acc[v.company_name] = [];
    acc[v.company_name].push(v);
    return acc;
  }, {});
  
  Object.entries(byCompany).forEach(([company, vehs]) => {
    console.log(`\n${company}:`);
    vehs.forEach(v => {
      const status = v.is_active ? '🟢 ACTIV' : '🔴 INACTIV';
      console.log(`  ${status} ${v.vehicle_id}`);
    });
  });
}

activateVehicles().catch(console.error);