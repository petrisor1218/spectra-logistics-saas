import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { History, Calendar, Eye, DollarSign, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

interface WeeklyHistorySectionProps {
  weeklyPaymentHistory: any;
  loadAllPaymentHistory: () => Promise<any>;  
  loadPaymentsForWeek: (weekLabel: string) => Promise<void>;
  getWeekOptions: () => any[];
  loadWeeklyProcessingData?: (weekLabel: string) => Promise<any>;
}

export function WeeklyHistorySection({
  weeklyPaymentHistory,
  loadAllPaymentHistory,
  loadPaymentsForWeek,
  getWeekOptions,
  loadWeeklyProcessingData
}: WeeklyHistorySectionProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<any>({});
  const [weeklyProcessingData, setWeeklyProcessingData] = useState<any>({});

  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    setLoading(true);
    try {
      const history = await loadAllPaymentHistory();
      setHistoricalData(history);
    } catch (error) {
      console.error('Error loading historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWeekExpansion = async (weekLabel: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekLabel)) {
      newExpanded.delete(weekLabel);
    } else {
      newExpanded.add(weekLabel);
      
      // Load weekly processing data when expanding a week
      if (loadWeeklyProcessingData && !weeklyProcessingData[weekLabel]) {
        try {
          const processingData = await loadWeeklyProcessingData(weekLabel);
          setWeeklyProcessingData((prev: any) => ({
            ...prev,
            [weekLabel]: processingData
          }));
        } catch (error) {
          console.error('Error loading weekly processing data:', error);
        }
      }
    }
    setExpandedWeeks(newExpanded);
  };

  const calculateWeekTotals = (weekPayments: any[]) => {
    return weekPayments.reduce((totals, payment) => {
      const company = payment.company || payment.companyName;
      const amount = parseFloat(payment.amount);
      
      if (!totals[company]) {
        totals[company] = 0;
      }
      totals[company] += amount;
      
      return totals;
    }, {});
  };

  const getWeekTotal = (weekPayments: any[]) => {
    return weekPayments.reduce((total, payment) => {
      return total + parseFloat(payment.amount);
    }, 0);
  };

  const weekOptions = getWeekOptions();
  
  // Helper function to parse week string and get start date
  const parseWeekString = (weekStr: string) => {
    try {
      // Extract the start date from "22 iun. - 28 iun." format
      const parts = weekStr.split(' - ')[0].split(' ');
      if (parts.length >= 2) {
        const day = parseInt(parts[0]);
        const monthAbbr = parts[1].replace('.', '');
        
        // Romanian month abbreviations to numbers
        const monthMap: { [key: string]: number } = {
          'ian': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mai': 4, 'iun': 5,
          'iul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        
        const month = monthMap[monthAbbr];
        if (month !== undefined) {
          const currentYear = new Date().getFullYear();
          const parsedDate = new Date(currentYear, month, day);
          console.log(`Parsed week "${weekStr}" to date:`, parsedDate);
          return parsedDate;
        }
      }
    } catch (error) {
      console.error('Error parsing week string:', weekStr, error);
    }
    return new Date(0); // Fallback to epoch if parsing fails
  };
  
  const availableWeeks = Object.keys(historicalData).sort((a, b) => {
    // Sort by most recent first (reverse chronological order)
    const dateA = parseWeekString(a);
    const dateB = parseWeekString(b);
    const result = dateB.getTime() - dateA.getTime();
    console.log(`Comparing "${a}" (${dateA.toISOString()}) vs "${b}" (${dateB.toISOString()}) = ${result}`);
    return result;
  });

  console.log('Final sorted weeks:', availableWeeks);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className="text-gray-300">Se încarcă istoricul...</span>
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
          <History className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Istoric Săptămânal
            </h2>
            <p className="text-gray-400">Vizualizați plățile din săptămânile anterioare</p>
          </div>
        </div>
        
        <motion.button
          onClick={loadHistoricalData}
          className="glass-button px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-white/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Reîncarcă</span>
        </motion.button>
      </div>

      {availableWeeks.length === 0 ? (
        <motion.div
          className="glass-effect rounded-2xl p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Nu există istoric disponibil
          </h3>
          <p className="text-gray-400">
            Efectuați plăți pentru a începe să urmăriți istoricul săptămânal.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {availableWeeks.map((weekLabel, index) => {
            const weekPayments = historicalData[weekLabel] || [];
            const weekTotals = calculateWeekTotals(weekPayments);
            const weekTotal = getWeekTotal(weekPayments);
            const isExpanded = expandedWeeks.has(weekLabel);

            return (
              <motion.div
                key={weekLabel}
                className="glass-effect rounded-2xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div 
                  className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleWeekExpansion(weekLabel)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-purple-400" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Săptămâna {weekLabel}
                        </h3>
                        <p className="text-gray-400">
                          {weekPayments.length} plăți • {Object.keys(weekTotals).length} companii
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          €{weekTotal.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">Total săptămână</div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadPaymentsForWeek(weekLabel);
                          }}
                          className="glass-button p-2 rounded-lg hover:bg-white/10"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Vizualizează această săptămână"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    className="border-t border-white/10 p-6 space-y-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {/* Company Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {Object.entries(weekTotals).map(([company, total]: [string, any]) => {
                        // Load weekly processing data for this week if available
                        const processingData = weeklyProcessingData[weekLabel];
                        const companyData = processingData?.processedData?.[company];
                        
                        if (!companyData) {
                          return (
                            <div
                              key={company}
                              className="bg-white/5 rounded-xl p-4 border border-white/10"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-white">{company}</h4>
                                  <p className="text-sm text-gray-400">
                                    {weekPayments.filter((p: any) => (p.company || p.companyName) === company).length} plăți
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-green-400">
                                    €{total.toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-400">Plătit</div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        const sevenDaysAmount = companyData.Total_7_days || 0;
                        const thirtyDaysAmount = companyData.Total_30_days || 0;
                        const commission = companyData.Total_comision || 0;
                        const totalOwed = sevenDaysAmount + thirtyDaysAmount - commission;
                        const remaining = Math.max(0, totalOwed - total);
                        
                        return (
                          <div
                            key={company}
                            className="bg-white/5 rounded-xl p-4 border border-white/10"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-white">{company}</h4>
                                  <p className="text-sm text-gray-400">
                                    {weekPayments.filter((p: any) => (p.company || p.companyName) === company).length} plăți
                                  </p>
                                </div>
                              </div>
                              
                              {/* Payment Details Summary */}
                              <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Facturi 7 zile:</span>
                                  <span className="text-green-400">€{sevenDaysAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Facturi 30 zile:</span>
                                  <span className="text-blue-400">€{thirtyDaysAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Comision:</span>
                                  <span className="text-red-400">-€{commission.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-600 pt-2">
                                  <div className="flex justify-between font-medium">
                                    <span className="text-white">Total de plată:</span>
                                    <span className="text-white">€{totalOwed.toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="border-t border-gray-600 pt-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Deja plătit:</span>
                                    <span className="text-yellow-400">€{total.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-medium mt-1">
                                    <span className="text-white">Rest de plată:</span>
                                    <span className={`${remaining === 0 ? 'text-green-400' : 'text-orange-400'}`}>
                                      €{remaining.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Individual Payments */}
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Plăți individuale</span>
                      </h4>
                      
                      <div className="space-y-2">
                        {weekPayments.map((payment: any, paymentIndex: number) => (
                          <div
                            key={payment.id || paymentIndex}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-blue-400" />
                              </div>
                              
                              <div>
                                <div className="font-medium text-white">
                                  {payment.company || payment.companyName}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {payment.date} • {payment.description || 'Plată'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-lg font-semibold text-green-400">
                              €{parseFloat(payment.amount).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
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