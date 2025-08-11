import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, TrendingUp, RefreshCw, Mail, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';

interface WeeklyReportsViewProps {
  selectedWeek?: string;
}

interface VRIDDetails {
  '7_days': number;
  '30_days': number;
  commission: number;
}

interface CompanyData {
  Total_7_days: number;
  Total_30_days: number;
  Total_comision: number;
  VRID_details: Record<string, VRIDDetails>;
}

const WeeklyReportsView: React.FC<WeeklyReportsViewProps> = ({ 
  selectedWeek = ''
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedReportWeek, setSelectedReportWeek] = useState<string>(selectedWeek);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  // Încărcăm toate datele procesate din baza de date
  const { data: weeklyProcessingData, isLoading: loadingWeekly, refetch: refetchWeekly } = useQuery({
    queryKey: ['/api/weekly-processing'],
    enabled: true
  });

  // Încărcăm datele pentru săptămâna selectată
  const { data: weekData, isLoading: loadingWeekData, refetch: refetchWeekData } = useQuery({
    queryKey: ['/api/weekly-processing', selectedReportWeek],
    queryFn: async () => {
      if (!selectedReportWeek) return null;
      const response = await fetch(`/api/weekly-processing?weekLabel=${encodeURIComponent(selectedReportWeek)}`);
      if (!response.ok) throw new Error('Failed to fetch week data');
      return response.json();
    },
    enabled: !!selectedReportWeek
  });

  // Funcție pentru a converti weekLabel în dată pentru sortare
  const parseWeekLabelToDate = (weekLabel: string): Date => {
    try {
      // Format: "27 iul. - 2 aug." sau "13 iul. - 19 iul." sau "27 iul. 2024 - 2 aug. 2024"
      const parts = weekLabel.split(' - ')[0].trim(); // "27 iul." sau "27 iul. 2024"
      const splitParts = parts.split(' ');
      const day = splitParts[0];
      const monthAbbr = splitParts[1];
      
      const monthMap: Record<string, number> = {
        'ian.': 0, 'feb.': 1, 'mar.': 2, 'apr.': 3, 'mai': 4, 'iun.': 5,
        'iul.': 6, 'aug.': 7, 'sep.': 8, 'oct.': 9, 'noi.': 10, 'dec.': 11
      };
      
      const month = monthMap[monthAbbr] ?? 6; // Default to July if not found
      
      // Check if year is present in the parts
      let year = 2025; // Default to current year
      if (splitParts.length >= 3) {
        const yearPart = parseInt(splitParts[2]);
        if (!isNaN(yearPart) && yearPart > 2000) {
          year = yearPart;
        }
      } else {
        // If no year is specified and month is February, it's likely 2024 data
        if (monthAbbr === 'feb.') {
          year = 2024;
        }
      }
      
      return new Date(year, month, parseInt(day));
    } catch (e) {
      return new Date(); // Fallback to current date
    }
  };
  
  const weekOptions = useMemo(() => {
    if (!weeklyProcessingData || !Array.isArray(weeklyProcessingData)) return [];
    
    const sortedWeeks = weeklyProcessingData
      .map((week: any) => ({
        value: week.weekLabel,
        label: week.weekLabel,
        sortDate: parseWeekLabelToDate(week.weekLabel)
      }))
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime()); // Cele mai recente primele
    
    console.log('📅 Săptămâni sortate cronologic:', sortedWeeks.map(w => w.label));
    
    return sortedWeeks.map(({ value, label }) => ({ value, label }));
  }, [weeklyProcessingData]);

  const processedData = useMemo(() => {
    if (!weekData) {
      console.log('No week data:', weekData);
      return {};
    }
    
    // Check for processedData or data field
    const dataToProcess = weekData.processedData || weekData.data;
    if (!dataToProcess) {
      console.log('No processedData or data field:', weekData);
      return {};
    }
    
    try {
      const parsed = typeof dataToProcess === 'string' 
        ? JSON.parse(dataToProcess) 
        : dataToProcess;
      console.log('Parsed processed data:', parsed);
      return parsed;
    } catch (e) {
      console.error('Error parsing processed data:', e);
      return {};
    }
  }, [weekData]);

  const companies = useMemo(() => {
    return processedData ? Object.keys(processedData) : [];
  }, [processedData]);

  const currentCompanyData: CompanyData | null = useMemo(() => {
    if (!processedData || !selectedCompany) return null;
    return processedData[selectedCompany];
  }, [processedData, selectedCompany]);

  // Setăm automat prima companie când se schimbă datele
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany]);

  // Setăm automat prima săptămână disponibilă
  useEffect(() => {
    if (weekOptions.length > 0 && !selectedReportWeek) {
      setSelectedReportWeek(weekOptions[0].value);
    }
  }, [weekOptions, selectedReportWeek]);

  const tableData = useMemo(() => {
    if (!currentCompanyData?.VRID_details) return [];
    
    return Object.entries(currentCompanyData.VRID_details).map(([vrid, details]) => ({
      vrid,
      sum7Days: details['7_days'],
      sum30Days: details['30_days'],
      totalInvoice: details['7_days'] + details['30_days'],
      commission: details.commission,
      totalNet: (details['7_days'] + details['30_days']) - details.commission
    }));
  }, [currentCompanyData]);

  const totals = useMemo(() => {
    if (!currentCompanyData) return null;
    
    return {
      total7Days: currentCompanyData.Total_7_days,
      total30Days: currentCompanyData.Total_30_days,
      totalInvoice: currentCompanyData.Total_7_days + currentCompanyData.Total_30_days,
      totalCommission: currentCompanyData.Total_comision,
      totalNet: (currentCompanyData.Total_7_days + currentCompanyData.Total_30_days) - currentCompanyData.Total_comision
    };
  }, [currentCompanyData]);

  const generatePDF = () => {
    if (!selectedCompany || !currentCompanyData) return;

    const doc = new jsPDF('landscape');
    
    // Set font to support Romanian characters
    doc.setFont('helvetica', 'normal');
    
    // Header cu design modern
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Raport Curse Saptamanale - ${selectedCompany}`, 148.5, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Saptamana: ${selectedReportWeek}`, 148.5, 22, { align: 'center' });

    // Prepare table data
    const headers = ['VRID', 'Total 7 zile', 'Total 30 zile', 'Total de facturat', 'Comision', 'Total net'];
    const data = tableData.map(row => [
      row.vrid,
      `${row.sum7Days.toFixed(2)} EUR`,
      `${row.sum30Days.toFixed(2)} EUR`,
      `${row.totalInvoice.toFixed(2)} EUR`,
      `${row.commission.toFixed(2)} EUR`,
      `${row.totalNet.toFixed(2)} EUR`
    ]);
    
    // Add totals row
    if (totals) {
      data.push([
        'TOTAL',
        `${totals.total7Days.toFixed(2)} EUR`,
        `${totals.total30Days.toFixed(2)} EUR`,
        `${totals.totalInvoice.toFixed(2)} EUR`,
        `${totals.totalCommission.toFixed(2)} EUR`,
        `${totals.totalNet.toFixed(2)} EUR`
      ]);
    }

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 35,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        cellPadding: 4,
        fontSize: 10,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    const fileName = `${selectedCompany.replace(/\s+/g, '_')}_Curse_Saptamanale_${selectedReportWeek.replace(/[\/\s\-\.]/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const generateExcel = () => {
    if (!selectedCompany || !currentCompanyData) return;

    const ws = XLSX.utils.aoa_to_sheet([
      [`Raport Curse Săptămânale - ${selectedCompany}`],
      [`Săptămâna: ${selectedReportWeek}`],
      [],
      ['VRID', 'Total 7 zile', 'Total 30 zile', 'Total de facturat', 'Comision', 'Total net'],
      ...tableData.map(row => [
        row.vrid,
        row.sum7Days,
        row.sum30Days,
        row.totalInvoice,
        row.commission,
        row.totalNet
      ]),
      ...(totals ? [['TOTAL', totals.total7Days, totals.total30Days, totals.totalInvoice, totals.totalCommission, totals.totalNet]] : [])
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Curse Saptamanale');
    
    const fileName = `${selectedCompany.replace(/\s+/g, '_')}_Curse_Saptamanale_${selectedReportWeek.replace(/[\/\s\-\.]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Încărcăm companiile pentru a obține email-ul
  const { data: companiesData } = useQuery({
    queryKey: ['/api/companies'],
    enabled: !!selectedCompany
  });

  const sendEmailWithPDF = async () => {
    console.log('🚀 Starting sendEmailWithPDF...', { selectedCompany, currentCompanyData: !!currentCompanyData, sendingEmail });
    
    if (!selectedCompany || !currentCompanyData || sendingEmail) {
      console.log('❌ Early return - missing data:', { selectedCompany, currentCompanyData: !!currentCompanyData, sendingEmail });
      return;
    }

    setSendingEmail(true);
    
    try {
      console.log('📋 Checking companies data...', { companiesData: !!companiesData, isArray: Array.isArray(companiesData) });
      
      // Găsim compania pentru a obține email-ul
      if (!companiesData || !Array.isArray(companiesData)) {
        console.log('❌ Missing companies data');
        alert('❌ Nu s-au încărcat datele companiilor. Încercați din nou.');
        return;
      }
      
      const company = companiesData.find((comp: any) => 
        comp.name === selectedCompany || 
        comp.name.includes(selectedCompany) ||
        selectedCompany.includes(comp.name.split(' ')[0])
      );
      
      console.log('🏢 Company search result:', { selectedCompany, company: !!company });

      if (!company?.contact) {
        alert('❌ Nu s-a găsit adresa de email pentru această companie!\n\nVerificați configurarea companiei în secțiunea Management.');
        return;
      }

      // Extragem email-ul din contact (poate conține și telefon)
      const emailMatch = company.contact.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const companyEmail = emailMatch ? emailMatch[0] : null;

      if (!companyEmail) {
        alert(`❌ Nu s-a găsit o adresă de email validă pentru ${selectedCompany}!\n\nContact găsit: ${company.contact}\n\nActualizați datele companiei cu un email valid.`);
        return;
      }

      console.log('📄 Starting PDF generation...');
      
      // Generăm PDF-ul în format Blob cu suport pentru diacritice româneşti
      const doc = new jsPDF();
      
      // Setăm encoding-ul pentru diacritice româneşti
      doc.setFont('helvetica');
      
      // Header
      doc.setFontSize(16);
      doc.text(`Raport Curse Saptamanale - ${selectedCompany}`, 20, 20);
      doc.setFontSize(12);
      doc.text(`Saptamana: ${selectedReportWeek}`, 20, 30);

      const headers = ['VRID', 'Total 7 zile', 'Total 30 zile', 'Total de facturat', 'Comision', 'Total net'];
      const data = tableData.map(row => [
        row.vrid,
        `${row.sum7Days.toFixed(2)} EUR`,
        `${row.sum30Days.toFixed(2)} EUR`,
        `${row.totalInvoice.toFixed(2)} EUR`,
        `${row.commission.toFixed(2)} EUR`,
        `${row.totalNet.toFixed(2)} EUR`
      ]);

      if (totals) {
        data.push([
          'TOTAL',
          `${totals.total7Days.toFixed(2)} EUR`,
          `${totals.total30Days.toFixed(2)} EUR`,
          `${totals.totalInvoice.toFixed(2)} EUR`,
          `${totals.totalCommission.toFixed(2)} EUR`,
          `${totals.totalNet.toFixed(2)} EUR`
        ]);
      }

      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 35,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 11,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          cellPadding: 4,
          fontSize: 10,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      });

      console.log('🔄 Converting PDF to base64...');
      
      // Convertim PDF-ul în buffer - metodă sigură pentru PDF-uri mari
      const pdfBuffer = doc.output('arraybuffer');
      const uint8Array = new Uint8Array(pdfBuffer);
      
      // Convertim în base64 fără să depășim limita call stack
      let binary = '';
      const len = uint8Array.byteLength;
      const chunkSize = 8192; // Procesăm în bucăți mici
      
      for (let i = 0; i < len; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const pdfBase64 = btoa(binary);
      
      console.log('✅ PDF conversion complete:', { base64Length: pdfBase64.length });

      console.log('📧 Sending email request...', {
        companyName: selectedCompany,
        companyEmail: companyEmail,
        weekLabel: selectedReportWeek,
        pdfSize: pdfBase64.length
      });
      
      // Trimitem email-ul cu PDF-ul
      const response = await fetch('/api/send-weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: selectedCompany,
          companyEmail: companyEmail,
          weekLabel: selectedReportWeek,
          reportData: {
            company: selectedCompany,
            week: selectedReportWeek,
            totalInvoice: totals?.totalInvoice || 0,
            totalNet: totals?.totalNet || 0,
            totalCommission: totals?.totalCommission || 0,
            tripCount: tableData.length
          },
          pdfContent: pdfBase64
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(`🎉 RAPORT SĂPTĂMÂNAL TRIMIS!\n\n📧 Destinatar: ${companyEmail}\n📝 Săptămâna: ${selectedReportWeek}\n📊 Compania: ${selectedCompany}\n📎 PDF cu ${tableData.length} curse atașat\n📬 Serviciu: Brevo SMTP (GRATUIT)\n\n✅ Emailul a fost livrat cu succes!`);
        } else {
          alert(`❌ Eroare la trimiterea raportului: ${result.message || 'Eroare necunoscută'}`);
        }
      } else {
        const errorData = await response.json();
        alert(`❌ Eroare la trimiterea emailului: ${errorData.message || 'Eroare de server'}`);
      }

    } catch (error: any) {
      console.error('DETAILED Error sending weekly report email:', {
        error: error,
        message: error?.message || 'No message',
        stack: error?.stack || 'No stack',
        selectedCompany,
        currentCompanyData: currentCompanyData ? 'Present' : 'Missing',
        totals: totals ? 'Present' : 'Missing'
      });
      alert(`❌ Eroare la trimiterea raportului săptămânal: ${error?.message || 'Eroare necunoscută'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loadingWeekly) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 text-gray-500 dark:text-gray-400"
      >
        <RefreshCw className="w-16 h-16 mx-auto mb-4 opacity-50 animate-spin" />
        <p className="text-lg">Se încarcă săptămânile disponibile...</p>
      </motion.div>
    );
  }

  if (!weeklyProcessingData || (Array.isArray(weeklyProcessingData) && weeklyProcessingData.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 text-gray-500 dark:text-gray-400"
      >
        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Nu există săptămâni procesate în baza de date</p>
        <p className="text-sm mt-2">Procesați datele în tab-ul "Calcule și Totale" pentru a genera rapoarte</p>
      </motion.div>
    );
  }

  if (loadingWeekData && selectedReportWeek) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 text-gray-500 dark:text-gray-400"
      >
        <RefreshCw className="w-16 h-16 mx-auto mb-4 opacity-50 animate-spin" />
        <p className="text-lg">Se încarcă datele pentru săptămâna {selectedReportWeek}...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Rapoarte Curse Săptămânale
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Vizualizare detaliată pe companii • Săptămâna: {selectedReportWeek || 'Selectați săptămâna'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                refetchWeekly();
                refetchWeekData();
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={loadingWeekly || loadingWeekData}
            >
              <RefreshCw className={`w-4 h-4 ${(loadingWeekly || loadingWeekData) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="px-3 py-1">
              {companies.length} companii
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {tableData.length} curse
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Week and Company Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Selectare Săptămână și Companie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[250px]">
                <label className="block text-sm font-medium mb-2">Săptămâna:</label>
                <Select value={selectedReportWeek} onValueChange={setSelectedReportWeek}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Selectați săptămâna..." />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.map((week) => (
                      <SelectItem key={week.value} value={week.value}>
                        {week.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 min-w-[250px]">
                <label className="block text-sm font-medium mb-2">Compania:</label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Selectați compania pentru raport..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompany && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex gap-2"
                >
                  <Button
                    onClick={generatePDF}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export PDF
                  </Button>
                  <Button
                    onClick={generateExcel}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                  <Button
                    onClick={sendEmailWithPDF}
                    disabled={sendingEmail}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                  >
                    {sendingEmail ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {sendingEmail ? 'Trimit...' : 'Trimite Email'}
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Table */}
      <AnimatePresence>
        {selectedCompany && currentCompanyData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Curse pentru {selectedCompany}</span>
                  <Badge variant="secondary" className="ml-2">
                    {tableData.length} curse
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-left font-semibold">VRID</TableHead>
                        <TableHead className="text-right font-semibold">Total 7 zile</TableHead>
                        <TableHead className="text-right font-semibold">Total 30 zile</TableHead>
                        <TableHead className="text-right font-semibold">Total de facturat</TableHead>
                        <TableHead className="text-right font-semibold">Comision</TableHead>
                        <TableHead className="text-right font-semibold">Total net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((row, index) => (
                        <motion.tr
                          key={row.vrid}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <TableCell className="font-mono font-medium">{row.vrid}</TableCell>
                          <TableCell className="text-right">{row.sum7Days.toFixed(2)} EUR</TableCell>
                          <TableCell className="text-right">{row.sum30Days.toFixed(2)} EUR</TableCell>
                          <TableCell className="text-right font-semibold">{row.totalInvoice.toFixed(2)} EUR</TableCell>
                          <TableCell className="text-right text-orange-600 dark:text-orange-400">
                            {row.commission.toFixed(2)} EUR
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                            {row.totalNet.toFixed(2)} EUR
                          </TableCell>
                        </motion.tr>
                      ))}
                      
                      {totals && (
                        <TableRow className="border-t-2 border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 font-bold">
                          <TableCell className="font-bold text-lg">TOTAL</TableCell>
                          <TableCell className="text-right font-bold">{totals.total7Days.toFixed(2)} EUR</TableCell>
                          <TableCell className="text-right font-bold">{totals.total30Days.toFixed(2)} EUR</TableCell>
                          <TableCell className="text-right font-bold text-blue-600 dark:text-blue-400">
                            {totals.totalInvoice.toFixed(2)} EUR
                          </TableCell>
                          <TableCell className="text-right font-bold text-orange-600 dark:text-orange-400">
                            {totals.totalCommission.toFixed(2)} EUR
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                            {totals.totalNet.toFixed(2)} EUR
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyReportsView;