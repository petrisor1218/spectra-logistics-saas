import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Calendar, Database, Eye, TrendingUp, FileText, Loader2, AlertCircle } from "lucide-react";

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

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    setLoading(true);
    try {
      const data = await loadAllWeeklyProcessing();
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

  const loadWeekForEdit = (weekLabel: string) => {
    setProcessingWeek(weekLabel);
    setActiveTab('calculations');
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

  const calculateWeekTotals = (processedData: any) => {
    if (!processedData) return { companies: 0, totalAmount: 0 };
    
    let totalAmount = 0;
    const companies = Object.keys(processedData).length;
    
    Object.values(processedData).forEach((companyData: any) => {
      totalAmount += companyData.Total_7_days + companyData.Total_30_days - companyData.Total_comision;
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
        
        <motion.button
          onClick={loadSavedData}
          className="glass-button px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-white/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Reîncarcă</span>
        </motion.button>
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
          {savedWeeks.map((week, index) => {
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
                            loadWeekForEdit(week.weekLabel);
                          }}
                          className="glass-button p-2 rounded-lg hover:bg-white/10"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Încarcă pentru editare"
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
                      {Object.entries(week.processedData).map(([company, data]: [string, any]) => {
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