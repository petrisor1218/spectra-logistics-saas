import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CSV file and extract unique vehicles
function extractVehiclesFromCSV(csvPath) {
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.log('❌ CSV file is empty or has no data');
      return [];
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    console.log('📋 CSV Headers:', headers);
    
    // Find Vehicle ID column
    const vehicleIdIndex = headers.findIndex(h => 
      h.toLowerCase().includes('vehicle') && h.toLowerCase().includes('id')
    );
    
    if (vehicleIdIndex === -1) {
      console.log('❌ Vehicle ID column not found in CSV');
      return [];
    }
    
    console.log(`🚗 Vehicle ID column found at index ${vehicleIdIndex}: "${headers[vehicleIdIndex]}"`);
    
    const vehicles = new Set();
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      const vehicleId = values[vehicleIdIndex];
      
      if (vehicleId && vehicleId !== '' && vehicleId !== 'undefined') {
        vehicles.add(vehicleId);
      }
    }
    
    return Array.from(vehicles).sort();
  } catch (error) {
    console.error('Error reading CSV:', error);
    return [];
  }
}

// Main execution
const csvFile = path.join(__dirname, '../attached_assets/Trips Jul 14 - Jul 20, 2024_1754811497522.csv');

console.log('🔍 Extracting vehicles from:', csvFile);
const vehicles = extractVehiclesFromCSV(csvFile);

console.log(`\n✅ Found ${vehicles.length} unique vehicles:`);
vehicles.forEach((vehicle, index) => {
  console.log(`${index + 1}. ${vehicle}`);
});

// Generate SQL for inserting vehicles
console.log('\n📝 SQL pentru inserarea vehiculelor (toate ca inactive pentru mapare manuală):');
console.log('-- Copy and paste this SQL into the database tool:\n');

vehicles.forEach(vehicle => {
  console.log(`INSERT INTO vehicles (vehicle_id, company_id, vehicle_name, is_active, notes, created_at, updated_at) VALUES ('${vehicle}', 1, 'Vehicle ${vehicle}', 'false', 'Auto-extracted from historical data - needs company assignment', NOW(), NOW());`);
});

console.log('\n🎯 Next steps:');
console.log('1. Run the SQL above to add all vehicles as inactive');
console.log('2. Go to Management > Vehicule tab');
console.log('3. Edit each vehicle to assign correct company');
console.log('4. Set is_active to true for vehicles that should be used');