import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Vehiculele corecte extrase din datele reale
const vehicles = [
  // Vehicule FST (Fast Express)
  { vehicleId: 'TR04FST', suggestedCompanyId: 1, notes: 'FST suggests Fast Express assignment' },
  { vehicleId: 'TR80FST', suggestedCompanyId: 1, notes: 'FST suggests Fast Express assignment' },
  { vehicleId: 'TR82FST', suggestedCompanyId: 1, notes: 'FST suggests Fast Express assignment' },
  { vehicleId: 'TR94FST', suggestedCompanyId: 1, notes: 'FST suggests Fast Express assignment' },
  { vehicleId: 'TR95FST', suggestedCompanyId: 1, notes: 'FST suggests Fast Express assignment' },
  { vehicleId: 'TR98FST', suggestedCompanyId: 1, notes: 'FST suggests Fast Express assignment' },
  { vehicleId: 'TR99FST', suggestedCompanyId: 1, notes: 'FST suggests Fast Express assignment' },
  
  // Vehicule FEX (Fast Express)
  { vehicleId: 'TR86FEX', suggestedCompanyId: 1, notes: 'FEX suggests Fast Express assignment' },
  { vehicleId: 'TR94FEX', suggestedCompanyId: 1, notes: 'FEX suggests Fast Express assignment' },
  
  // Vehicule FAN (Company to be identified)
  { vehicleId: 'TR01FAN', suggestedCompanyId: 1, notes: 'FAN code - requires company identification' },
  { vehicleId: 'TR49FAN', suggestedCompanyId: 1, notes: 'FAN code - requires company identification' },
  { vehicleId: 'TR50FAN', suggestedCompanyId: 1, notes: 'FAN code - requires company identification' },
  
  // Vehicule PAA (Company to be identified)
  { vehicleId: 'TR17PAA', suggestedCompanyId: 1, notes: 'PAA code - requires company identification' },
  { vehicleId: 'TR71PAA', suggestedCompanyId: 1, notes: 'PAA code - requires company identification' },
  { vehicleId: 'TR98PAA', suggestedCompanyId: 1, notes: 'PAA code - requires company identification' },
  
  // Vehicule WDE (Company to be identified)
  { vehicleId: 'TR11WDE', suggestedCompanyId: 1, notes: 'WDE code - requires company identification' },
  { vehicleId: 'TR22WDE', suggestedCompanyId: 1, notes: 'WDE code - requires company identification' },
  { vehicleId: 'TR33WDE', suggestedCompanyId: 1, notes: 'WDE code - requires company identification' }
];

async function insertVehicles() {
  console.log('🚛 Inserting corrected vehicles from real data...');
  
  for (const vehicle of vehicles) {
    try {
      await sql`
        INSERT INTO vehicles (vehicle_id, company_id, vehicle_name, is_active, notes, tenant_id)
        VALUES (
          ${vehicle.vehicleId},
          ${vehicle.suggestedCompanyId},
          ${'Vehicle ' + vehicle.vehicleId},
          false,
          ${vehicle.notes},
          1
        )
        ON CONFLICT (vehicle_id, tenant_id) DO NOTHING
      `;
      console.log(`✅ Added vehicle: ${vehicle.vehicleId}`);
    } catch (error) {
      console.error(`❌ Error adding vehicle ${vehicle.vehicleId}:`, error.message);
    }
  }
  
  // Verificăm rezultatul
  const insertedVehicles = await sql`
    SELECT vehicle_id, company_id, is_active, notes 
    FROM vehicles 
    WHERE notes LIKE '%suggests%' OR notes LIKE '%requires%'
    ORDER BY vehicle_id
  `;
  
  console.log('\n📊 VEHICULE INSERIATE:');
  console.log(`Total: ${insertedVehicles.length} vehicule`);
  
  // Grupăm pe tipuri de companii
  const groups = {
    'FST (Fast Express)': insertedVehicles.filter(v => v.vehicle_id.includes('FST')),
    'FEX (Fast Express)': insertedVehicles.filter(v => v.vehicle_id.includes('FEX')),
    'FAN (TBD)': insertedVehicles.filter(v => v.vehicle_id.includes('FAN')),
    'PAA (TBD)': insertedVehicles.filter(v => v.vehicle_id.includes('PAA')),
    'WDE (TBD)': insertedVehicles.filter(v => v.vehicle_id.includes('WDE'))
  };
  
  Object.entries(groups).forEach(([groupName, vehicles]) => {
    if (vehicles.length > 0) {
      console.log(`\n${groupName}:`);
      vehicles.forEach(v => console.log(`  - ${v.vehicle_id}`));
    }
  });
  
  console.log('\n✅ Toate vehiculele au fost procesate!');
  console.log('🔧 Acum poți merge în Management > Vehicule pentru a configura mapările corecte.');
}

insertVehicles().catch(console.error);