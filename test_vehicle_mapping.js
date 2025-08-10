// Test pentru a verifica maparea pe vehicule
const testTrips = [
  {
    "Vehicle ID": "OTHR-TR94FST",
    "Driver": "Tiberiu Ivan",
    "amount": 100
  },
  {
    "Vehicle ID": "AYGPZ-TR86FEX", 
    "Driver": "Adrian Miron",
    "amount": 150
  },
  {
    "Vehicle ID": "OTHR-TR11WDE",
    "Driver": "Cernat Lucian",
    "amount": 200
  },
  {
    "Vehicle ID": "OTHR-TR17PAA",
    "Driver": "Costica Mihalcea", 
    "amount": 120
  },
  {
    "Vehicle ID": "", // No vehicle - should fall back to driver
    "Driver": "Razvan Jurubita",
    "amount": 80
  }
];

console.log('🧪 TESTING VEHICLE MAPPING:');
console.log('Expected results:');
console.log('- OTHR-TR94FST → TR94FST → Fast Express');
console.log('- AYGPZ-TR86FEX → TR86FEX → Fast Express'); 
console.log('- OTHR-TR11WDE → TR11WDE → De Cargo');
console.log('- OTHR-TR17PAA → TR17PAA → Daniel Ontheroad');
console.log('- No vehicle → Razvan Jurubita → Fast Express (driver fallback)');
console.log('\nReady for testing in the Upload interface!');