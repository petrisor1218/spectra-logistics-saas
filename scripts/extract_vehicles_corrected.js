import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Citim fișierul CSV cu datele de transport
const csvFilePath = path.join(__dirname, '..', 'attached_assets', 'Trips Jul 14 - Jul 20, 2024_1754811497522.csv');

if (!fs.existsSync(csvFilePath)) {
  console.error('❌ Fișierul CSV nu a fost găsit:', csvFilePath);
  process.exit(1);
}

const csvData = fs.readFileSync(csvFilePath, 'utf-8');
const lines = csvData.split('\n');
const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

console.log('📋 Headers găsite:', headers);

// Găsim indexul pentru Vehicle ID
const vehicleIdIndex = headers.findIndex(h => 
  h.toLowerCase().includes('vehicle') && h.toLowerCase().includes('id')
);

if (vehicleIdIndex === -1) {
  console.error('❌ Nu am găsit coloana Vehicle ID în headers');
  process.exit(1);
}

console.log(`✅ Coloana Vehicle ID găsită la indexul ${vehicleIdIndex}: "${headers[vehicleIdIndex]}"`);

// Extragem toate Vehicle ID-urile unice
const vehicleIds = new Set();
const rawVehicleIds = new Set();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const columns = line.split(',').map(c => c.trim().replace(/"/g, ''));
  if (columns.length > vehicleIdIndex) {
    const rawVehicleId = columns[vehicleIdIndex];
    if (rawVehicleId && rawVehicleId !== '') {
      rawVehicleIds.add(rawVehicleId);
      
      // Procesam Vehicle ID pentru a extrage doar numărul de înmatriculare
      let processedVehicleId = rawVehicleId;
      
      // Eliminăm prefixele comune și păstrăm doar numărul de înmatriculare
      if (rawVehicleId.includes('-')) {
        // Cazuri precum "OTHR-TR94FST", "AYGPZ-TR86FEX"
        const parts = rawVehicleId.split('-');
        if (parts.length >= 2) {
          processedVehicleId = parts[parts.length - 1]; // Luăm ultima parte
        }
      } else if (rawVehicleId.match(/^[A-Z0-9]+$/)) {
        // Dacă este deja un cod simplu fără prefix
        processedVehicleId = rawVehicleId;
      }
      
      // Verificăm dacă arată ca un număr de înmatriculare valid
      if (processedVehicleId.match(/^[A-Z0-9]{5,10}$/)) {
        vehicleIds.add(processedVehicleId);
      }
    }
  }
}

console.log('\n📊 REZULTATE EXTRAGERE:');
console.log('Raw Vehicle IDs găsite:', rawVehicleIds.size);
console.log('Numere de înmatriculare procesate:', vehicleIds.size);

console.log('\n🚛 RAW VEHICLE IDs (primele 20):');
Array.from(rawVehicleIds).slice(0, 20).forEach(id => {
  console.log(`  - "${id}"`);
});

console.log('\n🎯 NUMERE DE ÎNMATRICULARE EXTRASE:');
const sortedVehicles = Array.from(vehicleIds).sort();
sortedVehicles.forEach(vehicle => {
  console.log(`  - ${vehicle}`);
});

// Salvăm rezultatele pentru verificare
const outputData = {
  rawVehicleIds: Array.from(rawVehicleIds),
  processedVehicleIds: sortedVehicles,
  extractedAt: new Date().toISOString(),
  sourceFile: csvFilePath
};

fs.writeFileSync(
  path.join(__dirname, 'vehicles_extraction_results.json'),
  JSON.stringify(outputData, null, 2)
);

console.log('\n✅ Rezultatele au fost salvate în vehicles_extraction_results.json');
console.log(`📈 Total vehicle IDs procesate: ${sortedVehicles.length}`);