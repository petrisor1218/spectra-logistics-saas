import { useQuery } from '@tanstack/react-query';

interface Vehicle {
  id: number;
  vehicleId: string;
  companyId: number;
  vehicleName?: string;
  isActive: string;
}

interface Company {
  id: number;
  name: string;
  commissionRate: string;
}

interface Driver {
  id: number;
  name: string;
  companyId: number;
  nameVariants: string[];
}

/**
 * Hook for vehicle-priority mapping system
 * 1. First checks if vehicle exists in vehicles table
 * 2. If not found, falls back to driver mapping
 */
export function useVehicleMapping() {
  // Fetch all vehicles
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  // Fetch all companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  // Fetch all drivers (fallback mapping)
  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['/api/drivers'],
  });

  /**
   * Map trip data to company using vehicle-first priority
   */
  const mapTripToCompany = (trip: any): { companyName: string; companyId: number; mappingSource: 'vehicle' | 'driver' | 'unmapped' } => {
    console.log(`🚗 Mapping trip with vehicle: ${trip["Vehicle ID"]} and driver: ${trip.Driver}`);
    
    // 1. PRIORITY: Check vehicle mapping first
    if (trip["Vehicle ID"]) {
      let vehicleId = trip["Vehicle ID"];
      
      // Extract registration number from Vehicle ID formats like:
      // "OTHR-TR94FST" → "TR94FST"
      // "AYGPZ-TR86FEX" → "TR86FEX"
      if (vehicleId.includes('-')) {
        const parts = vehicleId.split('-');
        if (parts.length >= 2) {
          vehicleId = parts[parts.length - 1]; // Take the last part
        }
      }
      
      const vehicle = vehicles.find(v => 
        v.vehicleId === vehicleId && 
        v.isActive === 'true'
      );
      
      if (vehicle) {
        const company = companies.find(c => c.id === vehicle.companyId);
        if (company) {
          console.log(`✅ VEHICLE MAPPING: ${trip["Vehicle ID"]} → ${vehicleId} → ${company.name}`);
          return {
            companyName: company.name,
            companyId: company.id,
            mappingSource: 'vehicle'
          };
        }
      }
    }

    // 2. FALLBACK: Check driver mapping
    if (trip.Driver) {
      const driverName = trip.Driver.toLowerCase().trim();
      
      for (const driver of drivers) {
        // Check exact name match
        if (driver.name.toLowerCase() === driverName) {
          const company = companies.find(c => c.id === driver.companyId);
          if (company) {
            console.log(`✅ DRIVER MAPPING (exact): ${trip.Driver} → ${company.name}`);
            return {
              companyName: company.name,
              companyId: company.id,
              mappingSource: 'driver'
            };
          }
        }

        // Check name variants
        if (driver.nameVariants && Array.isArray(driver.nameVariants)) {
          for (const variant of driver.nameVariants) {
            if (typeof variant === 'string' && variant.toLowerCase() === driverName) {
              const company = companies.find(c => c.id === driver.companyId);
              if (company) {
                console.log(`✅ DRIVER MAPPING (variant): ${trip.Driver} → ${company.name}`);
                return {
                  companyName: company.name,
                  companyId: company.id,
                  mappingSource: 'driver'
                };
              }
            }
          }
        }
      }
    }

    // 3. No mapping found
    console.log(`❌ NO MAPPING: Vehicle ${trip["Vehicle ID"]} and Driver ${trip.Driver} not found`);
    return {
      companyName: 'UNMAPPED',
      companyId: 0,
      mappingSource: 'unmapped'
    };
  };

  /**
   * Get mapping statistics
   */
  const getMappingStats = () => {
    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.isActive === 'true').length,
      totalDrivers: drivers.length,
      totalCompanies: companies.length,
      vehiclesByCompany: companies.map(company => ({
        companyName: company.name,
        vehicleCount: vehicles.filter(v => v.companyId === company.id).length
      }))
    };
  };

  /**
   * Check if a vehicle is mapped
   */
  const isVehicleMapped = (vehicleId: string): boolean => {
    return vehicles.some(v => v.vehicleId === vehicleId && v.isActive === 'true');
  };

  /**
   * Get unmapped vehicles from trip data
   */
  const getUnmappedVehicles = (tripData: any[]): string[] => {
    const uniqueVehicles = [...new Set(tripData.map(trip => trip["Vehicle ID"]).filter(Boolean))];
    return uniqueVehicles.filter(vehicleId => !isVehicleMapped(vehicleId));
  };

  return {
    vehicles,
    companies,
    drivers,
    mapTripToCompany,
    getMappingStats,
    isVehicleMapped,
    getUnmappedVehicles
  };
}