import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

// Company details from transport orders system
const COMPANY_DETAILS = {
  "Fast & Express S.R.L.": {
    "CIF": "RO35986465",
    "Trade register number": "J34/227/2016",
    "Company Address": "Str. Dunarii, -, Bl:1604, Sc:d, Et:parter, Ap:42, -",
    "Location": "Alexandria",
    "County": "Teleorman",
    "Country": "Romania",
    "Contact": ""
  },
  "Stef Trans S.R.L.": {
    "CIF": "RO19075934",
    "Trade register number": "J34/570/2006",
    "Company Address": "-, -",
    "Location": "Dobrotesti",
    "County": "Teleorman",
    "Country": "Romania",
    "Contact": "0729897775, scsteftrans@yahoo.com"
  },
  "De Cargo Sped S.R.L.": {
    "CIF": "RO43642683",
    "Trade register number": "J34/70/2021",
    "Company Address": "Str. Iasomiei, 9, -",
    "Location": "Mavrodin",
    "County": "Teleorman",
    "Country": "Romania",
    "Contact": "Ginel, 0763698696, decargosped@gmail.com"
  },
  "Daniel Ontheroad S.R.L.": {
    "CIF": "RO40383134",
    "Trade register number": "J34/27/2019",
    "Company Address": "Str. Sos. Turnu Magurele, 4-6, Bl:601, Sc:a, Et:2, Ap:10, -",
    "Location": "Alexandria",
    "County": "Teleorman",
    "Country": "Romania",
    "Contact": "Mariana, 0762653911, feleagadanut@gmail.com"
  }
};

// Enhanced driver company mapping with complete information
const DRIVER_COMPANY_MAP_ORIGINAL = {
  "ADRIAN  MIRON": "Fast Express",
  "Adrian miron": "Fast Express",
  "Andrei Serban Badea": "Fast Express",
  "Petrisor Besteala": "Fast Express",
  "Georgian Florentin Moise": "Fast Express",
  "Gabriel Marian Ivan": "Fast Express",
  "Olteanu Ionut": "Fast Express",
  "Marius Condila": "Fast Express",
  "Teodor Petrișor Chiar": "Fast Express",
  // "Tiberiu Iulian  Ivan": "Fast Express", // MOVED TO DATABASE - ACUM LA WF SRL
  "Marius Adrian Badea": "Fast Express",
  "Florin Oprea": "Fast Express",
  "George Mihaita Butnaru": "Fast Express",
  "Dan Costinel Savu": "Fast Express",
  "Iosip Ionel": "Fast Express",
  "Andrei Tanase": "Fast Express",
  "Pana Stefan Daniel": "Fast Express",
  "Vasilică Roman": "Fast Express",
  "Florin Nicolae Sanislai": "Fast Express",
  "Costica Mihalcea": "Daniel Ontheroad",
  "Adrian Budescu": "Daniel Ontheroad",
  "Danut Feleaga": "Daniel Ontheroad",
  // "Razvan Jurubita": "Daniel Ontheroad", // MOVED TO DATABASE
  "Feleagă Marian": "Daniel Ontheroad",
  "Dimitrov F": "Daniel Ontheroad",
  "Cernat Lucian Marian": "DE Cargo Speed",
  "Draghici Marius Sorin": "DE Cargo Speed",
  "Sorin petrisor Dumitrache": "DE Cargo Speed",
  "Petre Iulian LEUCE": "DE Cargo Speed",
  "Gorgos Adrian": "Stef Trans S.R.L.",
  "Barbuceanu Anghel": "Stef Trans S.R.L.",
  "Adi-Nicolae Gocea": "Stef Trans S.R.L.",
  "Dumitru Ciobanu": "Stef Trans S.R.L.",
  "Dimache Mihalache": "Stef Trans S.R.L.",
  "Toma Alin Marian": "Toma SRL",
  "Balanean Daniel": "Toma SRL",
  "Alexandru Sorin Geanta": "Toma SRL"
};

