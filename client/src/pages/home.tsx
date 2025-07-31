import { motion } from "framer-motion";
import { useState } from "react";
import { Upload, Calculator, DollarSign, Calendar, History, Save, Truck, Settings, BarChart3 } from "lucide-react";
import { NavigationHeader } from "@/components/transport/NavigationHeader";
import { StatusCards } from "@/components/transport/StatusCards";
import { FileUploadSection } from "@/components/transport/FileUploadSection";
import { DataProcessingSection } from "@/components/transport/DataProcessingSection";
import { ResultsDisplay } from "@/components/transport/ResultsDisplay";
import { CalendarModal } from "@/components/transport/CalendarModal";
import { LoadingOverlay } from "@/components/transport/LoadingOverlay";
import { WeeklyHistorySection } from "@/components/transport/WeeklyHistorySection";
import { SavedDataCalendar } from "@/components/transport/SavedDataCalendar";
import { UnmatchedVRIDModal } from "@/components/transport/UnmatchedVRIDModal";
import { TransportOrdersView } from "@/components/transport/TransportOrdersView";
import WeeklyReportsView from "@/components/transport/WeeklyReportsView";
import { ManagementTabs } from "@/components/management/ManagementTabs";
import { useTransportData } from "@/hooks/useTransportData";

export default function Home() {
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  
  const {
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
    
    // Actions
    setActiveTab,
    setProcessingWeek,
    setShowCalendar,
    setCalendarDate,
    handleFileUpload,
    processData,
    recordPayment,
    deletePayment,
    loadAllPaymentHistory,
    loadPaymentsForWeek,
    saveProcessedData,
    loadAllWeeklyProcessing,
    loadWeeklyProcessingByWeek,
    assignUnmatchedVRID,
    loadDriversFromDatabase,
    
    // Computed
    getWeekOptions,
    getDaysInMonth,
    selectWeekFromCalendar,
    isDateInSelectedWeek,
    canSelectDate,
    getRemainingPayment,
  } = useTransportData();

  const weekOptions = getWeekOptions();
  const canProcess = tripData && invoice7Data && invoice30Data && processingWeek;

  // Debug logging
  console.log('Home component rendered', { activeTab });

  const tabs = [
    { id: 'upload', label: 'Încărcare Fișiere', icon: Upload },
    { id: 'calculations', label: 'Calcule și Totale', icon: Calculator },
    { id: 'payments', label: 'Evidența Plăților', icon: DollarSign },
    { id: 'reports', label: 'Rapoarte Săptămânale', icon: BarChart3 },
    { id: 'orders', label: 'Comenzi Transport', icon: Truck },
    { id: 'management', label: 'Gestionare', icon: Settings },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'history', label: 'Istoric Săptămânal', icon: History }
  ];

  return (
    <div className="min-h-screen text-white" style={{
      background: 'linear-gradient(135deg, hsl(240, 21%, 9%) 0%, hsl(240, 19%, 13%) 50%, hsl(240, 17%, 16%) 100%)'
    }}>
      <NavigationHeader />
      
      <main className="pt-24 pb-8">
        <div className="container mx-auto px-6">
          {/* Status Overview Cards */}
          <StatusCards 
            processedData={processedData}
            selectedWeek={selectedWeek}
          />

          {/* Main Tabs Navigation */}
          <motion.div 
            className="glass-effect rounded-2xl p-2 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'tab-active text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* File Upload Tab */}
            {activeTab === 'upload' && (
              <div>
                {/* Week Selection for Processing */}
                <motion.div 
                  className="flex justify-between items-center mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-bold gradient-text">Încărcați Fișierele</h2>
                  
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-300">Săptămâna procesată:</label>
                    <select 
                      value={processingWeek}
                      onChange={(e) => setProcessingWeek(e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Selectează săptămâna</option>
                      {weekOptions.map(week => (
                        <option key={week.value} value={week.value}>{week.label}</option>
                      ))}
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCalendar(true)}
                      className="px-4 py-2 glass-effect border border-gray-600 rounded-lg text-sm hover:border-primary transition-colors"
                    >
                      📅 Calendar
                    </motion.button>
                  </div>
                </motion.div>

                {processingWeek && (
                  <motion.div 
                    className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <p className="text-green-300 text-sm">
                      📅 Procesați datele pentru săptămâna: <strong>{processingWeek}</strong>
                    </p>
                  </motion.div>
                )}

                <FileUploadSection
                  tripData={tripData}
                  invoice7Data={invoice7Data}
                  invoice30Data={invoice30Data}
                  loading={loading}
                  tripFileRef={tripFileRef}
                  invoice7FileRef={invoice7FileRef}
                  invoice30FileRef={invoice30FileRef}
                  handleFileUpload={handleFileUpload}
                />
              </div>
            )}

            {/* Data Processing Tab */}
            {activeTab === 'calculations' && (
              <div>
                <DataProcessingSection
                  selectedWeek={selectedWeek}
                  processingWeek={processingWeek}
                  loading={loading}
                  weekOptions={weekOptions}
                  setProcessingWeek={setProcessingWeek}
                  setShowCalendar={setShowCalendar}
                  processData={processData}
                  canProcess={!!canProcess}
                  processedData={processedData}
                  onShowUnmatchedModal={() => setShowUnmatchedModal(true)}
                />

                {Object.keys(processedData).length > 0 && (
                  <motion.div 
                    className="glass-effect rounded-2xl p-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-white">Rezultate Procesare</h3>
                      
                      <div className="flex items-center space-x-4">
                        {selectedWeek && (
                          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2">
                            <p className="text-blue-300 text-sm">
                              📊 Date procesate pentru: <strong>{selectedWeek}</strong>
                            </p>
                          </div>
                        )}
                        
                        <motion.button
                          onClick={saveProcessedData}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-3 rounded-xl text-white font-medium flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={loading}
                        >
                          <Save className="w-5 h-5" />
                          <span>{loading ? 'Se salvează...' : 'Salvează în BD'}</span>
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Companie</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">7 Zile</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">30 Zile</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Comision</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total de Plată</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Achitat</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Rest de Plată</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {Object.entries(processedData).map(([company, data]: [string, any], index) => {
                            const total = data.Total_7_days + data.Total_30_days - data.Total_comision;
                            const paid = payments[company] || 0;
                            const remaining = Math.max(0, total - paid);
                            
                            return (
                              <motion.tr 
                                key={company}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + index * 0.1 }}
                                className="hover:bg-white/5 transition-colors"
                              >
                                <td className="px-6 py-4 text-sm font-medium text-white">{company}</td>
                                <td className="px-6 py-4 text-sm text-white text-right">€{data.Total_7_days.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm text-white text-right">€{data.Total_30_days.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm text-red-400 text-right">-€{data.Total_comision.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-blue-400 text-right">€{total.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm text-green-400 text-right">€{paid.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-right">
                                  <span className={remaining === 0 ? 'text-green-400' : 'text-red-400'}>
                                    €{remaining.toFixed(2)}
                                  </span>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* Results Display in Calculations Tab */}
                {Object.keys(processedData).length > 0 && (
                  <ResultsDisplay
                    processedData={processedData}
                    payments={payments}
                    paymentHistory={paymentHistory}
                    recordPayment={recordPayment}
                    deletePayment={deletePayment}
                    getRemainingPayment={getRemainingPayment}
                    selectedWeek={selectedWeek || ''}
                  />
                )}

                {Object.keys(processedData).length === 0 && (
                  <motion.div 
                    className="text-center text-gray-400 py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Calculator size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Nu există date procesate</p>
                    <p className="text-sm">Încărcați fișierele și procesați datele pentru a vedea calculele</p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                <motion.div 
                  className="flex justify-between items-center mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-bold gradient-text">Evidența Plăților</h2>
                  
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-300">Perioada plăților:</label>
                    <select 
                      value={selectedWeek}
                      onChange={(e) => setProcessingWeek(e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Selectează săptămâna</option>
                      {weekOptions.map(week => (
                        <option key={week.value} value={week.value}>{week.label}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>

                <ResultsDisplay
                  processedData={processedData}
                  payments={payments}
                  paymentHistory={paymentHistory}
                  recordPayment={recordPayment}
                  deletePayment={deletePayment}
                  getRemainingPayment={getRemainingPayment}
                  selectedWeek={selectedWeek || ''}
                />
              </div>
            )}

            {/* Weekly Reports Tab */}
            {activeTab === 'reports' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <WeeklyReportsView 
                  selectedWeek={selectedWeek || processingWeek || ''}
                />
              </motion.div>
            )}

            {/* Transport Orders Tab */}
            {activeTab === 'orders' && (
              <TransportOrdersView />
            )}

            {/* Management Tab */}
            {activeTab === 'management' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ManagementTabs loadDriversFromDatabase={loadDriversFromDatabase} />
              </motion.div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <SavedDataCalendar
                loadAllWeeklyProcessing={loadAllWeeklyProcessing}
                loadWeeklyProcessingByWeek={loadWeeklyProcessingByWeek}
                setProcessingWeek={setProcessingWeek}
                setActiveTab={setActiveTab}
              />
            )}

            {/* Weekly History Tab */}
            {activeTab === 'history' && (
              <WeeklyHistorySection
                weeklyPaymentHistory={weeklyPaymentHistory}
                loadAllPaymentHistory={loadAllPaymentHistory}
                loadPaymentsForWeek={loadPaymentsForWeek}
                getWeekOptions={getWeekOptions}
                loadWeeklyProcessingData={loadWeeklyProcessingByWeek}
              />
            )}
          </motion.div>
        </div>
      </main>

      {/* Calendar Modal */}
      <CalendarModal
        showCalendar={showCalendar}
        calendarDate={calendarDate}
        setCalendarDate={setCalendarDate}
        setShowCalendar={setShowCalendar}
        getDaysInMonth={getDaysInMonth}
        canSelectDate={canSelectDate}
        isDateInSelectedWeek={isDateInSelectedWeek}
        selectWeekFromCalendar={selectWeekFromCalendar}
        selectedWeek={selectedWeek}
      />

      {/* Loading Overlay */}
      <LoadingOverlay loading={loading} />

      {/* Unmatched VRID Modal */}
      <UnmatchedVRIDModal
        isOpen={showUnmatchedModal}
        onClose={() => setShowUnmatchedModal(false)}
        processedData={processedData}
        onAssignVRID={assignUnmatchedVRID}
      />

      {/* Floating Action Button */}
      <motion.div 
        className="fixed bottom-8 right-8 z-30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <motion.button 
          className="w-16 h-16 gradient-primary rounded-full shadow-2xl hover-glow flex items-center justify-center animate-float"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('upload')}
        >
          <Upload className="text-white" size={24} />
        </motion.button>
      </motion.div>
    </div>
  );
}
