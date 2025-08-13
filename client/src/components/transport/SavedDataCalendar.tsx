import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Calendar, Database, Eye, TrendingUp, FileText, Loader2, AlertCircle, SortDesc, SortAsc, RefreshCw, Download } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from "@/hooks/use-toast";

interface SavedDataCalendarProps {
  loadAllWeeklyProcessing: () => Promise<any[]>;
  loadWeeklyProcessingByWeek: (weekLabel: string) => Promise<any>;
  setProcessingWeek: (week: string) => void;
  setActiveTab: (tab: string) => void;
}

export function SavedDataCalendar({
  loadAllWeeklyProcessing,
  loadWeeklyProcessingByWeek,
  setProcessingWeek,
  setActiveTab
}: SavedDataCalendarProps) {
  const [savedWeeks, setSavedWeeks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekData, setSelectedWeekData] = useState<any>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper function to fix Romanian diacritics for PDF generation
  const fixRomanianText = (text: string): string => {
    return text
      .replace(/ă/g, 'a')
      .replace(/â/g, 'a') 
      .replace(/î/g, 'i')
      .replace(/ș/g, 's')
      .replace(/ț/g, 't')
      .replace(/Ă/g, 'A')
      .replace(/Â/g, 'A')
      .replace(/Î/g, 'I')
      .replace(/Ș/g, 'S')
      .replace(/Ț/g, 'T');
  };

  // Function to generate weekly PDF report
  const generateWeeklyPDF = async (weekLabel: string, processedData: any) => {
    if (!processedData || generatingPDF === weekLabel) return;
    
    setGeneratingPDF(weekLabel);
    
    try {
      // Fetch payment data for this week
      const paymentsResponse = await fetch('/api/payments');
      const allPayments = await paymentsResponse.json();
      const weekPayments = allPayments.filter((payment: any) => payment.week_label === weekLabel);
      
      // Fetch company balance data for this week
      const balanceResponse = await fetch('/api/company-balances');
      const allBalances = await balanceResponse.json();
      const weekBalances = allBalances.filter((balance: any) => balance.weekLabel === weekLabel);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(fixRomanianText('RAPORT SAPTAMANAL - TRANSPORT PRO'), pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(fixRomanianText(`Saptamana: ${weekLabel}`), pageWidth / 2, 35, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(fixRomanianText(`Generat pe: ${new Date().toLocaleDateString('ro-RO')} la ${new Date().toLocaleTimeString('ro-RO')}`), pageWidth / 2, 45, { align: 'center' });
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 50, pageWidth - 20, 50);
      
      let yPosition = 60;
      
      // Summary section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(fixRomanianText('SUMAR GENERAL'), 20, yPosition);
      yPosition += 15;
      
      const companies = Object.keys(processedData).filter(company => 
        company !== 'Unmatched' && company !== 'Pending Mapping'
      );
      
      const totalInvoiced7 = companies.reduce((sum, company) => sum + (processedData[company].Total_7_days || 0), 0);
      const totalInvoiced30 = companies.reduce((sum, company) => sum + (processedData[company].Total_30_days || 0), 0);
      const totalCommission = companies.reduce((sum, company) => sum + (processedData[company].Total_comision || 0), 0);
      const totalNet = totalInvoiced7 + totalInvoiced30 - totalCommission;
      const totalPaid = weekPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0);
      const totalOutstanding = totalNet - totalPaid;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(fixRomanianText(`Companii procesate: ${companies.length}`), 20, yPosition);
      yPosition += 10;
      doc.text(fixRomanianText(`Total facturat (7 zile): €${totalInvoiced7.toFixed(2)}`), 20, yPosition);
      yPosition += 8;
      doc.text(fixRomanianText(`Total facturat (30 zile): €${totalInvoiced30.toFixed(2)}`), 20, yPosition);
      yPosition += 8;
      doc.text(fixRomanianText(`Total comisioane: €${totalCommission.toFixed(2)}`), 20, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.text(fixRomanianText(`Total net facturat: €${totalNet.toFixed(2)}`), 20, yPosition);
      yPosition += 8;
      doc.text(fixRomanianText(`Total incasat: €${totalPaid.toFixed(2)}`), 20, yPosition);
      yPosition += 8;
      
      // Color coding for outstanding amount
      if (totalOutstanding > 0) {
        doc.setTextColor(220, 53, 69); // Red for outstanding
        doc.text(fixRomanianText(`Restant de incasat: €${totalOutstanding.toFixed(2)}`), 20, yPosition);
      } else if (totalOutstanding < 0) {
        doc.setTextColor(40, 167, 69); // Green for overpaid
        doc.text(fixRomanianText(`Surplus incasat: €${Math.abs(totalOutstanding).toFixed(2)}`), 20, yPosition);
      } else {
        doc.setTextColor(40, 167, 69); // Green for balanced
        doc.text(fixRomanianText('Status: Complet incasat'), 20, yPosition);
      }
      doc.setTextColor(0, 0, 0); // Reset to black
      
      yPosition += 20;
      
      // Detailed company breakdown
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(fixRomanianText('DETALII PE COMPANII'), 20, yPosition);
      yPosition += 15;
      
      // Table data preparation
      const tableData = companies.map(company => {
        const companyData = processedData[company];
        const companyPayments = weekPayments.filter((p: any) => p.company_name === company);
        const companyPaid = companyPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0);
        const companyBalance = weekBalances.find((b: any) => b.companyName === company);
        const companyOutstanding = companyBalance ? parseFloat(companyBalance.outstandingBalance || '0') : 0;
        
        const total7 = companyData.Total_7_days || 0;
        const total30 = companyData.Total_30_days || 0;
        const commission = companyData.Total_comision || 0;
        const netAmount = total7 + total30 - commission;
        
        return [
          fixRomanianText(company),
          `€${total7.toFixed(2)}`,
          `€${total30.toFixed(2)}`,
          `€${commission.toFixed(2)}`,
          `€${netAmount.toFixed(2)}`,
          `€${companyPaid.toFixed(2)}`,
          `€${companyOutstanding.toFixed(2)}`
        ];
      });
      
      // Add table
      autoTable(doc, {
        startY: yPosition,
        head: [['Companie', '7 Zile', '30 Zile', 'Comision', 'Net', 'Incasat', 'Restant']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [52, 152, 219], 
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8, 
          halign: 'left',
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 35 }, // Company
          1: { halign: 'right', cellWidth: 20 }, // 7 Days
          2: { halign: 'right', cellWidth: 20 }, // 30 Days
          3: { halign: 'right', cellWidth: 20 }, // Commission
          4: { halign: 'right', cellWidth: 20 }, // Net
          5: { halign: 'right', cellWidth: 20 }, // Paid
          6: { halign: 'right', fontStyle: 'bold', cellWidth: 20 } // Outstanding
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 20, right: 20 },
        // Color coding for outstanding amounts
        didParseCell: function (data) {
          if (data.column.index === 6) { // Outstanding column
            const amount = parseFloat(data.cell.text[0].replace(/[^\d.-]/g, ''));
            if (amount > 0) {
              data.cell.styles.textColor = [220, 53, 69]; // Red for outstanding
              data.cell.styles.fontStyle = 'bold';
            } else if (amount < 0) {
              data.cell.styles.textColor = [40, 167, 69]; // Green for overpaid
            } else {
              data.cell.styles.textColor = [40, 167, 69]; // Green for zero
            }
          }
        }
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setLineWidth(0.3);
        doc.setDrawColor(200, 200, 200);
        doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(fixRomanianText('Transport Pro - Raport Saptamanal'), 20, pageHeight - 12);
        doc.text(`Pagina ${i} din ${pageCount}`, pageWidth - 30, pageHeight - 12);
      }
      
      // Save PDF
      const fileName = fixRomanianText(`raport_saptamanal_${weekLabel.replace(/\s/g, '_').replace(/\./g, '')}.pdf`);
      doc.save(fileName);
      
      toast({
        title: "PDF generat cu succes",
        description: `Raportul săptămânal pentru ${weekLabel} a fost descărcat.`,
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Eroare la generarea PDF",
        description: "Nu s-a putut genera raportul. Încercați din nou.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(null);
    }
  };

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    setLoading(true);
    try {
      const data = await loadAllWeeklyProcessing();
      console.log('🗓️ SavedDataCalendar - Raw data from API:', data);
      console.log('🗓️ Total weeks found:', data.length);
      console.log('🗓️ All week labels:', data.map((w: any) => w.weekLabel));
      console.log('🗓️ February weeks found:', data.filter((w: any) => w.weekLabel.includes('feb')));
      setSavedWeeks(data);
    } catch (error) {
      console.error('Error loading saved data:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewWeekDetails = async (weekLabel: string) => {
    try {
      const weekData = await loadWeeklyProcessingByWeek(weekLabel);
      setSelectedWeekData(weekData);
      setExpandedWeek(expandedWeek === weekLabel ? null : weekLabel);
    } catch (error) {
      console.error('Error loading week details:', error);
    }
  };

  const loadWeekForEdit = async (weekLabel: string) => {
    try {
      setLoading(true);
      // Load the week data first
      await loadWeeklyProcessingByWeek(weekLabel);
      // Set the processing week
      setProcessingWeek(weekLabel);
      // Switch to payments tab where user can manage payments
      setActiveTab('payments');
    } catch (error) {
      console.error('Error loading week for edit:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'recent' ? 'oldest' : 'recent');
  };

  // Parse Romanian date format "DD mmm. YYYY - DD mmm. YYYY" to comparable date
  const parseRomanianWeekDate = (weekLabel: string): Date => {
    // Extract start date from "DD mmm. YYYY - DD mmm. YYYY" format (handle cross-year weeks)
    const startDateStr = weekLabel.split(' - ')[0];
    const monthMap: Record<string, number> = {
      'ian': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mai': 4, 'iun': 5,
      'iul': 6, 'aug': 7, 'sep': 8, 'sept': 8, 'oct': 9, 'noi': 10, 'nov': 10, 'dec': 11
    };
    
    const parts = startDateStr.split(' ');
    const day = parseInt(parts[0]);
    const monthStr = parts[1].replace('.', '');
    const month = monthMap[monthStr] ?? 0;
    
    // Enhanced year detection for cross-year weeks like "29 dec. 2024 - 4 ian. 2025"
    let year = 2024; // Default fallback
    if (parts.length >= 3) {
      const yearPart = parseInt(parts[2]);
      if (!isNaN(yearPart) && yearPart > 2000) {
        year = yearPart;
      }
    } else {
      // Legacy handling for old data without years
      console.warn('⚠️ Week label without explicit year found:', weekLabel);
      
      // Special handling for cross-year scenarios
      if (weekLabel.includes('ian. 2025') || weekLabel.includes('2025')) {
        year = weekLabel.includes('dec.') ? 2024 : 2025; // Start date determines year
      } else if (monthStr === 'ian') {
        year = 2025; // January is likely 2025
      } else if (monthStr === 'dec') {
        year = 2024; // December is likely 2024
      } else {
        year = 2024; // Everything else defaults to 2024
      }
    }
    
    const parsedDate = new Date(year, month, day);
    
    // Debug cross-year weeks
    if (weekLabel.includes('2025') || weekLabel.includes('ian')) {
      console.log(`🗓️ Cross-year week parsed: "${weekLabel}" → ${parsedDate.toISOString().split('T')[0]}`);
    }
    
    return parsedDate;
  };

  // Default to newest first (recent), but allow user to change
  const sortedSavedWeeks = [...savedWeeks].sort((a, b) => {
    const dateA = parseRomanianWeekDate(a.weekLabel);
    const dateB = parseRomanianWeekDate(b.weekLabel);
    
    // Debug parsing for 2025 weeks and recent data
    if (a.weekLabel.includes('ian') || b.weekLabel.includes('ian') || a.weekLabel.includes('2025') || b.weekLabel.includes('2025')) {
      console.log('🗓️ Parsing 2025 week:', a.weekLabel, '→', dateA);
      console.log('🗓️ Compared with:', b.weekLabel, '→', dateB);
    }
    
    if (sortOrder === 'recent') {
      // Recent first: newer dates first (default)
      return dateB.getTime() - dateA.getTime();
    } else {
      // Oldest first: older dates first
      return dateA.getTime() - dateB.getTime();
    }
  });

  const calculateWeekTotals = (processedData: any) => {
    if (!processedData) return { companies: 0, totalAmount: 0 };
    
    let totalAmount = 0;
    const companies = Object.keys(processedData).length;
    
    Object.values(processedData).forEach((companyData: any) => {
      totalAmount += Math.max(0, companyData.Total_7_days + companyData.Total_30_days - companyData.Total_comision);
    });
    
    return { companies, totalAmount };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="text-gray-300">Se încarcă datele salvate...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Date Salvate în Baza de Date
            </h2>
            <p className="text-gray-400">Vizualizați și gestionați datele procesate salvate</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={toggleSortOrder}
            className="glass-button px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={sortOrder === 'recent' ? 'Schimbă la cele mai vechi prima' : 'Schimbă la cele mai recente prima'}
          >
            {sortOrder === 'recent' ? (
              <>
                <SortDesc className="w-4 h-4" />
                <span>Recente Prima</span>
              </>
            ) : (
              <>
                <SortAsc className="w-4 h-4" />
                <span>Vechi Prima</span>
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={loadSavedData}
            className="glass-button px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reîncarcă Date</span>
          </motion.button>
        </div>
      </div>

      {savedWeeks.length === 0 ? (
        <motion.div
          className="glass-effect rounded-2xl p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Nu există date salvate
          </h3>
          <p className="text-gray-400">
            Procesați și salvați date pentru a le vedea aici.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {sortedSavedWeeks.map((week, index) => {
            const totals = calculateWeekTotals(week.processedData);
            const isExpanded = expandedWeek === week.weekLabel;

            return (
              <motion.div
                key={week.id}
                className="glass-effect rounded-2xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div 
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => viewWeekDetails(week.weekLabel)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-400" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Săptămâna {week.weekLabel}
                        </h3>
                        <p className="text-gray-400">
                          Salvat pe {formatDate(week.processingDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">
                          {totals.companies} companii
                        </div>
                        <div className="text-xl font-bold text-green-400">
                          €{totals.totalAmount.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateWeeklyPDF(week.weekLabel, week.processedData);
                          }}
                          disabled={generatingPDF === week.weekLabel}
                          className="glass-button p-2 rounded-lg hover:bg-white/10 disabled:opacity-50"
                          whileHover={{ scale: generatingPDF === week.weekLabel ? 1 : 1.05 }}
                          whileTap={{ scale: generatingPDF === week.weekLabel ? 1 : 0.95 }}
                          title="Descarcă raport PDF săptămânal"
                        >
                          {generatingPDF === week.weekLabel ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadWeekForEdit(week.weekLabel);
                          }}
                          className="glass-button p-2 rounded-lg hover:bg-white/10"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Încarcă pentru gestionarea plăților"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && week.processedData && (
                  <motion.div
                    className="border-t border-white/10 p-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Date procesate</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(week.processedData)
                        .filter(([company]) => company !== 'Unmatched' && company !== 'Pending Mapping')
                        .map(([company, data]: [string, any]) => {
                        const total = data.Total_7_days + data.Total_30_days - data.Total_comision;
                        
                        return (
                          <div
                            key={company}
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-white">{company}</h5>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">7 zile:</span>
                                <span className="text-white">€{data.Total_7_days.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">30 zile:</span>
                                <span className="text-white">€{data.Total_30_days.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Comision:</span>
                                <span className="text-red-400">-€{data.Total_comision.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-white/20 pt-1">
                                <span className="text-gray-300 font-medium">Total:</span>
                                <span className="text-green-400 font-semibold">€{total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}