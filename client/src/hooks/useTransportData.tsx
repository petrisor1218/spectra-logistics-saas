import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// Driver company mapping - DO NOT MODIFY THIS LOGIC!
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
  "Toma Alin Marian": "Bis General",
  "Balanean Daniel": "Bis General"
};

export function useTransportData() {
  const [tripData, setTripData] = useState<any>(null);
  const [invoice7Data, setInvoice7Data] = useState<any>(null);
  const [invoice30Data, setInvoice30Data] = useState<any>(null);
  const [processedData, setProcessedData] = useState<any>({});
  const [payments, setPayments] = useState<any>({});
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [processingWeek, setProcessingWeek] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
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

  // Build normalized dictionary - DO NOT MODIFY!
  const DRIVER_COMPANY_MAP: Record<string, string> = {};
  Object.entries(DRIVER_COMPANY_MAP_ORIGINAL).forEach(([driver, company]) => {
    const variants = generateNameVariants(driver);
    variants.forEach(variant => {
      DRIVER_COMPANY_MAP[variant] = company;
    });
  });

  const extractAndFindDriver = (driverName: string) => {
    if (!driverName || typeof driverName !== 'string') {
      console.log('Driver name invalid:', driverName);
      return "Unknown";
    }
    
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
    
    console.log(`Șofer NEGĂSIT: "${driverName}"`);
    return "Unknown";
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

  // File processing - DO NOT MODIFY!
  const parseExcel = (arrayBuffer: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
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
      } else if (type === 'invoice7') {
        setInvoice7Data(data);
      } else if (type === 'invoice30') {
        setInvoice30Data(data);
      }
      
    } catch (error: any) {
      console.error('Eroare la încărcarea fișierului:', error);
      alert('Eroare la încărcarea fișierului: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Data processing - DO NOT MODIFY!
  const processData = () => {
    if (!tripData || !invoice7Data || !invoice30Data) {
      alert('Vă rugăm să încărcați toate fișierele necesare.');
      return;
    }

    if (!processingWeek) {
      alert('Vă rugăm să selectați săptămâna pentru care procesați datele.');
      return;
    }

    setLoading(true);
    const results: any = {};

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
            if (foundCompany !== 'Unknown') {
              company = foundCompany;
            } else {
              console.log(`VRID ${vrid} - Șofer negăsit: "${tripRecord['Driver']}"`);
            }
          } else {
            console.log(`VRID ${vrid} - Nu s-a găsit în trip data sau nu are driver`);
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

      processInvoice(invoice7Data, '7_days');
      processInvoice(invoice30Data, '30_days');

      setProcessedData(results);
      setSelectedWeek(processingWeek);
      setActiveTab('calculations');

    } catch (error: any) {
      alert('Eroare la procesarea datelor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Payment tracking - DO NOT MODIFY!
  const recordPayment = (company: string, amount: number, description = '') => {
    const currentWeek = selectedWeek || getCurrentWeekRange().label;
    
    const payment = {
      id: Date.now(),
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
  };

  const deletePayment = (paymentId: number) => {
    const payment = paymentHistory.find(p => p.id === paymentId);
    if (!payment) return;

    setPaymentHistory(prev => prev.filter(p => p.id !== paymentId));
    setPayments((prev: any) => ({
      ...prev,
      [payment.company]: Math.max(0, (prev[payment.company] || 0) - payment.amount)
    }));
  };

  const getRemainingPayment = (company: string) => {
    const data = processedData[company];
    if (!data) return 0;

    const total = data.Total_7_days + data.Total_30_days - data.Total_comision;
    const paid = payments[company] || 0;
    
    return Math.max(0, total - paid);
  };

  return {
    // State
    tripData,
    invoice7Data,
    invoice30Data,
    processedData,
    payments,
    paymentHistory,
    activeTab,
    loading,
    selectedWeek,
    processingWeek,
    showCalendar,
    calendarDate,
    tripFileRef,
    invoice7FileRef,
    invoice30FileRef,
    
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
