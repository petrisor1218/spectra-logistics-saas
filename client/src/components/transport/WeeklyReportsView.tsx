import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

  // Încărcăm toate datele procesate din baza de date
  const { data: weeklyProcessingData, isLoading: loadingWeekly, refetch: refetchWeekly } = useQuery({
    queryKey: ['/api/weekly-processing'],
    enabled: true
  });

  // Încărcăm datele pentru săptămâna selectată
  const { data: weekData, isLoading: loadingWeekData, refetch: refetchWeekData } = useQuery({
    queryKey: ['/api/weekly-processing', selectedReportWeek],
    enabled: !!selectedReportWeek
  });

  const weekOptions = useMemo(() => {
    if (!weeklyProcessingData || !Array.isArray(weeklyProcessingData)) return [];
    return weeklyProcessingData.map((week: any) => ({
      value: week.weekLabel,
      label: week.weekLabel
    }));
  }, [weeklyProcessingData]);

  const processedData = useMemo(() => {
    if (!weekData || !weekData.processedData) return {};
    try {
      return typeof weekData.processedData === 'string' 
        ? JSON.parse(weekData.processedData) 
        : weekData.processedData;
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
    
    // Header cu design modern
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Raport Curse Săptămânale - ${selectedCompany}`, 148.5, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Săptămâna: ${selectedReportWeek}`, 148.5, 22, { align: 'center' });

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

    (doc as any).autoTable({
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

    const fileName = `${selectedCompany}_Curse_Saptamanale_${selectedReportWeek.replace(/\//g, '-')}.pdf`;
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
    
    const fileName = `${selectedCompany}_Curse_Saptamanale_${selectedReportWeek.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (!processedData || Object.keys(processedData).length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 text-gray-500 dark:text-gray-400"
      >
        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Nu există date procesate pentru rapoarte săptămânale</p>
        <p className="text-sm mt-2">Încărcați și procesați datele pentru a genera rapoarte</p>
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