export function useTransportData() {
  // All useState hooks first - IMPORTANT: Keep all in fixed order for React Rules of Hooks
  const [tripData, setTripData] = useState<any>(null);
  const [invoice7Data, setInvoice7Data] = useState<any>(null);
  const [invoice30Data, setInvoice30Data] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: string[]}>({ trip: [], invoice7: [], invoice30: [] });
  const [processedData, setProcessedData] = useState<any>({});
  const [savedProcessedData, setSavedProcessedData] = useState<any>({}); // Data saved to database
  const [payments, setPayments] = useState<any>({});
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [weeklyPaymentHistory, setWeeklyPaymentHistory] = useState<any>({});
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [processingWeek, setProcessingWeek] = useState('');
  const [weeklyProcessingData, setWeeklyProcessingData] = useState<any[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [dynamicDriverMap, setDynamicDriverMap] = useState<Record<string, string>>({});
  const [smallAmountAlerts, setSmallAmountAlerts] = useState<any[]>([]);
  const [pendingMappings, setPendingMappings] = useState<Array<{
    vrid: string;
    driverName: string;
    suggestedCompanies: string[];
  }>>([]);
  
  // All useRef hooks
  const tripFileRef = useRef<HTMLInputElement>(null);
  const invoice7FileRef = useRef<HTMLInputElement>(null);
  const invoice30FileRef = useRef<HTMLInputElement>(null);
  
  // Load small amount alerts from API
  const loadSmallAmountAlerts = async () => {
    try {
      const response = await fetch('/api/small-amount-alerts/status/pending');
      if (response.ok) {
        const alerts = await response.json();
        setSmallAmountAlerts(alerts);
        console.log(`🚨 Loaded ${alerts.length} pending small amount alerts`);
      }
    } catch (error) {
      console.error('Error loading small amount alerts:', error);
    }
  };

  // All useEffect hooks
  useEffect(() => {
    loadAllWeeklyProcessing();
    loadDriversFromDatabase();
    loadSmallAmountAlerts();
  }, []);

  // Generate name variants - Enhanced for better matching!
  const generateNameVariants = (name: string) => {
    const cleaned = name.trim().replace(/\s+/g, ' ');
    const variants = [cleaned.toLowerCase()];
    
    const parts = cleaned.split(' ');
    if (parts.length > 1) {
      // Standard reversed order
      const reversed = [...parts].reverse();
      variants.push(reversed.join(' ').toLowerCase());
      
      // Add partial matches for cases like "Dumitrache Sorin" vs "Sorin petrisor Dumitrache"
      parts.forEach((part, index) => {
        if (part.length > 2) {  // Skip very short parts
          const otherParts = parts.filter((_, i) => i !== index);
          otherParts.forEach(otherPart => {
            if (otherPart.length > 2) {
              variants.push(`${part.toLowerCase()} ${otherPart.toLowerCase()}`);
              variants.push(`${otherPart.toLowerCase()} ${part.toLowerCase()}`);
            }
          });
        }
      });
      
      if (parts.length >= 3) {
        const [first, ...rest] = parts;
        const restReversed = [...rest].reverse();
        variants.push(`${first.toLowerCase()} ${restReversed.join(' ').toLowerCase()}`);
        
        const last = parts[parts.length - 1];
        const beforeLast = parts.slice(0, -1).reverse();
        variants.push(`${last.toLowerCase()} ${beforeLast.join(' ').toLowerCase()}`);
      }
    }
    
    return Array.from(new Set(variants));
  };

  // Load drivers from database and combine with static mapping
  
  const loadDriversFromDatabase = async () => {
    try {
      console.log('🔄 Loading drivers from database...');
      const [driversResponse, companiesResponse] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/companies')
      ]);
      
      if (driversResponse.ok && companiesResponse.ok) {
        const drivers = await driversResponse.json();
        const companies = await companiesResponse.json();
        console.log('📥 Raw API response - drivers:', drivers.length, 'companies:', companies.length);
        
        const dbDriverMap: Record<string, string> = {};
        
        drivers.forEach((driver: any) => {
          if (driver.companyId) {
            const company = companies.find((c: any) => c.id === driver.companyId);
            if (company) {
              // Map company names to match processing logic
              let mappedCompanyName = company.name;
              if (company.name === 'Fast & Express S.R.L.') {
                mappedCompanyName = 'Fast Express';
              } else if (company.name === 'De Cargo Sped S.R.L.') {
                mappedCompanyName = 'DE Cargo Speed';
              } else if (company.name === 'Stef Trans S.R.L.') {
                mappedCompanyName = 'Stef Trans S.R.L.';
              } else if (company.name === 'Toma SRL') {
                mappedCompanyName = 'Toma SRL';
              } else if (company.name === 'Daniel Ontheroad S.R.L.') {
                mappedCompanyName = 'Daniel Ontheroad S.R.L.';
              } else if (company.name === 'WF SRL') {
                mappedCompanyName = 'WF SRL';
              }
              
              // Generate variants for each driver name
              const variants = generateNameVariants(driver.name);
              variants.forEach(variant => {
                dbDriverMap[variant] = mappedCompanyName;
              });
            }
          }
        });
        
        setDynamicDriverMap(dbDriverMap);
            console.log('✅ Încărcat mappingul șoferilor din baza de date:', Object.keys(dbDriverMap).length, 'variante');
        console.log('👥 Numărul șoferilor din baza de date:', drivers.length);
        console.log('🔗 Total mapări:', {
          'Toma SRL': Object.entries(dbDriverMap).filter(([key, company]) => company === 'Toma SRL').length,
          'Fast Express': Object.entries(dbDriverMap).filter(([key, company]) => company === 'Fast Express').length,
          'Daniel Ontheroad': Object.entries(dbDriverMap).filter(([key, company]) => company === 'Daniel Ontheroad S.R.L.').length,
          'Total': Object.keys(dbDriverMap).length
        });
        console.log('🔍 Jurubita mapping:', Object.entries(dbDriverMap).filter(([key, company]) => key.includes('jurubita') || key.includes('razvan')));
        
        // Check if Jurubita is updated correctly - find exact match
        const jurubita = drivers.find((d: any) => d.name.toLowerCase().includes('jurubita'));
        if (jurubita) {
          const jurubCompany = companies.find((c: any) => c.id === jurubita.companyId);
          console.log('🔍 Jurubita în DB:', jurubita.name, '→', jurubCompany?.name, '(companyId:', jurubita.companyId, ')');
        }
        return dbDriverMap;
      }
    } catch (error) {
      console.error('Error loading drivers from database:', error);
    }
    return {};
  };

  // Build complete normalized dictionary (static + dynamic)
  const getCompleteDriverMap = () => {
    const DRIVER_COMPANY_MAP: Record<string, string> = {};
    
    // Add static mapping first
    Object.entries(DRIVER_COMPANY_MAP_ORIGINAL).forEach(([driver, company]) => {
      const variants = generateNameVariants(driver);
      variants.forEach(variant => {
        DRIVER_COMPANY_MAP[variant] = company;
      });
    });
    
    // Add dynamic mapping (will override static if same name exists) - DATABASE WINS!
    Object.entries(dynamicDriverMap).forEach(([variant, company]) => {
      DRIVER_COMPANY_MAP[variant] = company;
      // Log overrides for debugging
      if (variant.includes('jurubita') || variant.includes('razvan')) {
        console.log('🔄 Override static mapping:', variant, '→', company);
      }
    });
    
    return DRIVER_COMPANY_MAP;
  };

  // Auto-suggest company for unmapped drivers
  const autoSuggestCompany = (driverName: string, driverMap: Record<string, string>) => {
    const parts = driverName.toLowerCase().split(' ');
    const companyCount: Record<string, number> = {};
    
    // Count how many drivers from each company share name parts
    Object.entries(driverMap).forEach(([mappedName, company]) => {
      const mappedParts = mappedName.split(' ');
      let matches = 0;
      
      parts.forEach(part => {
        if (part.length > 2 && mappedParts.some(mp => mp.includes(part) || part.includes(mp))) {
          matches++;
        }
      });
      
      if (matches > 0) {
        companyCount[company] = (companyCount[company] || 0) + matches;
      }
    });
    
    // Return company with highest match score
    const sortedCompanies = Object.entries(companyCount).sort((a, b) => b[1] - a[1]);
    return sortedCompanies.length > 0 && sortedCompanies[0][1] >= 1 ? sortedCompanies[0][0] : null;
  };

  // State for pending driver mappings - now declared at the top

  // Add driver to database after user confirmation
  const addDriverToDatabase = async (driverName: string, selectedCompany: string) => {
    try {
      // Check if driver already exists first
      const existingDriversResponse = await fetch('/api/drivers');
      if (existingDriversResponse.ok) {
        const existingDrivers = await existingDriversResponse.json();
        const existingDriver = existingDrivers.find((d: any) => 
          d.name.toLowerCase().trim() === driverName.toLowerCase().trim()
        );
        
        if (existingDriver) {
          console.log('🔄 Șoferul există deja în baza de date:', existingDriver);
          // Reload drivers to update mapping
          await loadDriversFromDatabase();
          return selectedCompany;
        }
      }

      const companiesResponse = await fetch('/api/companies');
      if (companiesResponse.ok) {
        const companies = await companiesResponse.json();
        let targetCompanyId = null;
        
        // Find company ID by matching selected company name
        for (const company of companies) {
          // First try exact match for full database company names
          if (company.name === selectedCompany) {
            targetCompanyId = company.id;
            break;
          }
          // Then try legacy mappings for backwards compatibility
          else if (company.name === 'Fast & Express S.R.L.' && selectedCompany === 'Fast Express') {
            targetCompanyId = company.id;
            break;
          } else if (company.name === 'Stef Trans S.R.L.' && selectedCompany === 'Stef Trans') {
            targetCompanyId = company.id;
            break;
          } else if (company.name === 'De Cargo Sped S.R.L.' && selectedCompany === 'DE Cargo Speed') {
            targetCompanyId = company.id;
            break;
          } else if (company.name === 'Daniel Ontheroad S.R.L.' && selectedCompany === 'Daniel Ontheroad') {
            targetCompanyId = company.id;
            break;
          } else if (company.name === 'Bis General' && selectedCompany === 'Bis General') {
            targetCompanyId = company.id;
            break;
          } else if (company.name === 'Toma SRL' && selectedCompany === 'Toma SRL') {
            targetCompanyId = company.id;
            break;
          } else if (company.name === 'wf srl' && selectedCompany === 'wf srl') {
            targetCompanyId = company.id;
            break;
          }
        }
        
        if (targetCompanyId) {
          const response = await fetch('/api/drivers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: driverName,
              companyId: targetCompanyId
            })
          });
          
          if (response.ok) {
            console.log(`✅ Adăugat șofer nou: "${driverName}" → "${selectedCompany}"`);
            await loadDriversFromDatabase();
            // Trigger reprocessing of existing data with new driver mappings
            console.log('🔄 Declanșez reprocessing după salvarea șoferului...');
            
            // Clear pending mappings only for the added driver
            setPendingMappings(prev => prev.filter(p => p.driverName !== driverName));
            
            // Force immediate reprocessing with a slight delay to ensure DB is updated
            console.log('⚡ Execut reprocessing-ul IMEDIAT...');
            setTimeout(() => {
              reprocessExistingData();
            }, 500);
            return selectedCompany;
          } else {
            console.error('❌ Eroare la adăugarea șoferului:', await response.text());
          }
        } else {
          console.error('❌ Nu s-a găsit compania:', selectedCompany, 'în lista:', companies.map((c: any) => c.name));
        }
      }
    } catch (error) {
      console.error('Error adding driver:', error);
    }
    return null;
  };

  const extractAndFindDriver = (driverName: string) => {
    if (!driverName || typeof driverName !== 'string') {
      console.log('Driver name invalid:', driverName);
      return "Unknown";
    }
    
    const DRIVER_COMPANY_MAP = getCompleteDriverMap();
    const drivers = driverName.split(',').map(d => d.trim());
    
    for (const driver of drivers) {
      if (!driver) continue;
      
      const normalized = driver.toLowerCase().trim().replace(/\s+/g, ' ');
      
      if (DRIVER_COMPANY_MAP[normalized]) {
        console.log(`Driver găsit: "${driver}" -> ${DRIVER_COMPANY_MAP[normalized]}`);
        return DRIVER_COMPANY_MAP[normalized];
      }
      
      const variants = generateNameVariants(driver);
      for (const variant of variants) {
        if (DRIVER_COMPANY_MAP[variant]) {
          console.log(`Driver găsit prin variantă: "${driver}" (${variant}) -> ${DRIVER_COMPANY_MAP[variant]}`);
          return DRIVER_COMPANY_MAP[variant];
        }
      }
    }
    
    // Driver not found - add to pending mappings for user confirmation
    console.log(`💡 Șofer nou detectat: "${driverName}"`);
    
    // Try to suggest a company based on similar drivers
    const suggestedCompany = autoSuggestCompany(driverName, dynamicDriverMap);
    const finalSuggestion = suggestedCompany || 'Fast Express'; // Default suggestion
    
    console.log(`   Sugestie: ${finalSuggestion}`);
    
    // Check if driver already exists in pending mappings - if so, don't add again
    const isAlreadyPending = pendingMappings.some(p => p.driverName === driverName);
    if (!isAlreadyPending) {
      const allCompanies = ['Fast Express', 'Stef Trans', 'DE Cargo Speed', 'Toma SRL'];
      const alternatives = allCompanies.filter(c => c !== finalSuggestion);
      
      setPendingMappings(prev => [...prev, {
        driverName,
        suggestedCompany: finalSuggestion,
        alternatives
      }]);
      console.log(`📝 Adăugat în pending mappings: ${driverName} → ${finalSuggestion}`);
    } else {
      console.log(`⏳ Șoferul "${driverName}" este deja în lista de pending mappings`);
    }
    
    // Return Unknown instead of Pending to avoid creating problematic categories
    return "Unknown";
  };

  // Reprocess existing data with updated driver mappings
  const reprocessExistingData = async () => {
    if (!tripData || !invoice7Data || !invoice30Data) {
      console.log('🔄 No existing data to reprocess - missing trip/invoice data');
      return;
    }

    console.log('🔄 Reprocessing existing data with updated driver mappings...');
    
    // Reload drivers to get latest mappings
    console.log('📥 Reîncarcă șoferii din baza de date...');
    await loadDriversFromDatabase();
    
    // Keep current pending mappings for drivers that are still unmatched
    console.log('✅ Menține mapping-urile pendinte pentru șoferii rămași...');
    
    // Force complete state reset for clean reprocessing
    setProcessedData({});
    
    // Call processData to reprocess everything with new mappings
    console.log('⚙️ Reprocesează toate datele cu mapping-urile actualizate...');
    
    try {
      // Process the data with the updated driver mappings
      await processData();
      
      // Force component re-render by switching tabs and back
      console.log('🔄 Forțez actualizarea UI-ului prin schimbarea tab-ului...');
      const currentTab = activeTab;
      setActiveTab('upload');
      setTimeout(() => {
        setActiveTab('calculations');
        console.log('✅ Data reprocessed - Pending Mappings should be resolved');
      }, 200);
      
    } catch (error) {
      console.error('❌ Eroare la reprocessare:', error);
    }
  };

  // Week functions - DO NOT MODIFY!
  const getCurrentWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day;
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // ALWAYS include year for clarity in 2025 to avoid confusion with 2024 data
    const currentYear = now.getFullYear();
    const startYear = startOfWeek.getFullYear();
    const endYear = endOfWeek.getFullYear();
    
    let label;
    // Always include year starting from 2025 to distinguish from 2024 data
    if (currentYear >= 2025 || startYear !== currentYear || endYear !== currentYear || startYear !== endYear) {
      // Include year for clarity
      label = `${startOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      console.log(`📅 Week label with year: "${label}" (current year: ${currentYear})`);
    } else {
      label = `${startOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}`;
    }
    
    return {
      start: startOfWeek,
      end: endOfWeek,
      label
    };
  };

  const getWeekRangeForDate = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = date.getDay();
    const diff = date.getDate() - day;
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // ALWAYS include year for clarity in 2025 to avoid confusion with 2024 data
    const currentYear = new Date().getFullYear();
    const startYear = startOfWeek.getFullYear();
    const endYear = endOfWeek.getFullYear();
    
    let label;
    // Always include year starting from 2025 to distinguish from 2024 data
    if (currentYear >= 2025 || startYear !== currentYear || endYear !== currentYear || startYear !== endYear) {
      // Include year for clarity
      label = `${startOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      console.log(`📅 Week range for date: "${label}" (current year: ${currentYear})`);
    } else {
      label = `${startOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}`;
    }
    
    return {
      start: startOfWeek,
      end: endOfWeek,
      label
    };
  };

  const getWeekOptions = () => {
    const weeks = [];
    const currentWeek = getCurrentWeekRange();
    
    weeks.push({
      value: currentWeek.label,
      label: `Această săptămână (${currentWeek.label})`,
      start: currentWeek.start,
      end: currentWeek.end
    });
    
    for (let i = 1; i <= 8; i++) {
      const weekStart = new Date(currentWeek.start);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Check if we need to add year info for older weeks
      const currentYear = new Date().getFullYear();
      const startYear = weekStart.getFullYear();
      const endYear = weekEnd.getFullYear();
      
      let label;
      if (startYear !== currentYear || endYear !== currentYear || startYear !== endYear) {
        // Include year when it's not current year or crosses years
        label = `${weekStart.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })} - ${weekEnd.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else {
        label = `${weekStart.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}`;
      }
      
      weeks.push({
        value: label,
        label: label,
        start: weekStart,
        end: weekEnd
      });
    }
    
    return weeks;
  };

  // Calendar functions - DO NOT MODIFY!
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false
      });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }
    
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push({
        date: new Date(year, month + 1, nextMonthDay),
        isCurrentMonth: false
      });
      nextMonthDay++;
    }
    
    return days;
  };

  const selectWeekFromCalendar = (date: Date) => {
    const weekRange = getWeekRangeForDate(date);
    setSelectedWeek(weekRange.label);
    setProcessingWeek(weekRange.label);
    setShowCalendar(false);
  };

  const isDateInSelectedWeek = (date: Date) => {
    if (!selectedWeek && !processingWeek) return false;
    
    const weekToCheck = selectedWeek || processingWeek;
    const weekRange = getWeekRangeForDate(date);
    return weekRange.label === weekToCheck;
  };

  const canSelectDate = (date: Date) => {
    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    return date >= twoYearsAgo && date <= now;
  };

  // File processing with multi-sheet support
  const parseExcel = (arrayBuffer: ArrayBuffer, fileName: string = '') => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      console.log(`📊 Excel file "${fileName}" has ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);
      
      // Check if there's a "Payment Details" sheet for multi-tab files
      const paymentDetailsSheet = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('payment details') || 
        name.toLowerCase().includes('payment_details') ||
        name.toLowerCase().includes('paymentdetails')
      );
      
      if (paymentDetailsSheet) {
        console.log(`💳 Found Payment Details sheet: "${paymentDetailsSheet}"`); 
        return parsePaymentDetailsSheet(workbook, paymentDetailsSheet);
      }
      
      // Default behavior - use first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) return [];
      
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1);
      
      return rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = (row as any[])[index] || '';
        });
        return obj;
      }).filter(row => Object.values(row).some(val => val !== '' && val !== null && val !== undefined));
      
    } catch (error) {
      console.error('Eroare la parsarea Excel:', error);
      throw new Error('Nu s-a putut citi fișierul Excel');
    }
  };
  
  // Parse Payment Details sheet - extract VRIDs from column E and amounts from column AF
  const parsePaymentDetailsSheet = (workbook: any, sheetName: string) => {
    try {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      console.log(`🔍 Payment Details sheet has ${jsonData.length} rows`);
      
      if (jsonData.length < 2) {
        console.log('❌ Payment Details sheet is empty or has no data rows');
        return [];
      }
      
      const extractedData = [];
      
      // Skip header row, start from row 1 (index 1)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        
        // Column E (index 4) - VRID
        const vridRaw = row[4];
        const vrid = vridRaw ? String(vridRaw).trim() : '';
        
        // Column AF (index 31) - Amount (AF is the 32nd column, so index 31)
        const rawAmount = row[31];
        const amount = rawAmount ? parseFloat(String(rawAmount).replace(/[^0-9.-]/g, '')) : 0;
        
        if (vrid && !isNaN(amount) && amount > 0) {
          extractedData.push({
            'Tour ID': vrid,
            'Load ID': vrid, // Add both for compatibility
            'Gross Pay Amt (Excl. Tax)': amount,
            'Source': 'Payment Details Tab',
            'Row': i + 1
          });
        }
      }
      
      console.log(`✅ Extracted ${extractedData.length} records from Payment Details:`);
      console.log('📋 Sample data:', extractedData.slice(0, 3));
      console.log('💰 Total amount:', extractedData.reduce((sum, item) => sum + Number(item['Gross Pay Amt (Excl. Tax)']), 0).toFixed(2));
      
      return extractedData;
      
    } catch (error) {
      console.error('Error parsing Payment Details sheet:', error);
      throw new Error('Nu s-a putut citi foaia Payment Details');
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    }).filter(row => Object.values(row).some(val => val));
  };

  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return;
    
    setLoading(true);
    try {
      let data = [];
      
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        data = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        data = parseExcel(arrayBuffer, file.name);
      } else {
        throw new Error('Format de fișier nesuportat. Acceptăm CSV și Excel.');
      }
      
      console.log(`Fișier ${type} încărcat:`, {
        nume: file.name,
        randuri: data.length,
        coloane: Object.keys(data[0] || {}),
        primeleRanduri: data.slice(0, 2)
      });
      
      if (type === 'trip') {
        setTripData(data);
        setUploadedFiles(prev => ({ ...prev, trip: [file.name] }));
      } else if (type === 'invoice7') {
        setInvoice7Data(data);
        setUploadedFiles(prev => ({ ...prev, invoice7: [file.name] }));
      } else if (type === 'invoice30') {
        // Pentru facturile de 30 zile, combină datele din toate fișierele încărcate
        setInvoice30Data((prevData: any) => {
          if (prevData && prevData.length > 0) {
            // Combină cu datele existente dacă sunt mai multe fișiere selectate
            console.log(`🔄 Combinând ${prevData.length} înregistrări existente cu ${data.length} noi înregistrări`);
            return [...prevData, ...data];
          }
          return data;
        });
        // Păstrează lista de fișiere pentru afișare (ca să știe utilizatorul ce a încărcat)
        setUploadedFiles(prev => ({ 
          ...prev, 
          invoice30: [...prev.invoice30, file.name] 
        }));
      }
      
    } catch (error: any) {
      console.error('Eroare la încărcarea fișierului:', error);
      alert('Eroare la încărcarea fișierului: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Data processing with dynamic driver loading
  const processData = async () => {
    if (!tripData || !invoice7Data || !invoice30Data) {
      alert('Vă rugăm să încărcați toate fișierele necesare.');
      return;
    }

    if (!processingWeek) {
      alert('Vă rugăm să selectați săptămâna pentru care procesați datele.');
      return;
    }

    setLoading(true);
    
    // Reset small amount alerts at start of processing
    setSmallAmountAlerts([]);
    
    // Load fresh driver data before processing
    await loadDriversFromDatabase();
    
    const results: any = {};
    const unmatchedVrids: string[] = []; // Track unmatched VRIDs for historical search
    const currentAlerts: Array<{vrid: string, amount: number, company: string, invoiceType: string}> = []; // Track small amounts ≤10 EUR

    try {
      const processInvoice = (invoiceData: any[], invoiceType: string) => {
        console.log(`📋 Procesez facturi ${invoiceType}...`);
        let processedCount = 0;
        let skippedCount = 0;
        let totalProcessed = 0;
        const processedVRIDs: Array<{ vrid: string; amount: number; company: string; row: number }> = [];
        
        invoiceData.forEach((row, index) => {
          let vrid = '';
          if (row['Tour ID'] && row['Tour ID'].trim()) {
            vrid = row['Tour ID'].trim();
          } else if (row['Load ID'] && row['Load ID'].trim()) {
            vrid = row['Load ID'].trim();
          } else {
            vrid = `UNKNOWN-${index}`;
          }

          const amount = parseFloat(row['Gross Pay Amt (Excl. Tax)'] || 0);
          if (isNaN(amount) || amount === 0) {
            skippedCount++;
            return;
          }
          
          processedCount++;
          totalProcessed += amount;
          // Note: company will be determined later in processing
          processedVRIDs.push({ vrid, amount, company: 'TBD', row: index + 1 });

          const tripRecord = tripData.find((trip: any) => 
            trip['Trip ID'] === vrid || trip['VR ID'] === vrid
          );

          let company = 'Unmatched';
          if (tripRecord && tripRecord['Driver']) {
            const foundCompany = extractAndFindDriver(tripRecord['Driver']);
            if (foundCompany !== 'Unknown' && foundCompany !== 'Pending') {
              company = foundCompany;
            } else if (foundCompany === 'Pending') {
              console.log(`⚠️ VRID ${vrid} - Șofer în așteptare: "${tripRecord['Driver']}" - FORȚEZ RECÂUTAREA!`);
              // Force immediate re-lookup with dynamic driver map to bypass pending state
              const dynamicMap = getCompleteDriverMap();
              const driverName = tripRecord['Driver'];
              const normalized = driverName.toLowerCase().trim().replace(/\s+/g, ' ');
              
              // Try all possible variations to find a match
              if (dynamicMap[normalized]) {
                company = dynamicMap[normalized];
                console.log(`✅ VRID ${vrid} - Șofer găsit prin forțare: "${driverName}" → ${company}`);
              } else {
                // Try name variants
                const variants = generateNameVariants(driverName);
                let found = false;
                for (const variant of variants) {
                  if (dynamicMap[variant]) {
                    company = dynamicMap[variant];
                    console.log(`✅ VRID ${vrid} - Șofer găsit prin variantă: "${driverName}" (${variant}) → ${company}`);
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  company = 'Unmatched'; // Put in Unmatched for historical search
                  unmatchedVrids.push(vrid);
                  console.log(`❌ VRID ${vrid} - Șofer cu adevărat necunoscut: "${driverName}" - pus în Unmatched`);
                }
              }
            } else {
              console.log(`VRID ${vrid} - Șofer negăsit: "${tripRecord['Driver']}"`);
            }
          } else {
            console.log(`VRID ${vrid} - Nu s-a găsit în trip data - Căutăm în istoric...`);
            unmatchedVrids.push(vrid); // Track for historical search
            
            // 🔍 DEBUG: Caută în toate trip records pentru acest VRID
            const alternativeSearch = tripData.find((trip: any) => 
              JSON.stringify(trip).toLowerCase().includes(vrid.toLowerCase())
            );
            if (alternativeSearch) {
              console.log(`🕵️ VRID ${vrid} găsit în trip data prin căutare alternativă:`, alternativeSearch);
              const foundCompany = extractAndFindDriver(alternativeSearch['Driver']);
              console.log(`🎯 VRID ${vrid} ar trebui să fie la: ${foundCompany}`);
            } else {
              console.log(`❌ VRID ${vrid} absolut negăsit în trip data`);
            }
          }

          // ⚠️ DETECTARE SUME MICI - Alert pentru sume ≤5 EUR (tipic Amazon placeholders)
          if (amount <= 5) {
            const alert = {
              vrid: vrid,
              amount: amount,
              company: company,
              invoiceType: invoiceType === '7_days' ? '7 zile' : '30 zile'
            };
            currentAlerts.push(alert);
            console.log(`⚠️ SUMĂ MICĂ DETECTATĂ: VRID ${vrid} - €${amount.toFixed(2)} (${company} - ${invoiceType === '7_days' ? '7 zile' : '30 zile'})`);
          }

          if (!results[company]) {
            results[company] = {
              Total_7_days: 0,
              Total_30_days: 0,
              Total_comision: 0,
              VRID_details: {}
            };
          }

          // 🚫 VRID-urile Unmatched NU PRIMESC COMISION!
          // Comisionul se calculează doar când sunt asignate la o companie reală
          let commission = 0;
          if (company !== 'Unmatched' && company !== 'Pending Mapping') {
            const commissionRate = company === "Fast Express" ? 0.02 : 0.04;
            commission = amount * commissionRate;
            console.log(`💰 VRID ${vrid}: €${amount.toFixed(2)} → ${company} (comision: €${commission.toFixed(2)} la ${(commissionRate*100)}%)`);
          } else {
            console.log(`🚫 VRID ${vrid}: €${amount.toFixed(2)} → ${company} (FĂRĂ COMISION - se va calcula la asignare)`);
          }

          if (invoiceType === '7_days') {
            results[company].Total_7_days += amount;
          } else {
            results[company].Total_30_days += amount;
          }
          
          results[company].Total_comision += commission;

          if (!results[company].VRID_details[vrid]) {
            results[company].VRID_details[vrid] = {
              '7_days': 0,
              '30_days': 0,
              'commission': 0
            };
          }

          results[company].VRID_details[vrid][invoiceType] = amount;
          results[company].VRID_details[vrid].commission += commission;
        });
        
        console.log(`✅ ${invoiceType}: ${processedCount} procese, ${skippedCount} sărite, total €${totalProcessed.toFixed(2)}`);
        
        // Show first and last few processed items for verification
        if (processedVRIDs.length > 0) {
          console.log(`📄 Primele 3 VRID-uri procesate (${invoiceType}):`, processedVRIDs.slice(0, 3));
          if (processedVRIDs.length > 6) {
            console.log(`📄 Ultimele 3 VRID-uri procesate (${invoiceType}):`, processedVRIDs.slice(-3));
          }
        }
      };

      console.log('🔢 ÎNCEPE CALCULAREA FACTURILOR:');
      console.log(`📊 Facturi 7 zile: ${invoice7Data.length} linii`);
      console.log(`📊 Facturi 30 zile: ${invoice30Data.length} linii`);
      
      // Debug: Show specific invoice numbers mentioned by user
      const targetInvoices = ['7744', '1741', 'E470', 'A7A8'];
      console.log('🔍 CĂUTARE FACTURI SPECIFICE:');
      
      targetInvoices.forEach(invoiceNum => {
        const found7Days = invoice7Data.filter((row: any) => 
          (row['Tour ID'] && row['Tour ID'].includes(invoiceNum)) ||
          (row['Load ID'] && row['Load ID'].includes(invoiceNum)) ||
          JSON.stringify(row).includes(invoiceNum)
        );
        const found30Days = invoice30Data.filter((row: any) => 
          (row['Tour ID'] && row['Tour ID'].includes(invoiceNum)) ||
          (row['Load ID'] && row['Load ID'].includes(invoiceNum)) ||
          JSON.stringify(row).includes(invoiceNum)
        );
        
        if (found7Days.length > 0) {
          console.log(`📋 Invoice ${invoiceNum} găsită în 7 zile:`, found7Days);
        }
        if (found30Days.length > 0) {
          console.log(`📋 Invoice ${invoiceNum} găsită în 30 zile:`, found30Days);
        }
        if (found7Days.length === 0 && found30Days.length === 0) {
          console.log(`❌ Invoice ${invoiceNum} nu a fost găsită în datele procesate`);
        }
      });
      
      // Calculate totals before processing
      const invoice7Total = invoice7Data.reduce((sum: number, row: any) => {
        const amount = parseFloat(row['Gross Pay Amt (Excl. Tax)'] || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const invoice30Total = invoice30Data.reduce((sum: number, row: any) => {
        const amount = parseFloat(row['Gross Pay Amt (Excl. Tax)'] || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      console.log(`💰 TOTAL BRUT FACTURI 7 ZILE: €${invoice7Total.toFixed(2)}`);
      console.log(`💰 TOTAL BRUT FACTURI 30 ZILE: €${invoice30Total.toFixed(2)}`);
      console.log(`💰 TOTAL BRUT TOATE FACTURILE: €${(invoice7Total + invoice30Total).toFixed(2)}`);
      
      processInvoice(invoice7Data, '7_days');
      processInvoice(invoice30Data, '30_days');
      
      // Calculate and display final totals
      let finalTotal7Days = 0;
      let finalTotal30Days = 0;
      let finalTotalCommission = 0;
      
      Object.keys(results).forEach(company => {
        finalTotal7Days += results[company].Total_7_days;
        finalTotal30Days += results[company].Total_30_days;
        finalTotalCommission += results[company].Total_comision;
      });
      
      console.log('🏁 REZULTATE FINALE DUPĂ PROCESARE:');
      console.log(`💰 Total procesat 7 zile: €${finalTotal7Days.toFixed(2)}`);
      console.log(`💰 Total procesat 30 zile: €${finalTotal30Days.toFixed(2)}`);
      console.log(`💰 Total procesat toate: €${(finalTotal7Days + finalTotal30Days).toFixed(2)}`);
      console.log(`💸 Total comisioane: €${finalTotalCommission.toFixed(2)}`);
      
      // 📊 VERIFICARE DETALIATĂ TOTALE FACTURI vs. SUME PROCESATE
      const expectedTotal = invoice7Total + invoice30Total;
      const actualTotal = finalTotal7Days + finalTotal30Days;
      const discrepancy = expectedTotal - actualTotal;
      const discrepancy7Days = invoice7Total - finalTotal7Days;
      const discrepancy30Days = invoice30Total - finalTotal30Days;
      
      console.log('');
      console.log('🔍 VERIFICARE FINALĂ TOTALE FACTURI vs. PROCESARE:');
      console.log('═══════════════════════════════════════════════════');
      console.log(`📋 FACTURI ÎNCĂRCATE:`);
      console.log(`   • 7 zile: €${invoice7Total.toFixed(2)} (${invoice7Data.length} facturi)`);
      console.log(`   • 30 zile: €${invoice30Total.toFixed(2)} (${invoice30Data.length} facturi)`);
      console.log(`   • TOTAL FACTURI: €${expectedTotal.toFixed(2)}`);
      console.log(``);
      console.log(`⚙️ PROCESARE SISTEM:`);
      console.log(`   • 7 zile: €${finalTotal7Days.toFixed(2)}`);
      console.log(`   • 30 zile: €${finalTotal30Days.toFixed(2)}`);
      console.log(`   • TOTAL PROCESAT: €${actualTotal.toFixed(2)}`);
      console.log(`   • Total comisioane: €${finalTotalCommission.toFixed(2)}`);
      
      if (Math.abs(discrepancy) > 0.01) {
        console.log('');
        console.log('🚨🚨🚨 AVERTIZARE - DIFERENȚĂ DETECTATĂ! 🚨🚨🚨');
        console.log('═══════════════════════════════════════════════════');
        console.log(`⚠️ DIFERENȚĂ TOTALĂ: €${Math.abs(discrepancy).toFixed(2)} ${discrepancy > 0 ? '(LIPSESC din procesare)' : '(ÎN PLUS în procesare)'}`);
        
        if (Math.abs(discrepancy7Days) > 0.01) {
          console.log(`   • Diferență 7 zile: €${Math.abs(discrepancy7Days).toFixed(2)} ${discrepancy7Days > 0 ? '(lipsesc)' : '(în plus)'}`);
        }
        if (Math.abs(discrepancy30Days) > 0.01) {
          console.log(`   • Diferență 30 zile: €${Math.abs(discrepancy30Days).toFixed(2)} ${discrepancy30Days > 0 ? '(lipsesc)' : '(în plus)'}`);
        }
        
        console.log('═══════════════════════════════════════════════════');
        console.log('📝 VERIFICĂRI RECOMANDATE:');
        console.log('   1. Verifică dacă toate VRID-urile din facturi au fost procesate');
        console.log('   2. Controlează dacă există facturi duplicate');
        console.log('   3. Verifică formatul datelor în fișiere Excel/CSV');
        console.log('   4. Controlează numele coloanelor în facturi');
        
        // Alertă detaliată cu informații practice
        const alertMessage = `🚨 ATENȚIE - DIFERENȚĂ ÎN TOTALE!

💰 TOTALURILE NU SE POTRIVESC:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Din facturi: €${expectedTotal.toFixed(2)}
⚙️ Procesat: €${actualTotal.toFixed(2)}
⚠️ Diferență: €${Math.abs(discrepancy).toFixed(2)} ${discrepancy > 0 ? '(LIPSESC din procesare)' : '(ÎN PLUS în procesare)'}

📋 DETALII:
${Math.abs(discrepancy7Days) > 0.01 ? `• Facturi 7 zile: diferență €${Math.abs(discrepancy7Days).toFixed(2)} ${discrepancy7Days > 0 ? '(lipsesc)' : '(în plus)'}\n` : ''}${Math.abs(discrepancy30Days) > 0.01 ? `• Facturi 30 zile: diferență €${Math.abs(discrepancy30Days).toFixed(2)} ${discrepancy30Days > 0 ? '(lipsesc)' : '(în plus)'}\n` : ''}
🔍 Verifică consola pentru informații complete!

ACȚIUNI RECOMANDATE:
1️⃣ Verifică dacă toate VRID-urile sunt procesate
2️⃣ Controlează facturile duplicate
3️⃣ Verifică formatul datelor`;
        
        alert(alertMessage);
        
        // Salvare date pentru debugging avansat
        (window as any).invoiceValidationDetails = {
          timestamp: new Date().toISOString(),
          expectedTotal,
          actualTotal,
          discrepancy,
          breakdown: {
            invoice7Days: { expected: invoice7Total, actual: finalTotal7Days, diff: discrepancy7Days },
            invoice30Days: { expected: invoice30Total, actual: finalTotal30Days, diff: discrepancy30Days }
          },
          fileCount: {
            invoice7: invoice7Data.length,
            invoice30: invoice30Data.length,
            tripData: tripData.length
          },
          commission: finalTotalCommission
        };
        
      } else {
        console.log('✅ VERIFICARE TOTALE: Perfect! Totalurile se potrivesc exact.');
        console.log(`   💰 Total verificat și confirmat: €${expectedTotal.toFixed(2)}`);
        console.log(`   ✨ Nu există discrepanțe între facturi și procesare.`);
      }
      console.log('═══════════════════════════════════════════════════');

      setProcessedData(results);
      setSelectedWeek(processingWeek);
      setActiveTab('calculations');

      // Search historical data for unmatched VRIDs
      if (unmatchedVrids.length > 0) {
        console.log(`🔍 Căutare automatică în istoric pentru ${unmatchedVrids.length} VRID-uri neîmperecheate...`);
        try {
          const response = await fetch('/api/search-historical-vrids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vrids: unmatchedVrids })
          });
          
          if (response.ok) {
            const { found, total, historicalData } = await response.json();
            console.log(`📊 Istoric: ${found}/${total} VRID-uri găsite în datele istorice`);
            
            // Automatic matching - move VRIDs from Unmatched to correct companies
            if (found > 0) {
              let movedVrids = 0;
              unmatchedVrids.forEach(vrid => {
                if (historicalData[vrid]) {
                  const historicalTrip = historicalData[vrid];
                  const foundCompany = extractAndFindDriver(historicalTrip.driverName);
                  
                  if (foundCompany !== 'Unknown' && foundCompany !== 'Pending' && foundCompany !== 'Unmatched') {
                    console.log(`✅ VRID matcat automat: ${vrid} → ${foundCompany} (din ${historicalTrip.weekLabel})`);
                    
                    // Move from Unmatched to correct company
                    if (results.Unmatched && results.Unmatched.VRID_details[vrid]) {
                      const vridDetails = results.Unmatched.VRID_details[vrid];
                      
                      // Ensure target company exists
                      if (!results[foundCompany]) {
                        results[foundCompany] = {
                          Total_7_days: 0,
                          Total_30_days: 0,
                          Total_comision: 0,
                          VRID_details: {}
                        };
                      }
                      
                      // 🔄 RECALCULARE COMISION CORECT pentru compania reală!
                      const totalAmount = (vridDetails['7_days'] || 0) + (vridDetails['30_days'] || 0);
                      const correctCommissionRate = foundCompany === "Fast Express" ? 0.02 : 0.04;
                      const correctCommission = totalAmount * correctCommissionRate;
                      
                      console.log(`💰 Recalculez comision pentru ${vrid}: €${totalAmount.toFixed(2)} x ${(correctCommissionRate*100)}% = €${correctCommission.toFixed(2)} (${foundCompany})`);
                      
                      // Create new VRID details with correct commission
                      const correctedVridDetails = {
                        '7_days': vridDetails['7_days'] || 0,
                        '30_days': vridDetails['30_days'] || 0,
                        'commission': correctCommission  // 🎯 Comision recalculat corect!
                      };
                      
                      // Move VRID details with corrected commission
                      results[foundCompany].VRID_details[vrid] = correctedVridDetails;
                      results[foundCompany].Total_7_days += correctedVridDetails['7_days'];
                      results[foundCompany].Total_30_days += correctedVridDetails['30_days'];
                      results[foundCompany].Total_comision += correctedVridDetails.commission;
                      
                      // Remove from Unmatched (care avea comision 0)
                      delete results.Unmatched.VRID_details[vrid];
                      results.Unmatched.Total_7_days -= vridDetails['7_days'] || 0;
                      results.Unmatched.Total_30_days -= vridDetails['30_days'] || 0;
                      results.Unmatched.Total_comision -= vridDetails.commission || 0;  // Ar trebui să fie 0 oricum
                      
                      movedVrids++;
                    }
                  }
                }
              });
              
              if (movedVrids > 0) {
                console.log(`🎯 ${movedVrids} VRID-uri mutate automat din istoric la companiile corecte`);
                
                // Clean up empty Unmatched category
                if (results.Unmatched && Object.keys(results.Unmatched.VRID_details).length === 0) {
                  delete results.Unmatched;
                  console.log(`🧹 Categoria "Unmatched" eliminată - toate VRID-urile au fost matchate`);
                }
              }
            }
          }
        } catch (error) {
          console.log('Eroare la căutarea în istoric:', error);
        }
      }

      // ❌ SALVARE AUTOMATĂ DEZACTIVATĂ - utilizatorul decide când să salveze
      console.log(`📊 Procesare completă pentru ${processingWeek}:`);
      console.log(`   📋 ${tripData.length} cursuri procesate în memorie`);
      console.log(`   📊 ${invoice7Data.length + invoice30Data.length} facturi procesate`);
      console.log(`   🏢 ${Object.keys(results).length} companii identificate`);
      console.log(`💡 Pentru a salva datele în baza de date, folosește butonul "Salvează în DB" din tab-ul Management`);
      
      // Nu mai salvăm automat - utilizatorul controlează când se salvează

    } catch (error: any) {
      alert('Eroare la procesarea datelor: ' + error.message);
    } finally {
      // 🚨 SALVARE AUTOMATĂ ALERTE PENTRU SUME MICI ≤10 EUR ÎN BAZA DE DATE
      if (currentAlerts.length > 0) {
        console.log('🚨 RAPORT SUME MICI:', currentAlerts);
        
        // Salvează alertele în baza de date
        try {
          for (const alert of currentAlerts) {
            const alertData = {
              vrid: alert.vrid,
              companyName: alert.company,
              invoiceType: alert.invoiceType === '7 zile' ? '7-day' : '30-day',
              initialAmount: alert.amount.toString(),
              weekDetected: processingWeek,
              status: 'pending',
              notes: `Sumă mică detectată automat în timpul procesării - €${alert.amount.toFixed(2)}`
            };
            
            const response = await fetch('/api/small-amount-alerts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(alertData)
            });
            
            if (response.ok) {
              console.log(`✅ Alertă salvată pentru VRID ${alert.vrid} - €${alert.amount.toFixed(2)}`);
            }
          }
          
          // Reîncarcă alertele pentru a afișa cele noi
          await loadSmallAmountAlerts();
          
          // Afișare notificare
          const alertMessage = `⚠️ ATENȚIE! Am găsit și salvat ${currentAlerts.length} VRID-uri cu sume foarte mici (≤10 EUR). Verificați secțiunea "Alerte Sume Mici" pentru detalii.`;
          alert(alertMessage);
          
        } catch (error) {
          console.error('Eroare la salvarea alertelor:', error);
          // Fallback - salvează în state local dacă API-ul nu funcționează
          setSmallAmountAlerts(currentAlerts);
        }
      }
      
      setLoading(false);
    }
  };

  // Payment tracking with database integration
  const recordPayment = async (company: string, amount: number, description = '') => {
    const currentWeek = selectedWeek || getCurrentWeekRange().label;
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: company,
          amount: amount.toString(),
          description,
          weekLabel: currentWeek,
          paymentType: 'partial'
        }),
      });

      if (response.ok) {
        const savedPayment = await response.json();
        
        // Update local state
        const payment = {
          id: savedPayment.id,
          company,
          amount: parseFloat(amount.toString()),
          description,
          date: new Date().toISOString().split('T')[0],
          week: currentWeek
        };

        setPaymentHistory(prev => [payment, ...prev]);
        setPayments((prev: any) => ({
          ...prev,
          [company]: (prev[company] || 0) + payment.amount
        }));

        // Update weekly history locally
        if (!weeklyPaymentHistory[currentWeek]) {
          setWeeklyPaymentHistory((prev: any) => ({
            ...prev,
            [currentWeek]: []
          }));
        }
        
        // IMPORTANT: Auto-sync company balances after payment
        try {
          console.log('🔄 Auto-sincronizare bilanțuri după adăugarea plății...');
          const syncResponse = await fetch('/api/company-balances/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          if (syncResponse.ok) {
            console.log('✅ Bilanțurile au fost sincronizate automat');
          }
        } catch (syncError) {
          console.warn('⚠️ Eroare la sincronizarea automată a bilanțurilor:', syncError);
        }
      } else {
        throw new Error('Failed to save payment');
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Eroare la salvarea plății în baza de date');
    }
  };

  const deletePayment = async (paymentId: number) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const payment = paymentHistory.find(p => p.id === paymentId);
        if (payment) {
          setPaymentHistory(prev => prev.filter(p => p.id !== paymentId));
          setPayments((prev: any) => ({
            ...prev,
            [payment.company]: Math.max(0, (prev[payment.company] || 0) - payment.amount)
          }));
          
          // IMPORTANT: Auto-sync company balances after payment deletion
          try {
            console.log('🔄 Auto-sincronizare bilanțuri după ștergerea plății...');
            const syncResponse = await fetch('/api/company-balances/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            if (syncResponse.ok) {
              console.log('✅ Bilanțurile au fost sincronizate automat după ștergere');
            }
          } catch (syncError) {
            console.warn('⚠️ Eroare la sincronizarea automată a bilanțurilor după ștergere:', syncError);
          }
        }
      } else {
        throw new Error('Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Eroare la ștergerea plății din baza de date');
    }
  };

  // Load weekly payment history
  const loadWeeklyPaymentHistory = async (weekLabel: string) => {
    try {
      const response = await fetch(`/api/payments?weekLabel=${encodeURIComponent(weekLabel)}`);
      if (response.ok) {
        const payments = await response.json();
        setWeeklyPaymentHistory((prev: any) => ({
          ...prev,
          [weekLabel]: payments
        }));
        return payments;
      }
    } catch (error) {
      console.error('Error loading weekly payment history:', error);
    }
    return [];
  };

  // Load all payment history for historical view
  const loadAllPaymentHistory = async () => {
    try {
      const response = await fetch('/api/payments');
      if (response.ok) {
        const allPayments = await response.json();
        
        // Group by week
        const groupedByWeek = allPayments.reduce((acc: any, payment: any) => {
          const week = payment.weekLabel;
          if (!acc[week]) {
            acc[week] = [];
          }
          acc[week].push({
            id: payment.id,
            company: payment.companyName,
            amount: parseFloat(payment.amount),
            description: payment.description || '',
            date: payment.paymentDate.split('T')[0],
            week: payment.weekLabel
          });
          return acc;
        }, {});

        setWeeklyPaymentHistory(groupedByWeek);
        return groupedByWeek;
      }
    } catch (error) {
      console.error('Error loading all payment history:', error);
    }
    return {};
  };

  // Load payments for selected week
  const loadPaymentsForWeek = async (weekLabel: string) => {
    const payments = await loadWeeklyPaymentHistory(weekLabel);
    
    // Update current payment tracking for the selected week
    const weekPayments = payments.reduce((acc: any, payment: any) => {
      const company = payment.companyName;
      acc[company] = (acc[company] || 0) + parseFloat(payment.amount);
      return acc;
    }, {});

    setPayments(weekPayments);
    
    const formattedPayments = payments.map((payment: any) => ({
      id: payment.id,
      company: payment.companyName,
      amount: parseFloat(payment.amount),
      description: payment.description || '',
      date: payment.paymentDate.split('T')[0],
      week: payment.weekLabel
    }));

    setPaymentHistory(formattedPayments);
  };

  const getRemainingPayment = (company: string) => {
    const data = processedData[company];
    if (!data) return 0;

    const total = data.Total_7_days + data.Total_30_days - data.Total_comision;
    const paid = payments[company] || 0;
    
    return Math.max(0, total - paid);
  };

  // Save processed data to database
  const saveProcessedData = async () => {
    // Use processingWeek (which has year) instead of selectedWeek (which might not)
    const weekToSave = processingWeek || selectedWeek;
    if (!weekToSave || Object.keys(processedData).length === 0) {
      alert('Nu există date procesate de salvat');
      return;
    }

    // 🛡️ VERIFICARE PROTECȚIE - forțează anul pentru săptămânile din februarie
    let finalWeekLabel = weekToSave;
    if (weekToSave.includes('feb') && !weekToSave.includes('2025') && !weekToSave.includes('2024')) {
      // Pentru februarie fără an, forțează 2025
      finalWeekLabel = weekToSave.replace('feb.', 'feb. 2025');
      console.log(`🛡️ PROTECȚIE: Corectez săptămâna fără an: "${weekToSave}" → "${finalWeekLabel}"`);
    }

    setLoading(true);
    try {
      const response = await fetch('/api/weekly-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekLabel: finalWeekLabel,
          data: processedData,
          processedAt: new Date().toISOString(),
          // Include raw data for historical VRID tracking
          tripData: tripData,
          invoice7Data: invoice7Data,
          invoice30Data: invoice30Data
        }),
      });

      if (response.ok) {
        console.log(`💾 Date salvate manual cu istoric complet pentru ${finalWeekLabel}`);
        // Update saved data to match current processed data
        setSavedProcessedData({...processedData});
        // Update selectedWeek to use the corrected week label with year
        setSelectedWeek(finalWeekLabel);
        alert(`Datele au fost salvate cu succes în baza de date pentru "${finalWeekLabel}"!`);
      } else {
        throw new Error('Failed to save processed data');
      }
    } catch (error) {
      console.error('Error saving processed data:', error);
      alert('Eroare la salvarea datelor în baza de date');
    } finally {
      setLoading(false);
    }
  };

  // Load all weekly processing data
  const loadAllWeeklyProcessing = async () => {
    try {
      const response = await fetch('/api/weekly-processing');
      if (response.ok) {
        const data = await response.json();
        setWeeklyProcessingData(data);
        return data;
      }
    } catch (error) {
      console.error('Error loading weekly processing data:', error);
    }
    return [];
  };

  // Load weekly processing for specific week
  const loadWeeklyProcessingByWeek = async (weekLabel: string) => {
    try {
      const response = await fetch(`/api/weekly-processing?weekLabel=${encodeURIComponent(weekLabel)}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          console.log('Loaded processed data for week:', data.processedData);
          // 🚫 NU ACTUALIZA processedData - acelea sunt doar pentru procesarea temporală!
          // ✅ Actualizează DOAR savedProcessedData pentru tab-ul plăților
          setSavedProcessedData(data.processedData || {}); // Store saved data from DB
          setSelectedWeek(weekLabel);
          console.log('💾 Date salvate încărcate pentru plăți. processedData rămâne neschimbat pentru procesarea temporală.');
          setProcessingWeek(weekLabel);
          // Also load existing payments for this week
          await loadPaymentsForWeek(weekLabel);
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading weekly processing for week:', error);
    }
    setProcessedData({});
    return null;
  };

  // Assign unmatched VRID to company
  const assignUnmatchedVRID = (vrid: string, fromCompany: string, toCompany: string) => {
    if (!processedData[fromCompany]?.VRID_details?.[vrid]) {
      console.error(`VRID ${vrid} not found in ${fromCompany}`);
      return;
    }

    const vridData = processedData[fromCompany].VRID_details[vrid];
    
    // Remove from source company
    processedData[fromCompany].Total_7_days -= vridData['7_days'];
    processedData[fromCompany].Total_30_days -= vridData['30_days'];
    processedData[fromCompany].Total_comision -= vridData.commission;
    delete processedData[fromCompany].VRID_details[vrid];

    // Add to target company
    if (!processedData[toCompany]) {
      processedData[toCompany] = {
        Total_7_days: 0,
        Total_30_days: 0,
        Total_comision: 0,
        VRID_details: {}
      };
    }

    processedData[toCompany].Total_7_days += vridData['7_days'];
    processedData[toCompany].Total_30_days += vridData['30_days'];
    processedData[toCompany].Total_comision += vridData.commission;
    processedData[toCompany].VRID_details[vrid] = vridData;

    // Clean up empty Unmatched category
    if (fromCompany === 'Unmatched' && Object.keys(processedData.Unmatched.VRID_details).length === 0) {
      delete processedData.Unmatched;
    }

    // Force re-render
    setProcessedData({...processedData});
  };

  // Create company balances - REMOVED AUTO SAVE - now only manual save via Management tab

  const clearUploadedFiles = () => {
    setUploadedFiles({ trip: [], invoice7: [], invoice30: [] });
    setTripData(null);
    setInvoice7Data(null);
    setInvoice30Data(null);
    // Curăță și datele procesate pentru a preveni confuzia
    setProcessedData({});
    setPendingMappings([]);
    setSmallAmountAlerts([]);
    console.log('🧹 Toate fișierele și datele procesate au fost șterse din memoria sesiunii');
  };

  return {
    // State
    tripData,
    invoice7Data,
    invoice30Data,
    processedData,
    savedProcessedData,
    payments,
    paymentHistory,
    weeklyPaymentHistory,
    activeTab,
    loading,
    selectedWeek,
    processingWeek,
    showCalendar,
    calendarDate,
    tripFileRef,
    invoice7FileRef,
    invoice30FileRef,
    uploadedFiles,
    smallAmountAlerts,
    weeklyProcessingData,
    
    // Actions
    setActiveTab,
    setSelectedWeek,
    setProcessingWeek,
    setShowCalendar,
    setCalendarDate,
    handleFileUpload,
    clearUploadedFiles,
    processData,
    recordPayment,
    deletePayment,
    loadWeeklyPaymentHistory,
    loadAllPaymentHistory,
    loadPaymentsForWeek,
    saveProcessedData,
    loadAllWeeklyProcessing,
    loadWeeklyProcessingByWeek,
    assignUnmatchedVRID,
    loadDriversFromDatabase,
    pendingMappings,
    setPendingMappings,
    addDriverToDatabase,
    
    // Computed
    getCurrentWeekRange,
    getWeekOptions,
    getDaysInMonth,
    selectWeekFromCalendar,
    isDateInSelectedWeek,
    canSelectDate,
    getRemainingPayment,
  };
}
