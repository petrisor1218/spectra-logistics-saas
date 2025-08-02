import { useState, useRef } from 'react';
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
  "Tiberiu Iulian  Ivan": "Fast Express",
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
  "Razvan Jurubita": "Daniel Ontheroad",
  "Feleagă Marian": "Daniel Ontheroad",
  "Dimitrov F": "Daniel Ontheroad",
  "Cernat Lucian Marian": "DE Cargo Speed",
  "Draghici Marius Sorin": "DE Cargo Speed",
  "Sorin petrisor Dumitrache": "DE Cargo Speed",
  "Petre Iulian LEUCE": "DE Cargo Speed",
  "Gorgos Adrian": "Stef Trans",
  "Barbuceanu Anghel": "Stef Trans",
  "Adi-Nicolae Gocea": "Stef Trans",
  "Dumitru Ciobanu": "Stef Trans",
  "Dimache Mihalache": "Stef Trans",
  "Toma Alin Marian": "Toma SRL",
  "Balanean Daniel": "Toma SRL",
  "Alexandru Sorin Geanta": "Toma SRL"
};

export function useTransportData() {
  const [tripData, setTripData] = useState<any>(null);
  const [invoice7Data, setInvoice7Data] = useState<any>(null);
  const [invoice30Data, setInvoice30Data] = useState<any>(null);
  const [processedData, setProcessedData] = useState<any>({});
  const [payments, setPayments] = useState<any>({});
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [weeklyPaymentHistory, setWeeklyPaymentHistory] = useState<any>({});
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [processingWeek, setProcessingWeek] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Track uploaded file names for display
  const [uploadedFileNames, setUploadedFileNames] = useState<{
    trip?: string;
    invoice7?: string;
    invoice30?: string[];
  }>({});
  
  const tripFileRef = useRef<HTMLInputElement>(null);
  const invoice7FileRef = useRef<HTMLInputElement>(null);
  const invoice30FileRef = useRef<HTMLInputElement>(null);

  // Generate name variants - DO NOT MODIFY!
  const generateNameVariants = (name: string) => {
    const cleaned = name.trim().replace(/\s+/g, ' ');
    const variants = [cleaned.toLowerCase()];
    
    const parts = cleaned.split(' ');
    if (parts.length > 1) {
      const reversed = [...parts].reverse();
      variants.push(reversed.join(' ').toLowerCase());
      
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
  const [dynamicDriverMap, setDynamicDriverMap] = useState<Record<string, string>>({});
  
  const loadDriversFromDatabase = async () => {
    try {
      const [driversResponse, companiesResponse] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/companies')
      ]);
      
      if (driversResponse.ok && companiesResponse.ok) {
        const drivers = await driversResponse.json();
        const companies = await companiesResponse.json();
        
        const dbDriverMap: Record<string, string> = {};
        
        drivers.forEach((driver: any) => {
          if (driver.companyId) {
            const company = companies.find((c: any) => c.id === driver.companyId);
            if (company) {
              // Map company names to match processing logic
              let mappedCompanyName = company.name;
              if (company.name === 'Fast & Express S.R.L.' || company.name === 'FAST EXPRESS SRL') {
                mappedCompanyName = 'Fast Express';
              } else if (company.name === 'De Cargo Sped S.R.L.' || company.name === 'DE CARGO SPEED') {
                mappedCompanyName = 'DE Cargo Speed';
              } else if (company.name === 'Stef Trans S.R.L.' || company.name === 'STEF TRANS') {
                mappedCompanyName = 'Stef Trans';
              } else if (company.name === 'Toma SRL' || company.name === 'TOMA') {
                mappedCompanyName = 'Toma SRL';
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
        console.log('👥 Șoferi din baza de date:', drivers.map((d: any) => `${d.name} → ${companies.find((c: any) => c.id === d.companyId)?.name || 'FĂRĂ COMPANIE'}`));
        console.log('🔗 Mapare completă (primele 5):', Object.entries(dbDriverMap).slice(0, 5));
        return dbDriverMap;
      }
    } catch (error) {
      console.error('Error loading drivers from database:', error);
    }
    return {};
  };

  // Build complete normalized dictionary (DATABASE ONLY for multi-tenant isolation)
  const getCompleteDriverMap = () => {
    // Multi-tenant: Use ONLY database mappings, no static mapping
    return dynamicDriverMap;
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

  // State for pending driver mappings
  const [pendingMappings, setPendingMappings] = useState<Array<{
    driverName: string;
    suggestedCompany: string;
    alternatives: string[];
  }>>([]);

  // Add driver to database after user confirmation
  const addDriverToDatabase = async (driverName: string, selectedCompany: string) => {
    try {
      console.log(`🚛 Tentativa de adăugare șofer: "${driverName}" la compania: "${selectedCompany}"`);
      
      // Check if driver already exists first
      const existingDriversResponse = await fetch('/api/drivers');
      console.log('📋 Verificare șoferi existenți - status:', existingDriversResponse.status);
      
      if (existingDriversResponse.ok) {
        const existingDrivers = await existingDriversResponse.json();
        console.log(`📊 Găsiți ${existingDrivers.length} șoferi existenți în baza de date`);
        
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
        
        // Find company ID by matching selected company name - exclude main company
        const transportCompanies = companies.filter(c => !c.isMainCompany);
        console.log('🚚 Companiile de transport disponibile:', transportCompanies.map(c => `${c.name} (ID: ${c.id})`));
        
        for (const company of transportCompanies) {
          console.log(`🔍 Verificare companie: "${company.name}" vs "${selectedCompany}"`);
          
          // Normalize company names for comparison  
          const normalizedCompanyName = company.name.toLowerCase().trim();
          const normalizedSelected = selectedCompany.toLowerCase().trim();
          
          // More flexible matching for companies
          if ((normalizedCompanyName.includes('fast') && normalizedCompanyName.includes('express')) && 
              normalizedSelected.includes('fast')) {
            targetCompanyId = company.id;
            console.log(`✅ Potrivire găsită: Fast Express -> ${company.name} (ID: ${company.id})`);
            break;
          } else if ((normalizedCompanyName.includes('stef') && normalizedCompanyName.includes('trans')) && 
                     normalizedSelected.includes('stef')) {
            targetCompanyId = company.id;
            console.log(`✅ Potrivire găsită: Stef Trans -> ${company.name} (ID: ${company.id})`);
            break;
          } else if (normalizedCompanyName.includes('cargo') && 
                     (normalizedSelected.includes('cargo') || normalizedSelected.includes('de cargo') || normalizedSelected.includes('speed'))) {
            targetCompanyId = company.id;
            console.log(`✅ Potrivire găsită: DE Cargo Speed -> ${company.name} (ID: ${company.id})`);
            break;
          } else if (normalizedCompanyName.includes('toma') && normalizedSelected.includes('toma')) {
            targetCompanyId = company.id;
            console.log(`✅ Potrivire găsită: Toma -> ${company.name} (ID: ${company.id})`);
            break;
          } else if (normalizedCompanyName.includes('daniel') && normalizedSelected.includes('daniel')) {
            targetCompanyId = company.id;
            console.log(`✅ Potrivire găsită: Daniel Ontheroad -> ${company.name} (ID: ${company.id})`);
            break;
          }
        }
        
        if (targetCompanyId) {
          console.log(`🎯 Compania găsită! ID: ${targetCompanyId} pentru "${selectedCompany}"`);
          console.log('📤 Trimit cererea POST către /api/drivers cu:', {
            name: driverName,
            companyId: targetCompanyId
          });
          
          const response = await fetch('/api/drivers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: driverName,
              companyId: targetCompanyId
            })
          });
          
          console.log('📥 Răspuns POST /api/drivers - status:', response.status);
          
          if (response.ok) {
            const newDriver = await response.json();
            console.log(`✅ Adăugat șofer nou: "${driverName}" → "${selectedCompany}"`, newDriver);
            await loadDriversFromDatabase();
            return selectedCompany;
          } else {
            const errorText = await response.text();
            console.error('❌ Eroare la adăugarea șoferului:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
          }
        } else {
          console.error('❌ Nu am găsit compania în baza de date:', selectedCompany);
          console.log('📋 Companiile disponibile:', companies.map(c => `${c.name} (ID: ${c.id})`));
        console.log(`🔍 Căutare companie pentru: "${selectedCompany}"`);
        console.log('🔍 Normalizat:', selectedCompany.toLowerCase().trim());
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
    
    // Add to pending mappings if not already there
    const isAlreadyPending = pendingMappings.some(p => p.driverName === driverName);
    if (!isAlreadyPending) {
      const allCompanies = ['Fast Express', 'Stef Trans', 'DE Cargo Speed', 'Toma SRL']; // Fast Express restored
      const alternatives = allCompanies.filter(c => c !== finalSuggestion);
      
      setPendingMappings(prev => [...prev, {
        driverName,
        suggestedCompany: finalSuggestion,
        alternatives
      }]);
    }
    
    return "Pending"; // Mark as pending for user decision
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
    
    return {
      start: startOfWeek,
      end: endOfWeek,
      label: `${startOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}`
    };
  };

  const getWeekRangeForDate = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = date.getDay();
    const diff = date.getDate() - day;
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return {
      start: startOfWeek,
      end: endOfWeek,
      label: `${startOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}`
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
      
      const label = `${weekStart.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}`;
      
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

  // Extended Excel processing with multi-sheet support
  const parseExcel = (arrayBuffer: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      console.log('📊 Excel fișier detectat cu taburile:', workbook.SheetNames);
      
      // Check if this is a Payment Details format
      if (workbook.SheetNames.includes('Payment Details')) {
        console.log('🔍 Detectat format Payment Details - folosesc tabul specific');
        const worksheet = workbook.Sheets['Payment Details'];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) return [];
        
        // For Payment Details format: VRID on column E (index 4), Amount on column AF (index 31)
        const processedData: any[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          const vrid = row[4]; // Column E (0-indexed = 4)
          const amount = row[31]; // Column AF (0-indexed = 31)
          
          if (vrid && amount && !isNaN(parseFloat(amount))) {
            processedData.push({
              'Tour ID': vrid,
              'Load ID': vrid, // Backup field
              'Gross Pay Amt (Excl. Tax)': parseFloat(amount)
            });
          }
        }
        
        console.log(`✅ Procesat Payment Details: ${processedData.length} înregistrări găsite`);
        console.log('📋 Primele 3 înregistrări:', processedData.slice(0, 3));
        return processedData;
      }
      
      // Standard format processing (existing logic)
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) return [];
      
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1);
      
      const result = rows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = (row as any[])[index] || '';
        });
        return obj;
      }).filter(row => Object.values(row).some(val => val !== '' && val !== null && val !== undefined));
      
      console.log(`✅ Procesat format standard: ${result.length} înregistrări găsite`);
      return result;
      
    } catch (error) {
      console.error('Eroare la parsarea Excel:', error);
      throw new Error('Nu s-a putut citi fișierul Excel');
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
        data = parseExcel(arrayBuffer);
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
        setUploadedFileNames(prev => ({ ...prev, trip: file.name }));
      } else if (type === 'invoice7') {
        setInvoice7Data(data);
        setUploadedFileNames(prev => ({ ...prev, invoice7: file.name }));
      } else if (type === 'invoice30') {
        // Support multiple invoice30 files - combine with existing data
        setInvoice30Data((prev: any) => {
          if (prev && prev.length > 0) {
            console.log(`🔄 Combinând cu datele existente: ${prev.length} + ${data.length} înregistrări`);
            return [...prev, ...data];
          }
          return data;
        });
        setUploadedFileNames(prev => ({ 
          ...prev, 
          invoice30: prev.invoice30 ? [...prev.invoice30, file.name] : [file.name]
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
    // Allow processing with trip + at least one invoice type
    if (!tripData || (!invoice7Data && !invoice30Data)) {
      alert('Vă rugăm să încărcați fișierul TRIP și cel puțin o factură (7 zile sau 30 zile).');
      return;
    }

    if (!processingWeek) {
      alert('Vă rugăm să selectați săptămâna pentru care procesați datele.');
      return;
    }

    setLoading(true);
    
    // Load fresh driver data before processing
    await loadDriversFromDatabase();
    
    const results: any = {};
    const unmatchedVrids: string[] = []; // Track unmatched VRIDs for historical search

    try {
      const processInvoice = (invoiceData: any[], invoiceType: string) => {
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
          if (isNaN(amount) || amount === 0) return;

          const tripRecord = tripData.find((trip: any) => 
            trip['Trip ID'] === vrid || trip['VR ID'] === vrid
          );

          let company = 'Unmatched';
          if (tripRecord && tripRecord['Driver']) {
            const foundCompany = extractAndFindDriver(tripRecord['Driver']);
            if (foundCompany !== 'Unknown' && foundCompany !== 'Pending') {
              company = foundCompany;
            } else if (foundCompany === 'Pending') {
              console.log(`VRID ${vrid} - Șofer în așteptare: "${tripRecord['Driver']}" - verificați mapările pendente`);
              company = 'Pending Mapping'; // Special category for pending drivers
            } else {
              console.log(`VRID ${vrid} - Șofer negăsit: "${tripRecord['Driver']}"`);
            }
          } else {
            console.log(`VRID ${vrid} - Nu s-a găsit în trip data sau nu are driver`);
            unmatchedVrids.push(vrid); // Track for historical search
          }

          if (!results[company]) {
            results[company] = {
              Total_7_days: 0,
              Total_30_days: 0,
              Total_comision: 0,
              VRID_details: {}
            };
          }

          const commissionRate = company === "Fast Express" ? 0.02 : 0.04;
          const commission = amount * commissionRate;

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
      };

      // Process available invoice types
      if (invoice7Data) {
        processInvoice(invoice7Data, '7_days');
      }
      if (invoice30Data) {
        processInvoice(invoice30Data, '30_days');
      }

      setProcessedData(results);
      setSelectedWeek(processingWeek);
      setActiveTab('calculations');

      // Search historical data for unmatched VRIDs
      if (unmatchedVrids.length > 0) {
        console.log(`🔍 Caut în istoric pentru ${unmatchedVrids.length} VRID-uri neîmperecheate...`);
        try {
          const response = await fetch('/api/historical-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vrids: unmatchedVrids })
          });
          
          if (response.ok) {
            const historicalData = await response.json();
            if (historicalData.foundCount > 0) {
              console.log(`📚 Găsite în istoric: ${historicalData.foundCount} VRID-uri`);
              console.log('Sugestii istorice:', historicalData.foundTrips);
              // TODO: Display historical suggestions to user
            }
          }
        } catch (error) {
          console.log('Eroare la căutarea în istoric:', error);
        }
      }

      // Save weekly data with historical tracking
      try {
        await fetch('/api/weekly-processing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weekLabel: processingWeek,
            processedData: results,
            tripData: tripData, // Save raw TRIP data
            invoice7Data: invoice7Data || [], // Save raw invoice data (empty if not provided)
            invoice30Data: invoice30Data || [], // Save raw invoice data (empty if not provided)
            tripDataCount: tripData.length,
            invoice7Count: invoice7Data?.length || 0,
            invoice30Count: invoice30Data?.length || 0
          })
        });
        console.log(`💾 Date salvate pentru săptămâna ${processingWeek} cu ${tripData.length} cursuri în istoric`);
        
        // Create company balances
        await createCompanyBalances(processingWeek, results);
      } catch (error) {
        console.log('Eroare la salvarea datelor:', error);
      }

    } catch (error: any) {
      alert('Eroare la procesarea datelor: ' + error.message);
    } finally {
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
    if (!selectedWeek || Object.keys(processedData).length === 0) {
      alert('Nu există date procesate de salvat');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/weekly-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekLabel: selectedWeek,
          data: processedData,
          processedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        alert('Datele au fost salvate cu succes în baza de date!');
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
        return await response.json();
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
          setProcessedData(data.processedData || {});
          setSelectedWeek(weekLabel);
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

  // Create company balances when processing data
  const createCompanyBalances = async (weekLabel: string, processedData: any) => {
    try {
      if (!processedData || typeof processedData !== 'object') {
        console.log('Nu există date procesate pentru crearea bilanțurilor');
        return;
      }

      // Extract company totals from processed data
      const companyTotals: Record<string, { totalInvoiced: number, drivers: string[] }> = {};

      // Go through each company in processed data
      Object.keys(processedData).forEach(companyName => {
        if (companyName === 'Unmatched' || companyName === 'Totals') return;
        
        const companyData = processedData[companyName];
        if (companyData && companyData.Totals) {
          const totalInvoiced = parseFloat(companyData.Totals.Total_without_commission) || 0;
          const drivers = Object.keys(companyData).filter(key => key !== 'Totals');
          
          companyTotals[companyName] = {
            totalInvoiced,
            drivers
          };
        }
      });

      // Create balance entries for each company
      for (const [companyName, data] of Object.entries(companyTotals)) {
        if (data.totalInvoiced > 0) {
          try {
            await fetch('/api/company-balances', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                companyName,
                weekLabel,
                totalInvoiced: data.totalInvoiced.toString(),
                totalPaid: '0',
                outstandingBalance: data.totalInvoiced.toString(),
                paymentStatus: 'pending'
              }),
            });
            
            console.log(`💰 Bilanț creat pentru ${companyName}: ${data.totalInvoiced} EUR`);
          } catch (error) {
            console.error(`Eroare la crearea bilanțului pentru ${companyName}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Eroare la crearea bilanțurilor:', error);
    }
  };



  return {
    // State
    tripData,
    invoice7Data,
    invoice30Data,
    processedData,
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
    uploadedFileNames,
    
    // Actions
    setActiveTab,
    setSelectedWeek,
    setProcessingWeek,
    setShowCalendar,
    setCalendarDate,
    handleFileUpload,
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
