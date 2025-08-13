import { motion } from "framer-motion";
import { useState } from "react";
import { Upload, Calculator, DollarSign, Calendar, History, Save, Truck, Settings, BarChart3, Shield, AlertTriangle, TrendingUp, Lock as LockIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PendingDriverMappings } from "@/components/processing/PendingDriverMappings";
import CompanyBalancesView from "@/components/balance/CompanyBalancesView";
import PaymentHistoryView from "@/components/payment/PaymentHistoryView";
import { CompanySummaryTable } from "@/components/transport/CompanySummaryTable";
import { SmallAmountAlertsModal } from "@/components/admin/SmallAmountAlertsModal";
import { TruckEmptyState } from "@/components/transport/TruckEmptyState";
import { TruckBackground } from "@/components/transport/TruckBackground";
import { YearEndClosurePanel } from "@/components/admin/YearEndClosurePanel";
import DriverAnalytics from "@/components/transport/DriverAnalytics";
import { useTransportData } from "@/hooks/useTransportData";
import { useAuth } from "@/hooks/useAuth";
import { SimpleLogin } from "@/components/auth/SimpleLogin";

export default function Home() {
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [showSmallAmountAlertsModal, setShowSmallAmountAlertsModal] = useState(false);
  const [importantNotes, setImportantNotes] = useState(() => {
    const saved = localStorage.getItem('important-notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteInputValue, setNoteInputValue] = useState('');
  const [noteTitleValue, setNoteTitleValue] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const { isAuthenticated, isLoading, login } = useAuth();
  
  // Show login screen if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <SimpleLogin onLoginSuccess={login} />;
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Se încarcă...</p>
        </div>
      </div>
    );
  }
  
  const {
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
    
    // Actions
    setActiveTab,
    setProcessingWeek,
    setShowCalendar,
    setCalendarDate,
    handleFileUpload,
    clearUploadedFiles,
    processData,
    recordPayment,
    deletePayment,
    loadAllPaymentHistory,
    loadPaymentsForWeek,
    saveProcessedData,
    loadAllWeeklyProcessing,
    loadWeeklyProcessingByWeek,
    weeklyProcessingData,
    assignUnmatchedVRID,
    loadDriversFromDatabase,
    pendingMappings,
    setPendingMappings,
    addDriverToDatabase,
    
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
    { id: 'balances', label: 'Bilanțuri Companii', icon: BarChart3 },
    { id: 'summary', label: 'Sumar Companii', icon: TrendingUp },
    { id: 'reports', label: 'Rapoarte Săptămânale', icon: BarChart3 },
    { id: 'orders', label: 'Comenzi Transport', icon: Truck },
    { id: 'management', label: 'Gestionare', icon: Settings },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'history', label: 'Istoric Plăți', icon: History },
    { id: 'driver-analytics', label: 'Analiză Șoferi', icon: Users },
    { id: 'year-closure', label: 'Închidere Anuală', icon: LockIcon }
  ];

  return (
    <div className="min-h-screen text-foreground relative bg-background">
      <TruckBackground />
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
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
              
              {/* Separator */}
              <div className="w-px bg-gray-600 h-10 mx-2"></div>
              
              {/* Analytics Dashboard Button */}
              <motion.button
                onClick={() => window.location.href = '/analytics'}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Deschide Dashboard Analytics"
              >
                <BarChart3 size={16} />
                <span>Analytics</span>
              </motion.button>
              
              {/* Backup & Security Button */}
              <motion.button
                onClick={() => window.location.href = '/backup'}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 border border-green-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Deschide Backup & Security"
              >
                <Shield size={16} />
                <span>Backup</span>
              </motion.button>
              
              {/* Small Amount Alerts Button - Only show when there are alerts */}
              {smallAmountAlerts && smallAmountAlerts.length > 0 && (
                <motion.button
                  onClick={() => setShowSmallAmountAlertsModal(true)}
                  className="px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 border border-yellow-500/30 animate-pulse"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={`${smallAmountAlerts.length} VRID-uri cu sume mici detectate - Click pentru detalii`}
                >
                  <AlertTriangle size={16} />
                  <span>Alerte Sume Mici ({smallAmountAlerts.length})</span>
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Important Notes Display */}
          {importantNotes.length > 0 && (
            <div className="mb-6 space-y-4">
              {importantNotes.map((note: any) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-6 backdrop-blur-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div className="flex-1">
                        {editingNoteId === note.id ? (
                          <div className="space-y-3">
                            <input
                              value={noteTitleValue}
                              onChange={(e) => setNoteTitleValue(e.target.value)}
                              placeholder="Titlul notei..."
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                            />
                            <textarea
                              value={noteInputValue}
                              onChange={(e) => setNoteInputValue(e.target.value)}
                              placeholder="Conținutul notei..."
                              className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 resize-none"
                            />
                            <div className="flex items-center space-x-2">
                              <motion.button
                                onClick={() => {
                                  if (noteInputValue.trim() && noteTitleValue.trim()) {
                                    const updatedNotes = importantNotes.map((n: any) => 
                                      n.id === note.id 
                                        ? { ...n, title: noteTitleValue.trim(), content: noteInputValue.trim() }
                                        : n
                                    );
                                    setImportantNotes(updatedNotes);
                                    localStorage.setItem('important-notes', JSON.stringify(updatedNotes));
                                    setEditingNoteId(null);
                                    setNoteInputValue('');
                                    setNoteTitleValue('');
                                  }
                                }}
                                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-black rounded text-sm font-medium transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={!noteInputValue.trim() || !noteTitleValue.trim()}
                              >
                                💾 Salvează
                              </motion.button>
                              <motion.button
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setNoteInputValue('');
                                  setNoteTitleValue('');
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Anulează
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-red-300 font-semibold mb-2">{note.title}</h3>
                            <p className="text-white whitespace-pre-wrap">{note.content}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {editingNoteId !== note.id && (
                        <motion.button
                          onClick={() => {
                            setNoteTitleValue(note.title);
                            setNoteInputValue(note.content);
                            setEditingNoteId(note.id);
                          }}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ✏️ Editează
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => {
                          const updatedNotes = importantNotes.filter((n: any) => n.id !== note.id);
                          setImportantNotes(updatedNotes);
                          localStorage.setItem('important-notes', JSON.stringify(updatedNotes));
                          setEditingNoteId(null);
                          setNoteInputValue('');
                          setNoteTitleValue('');
                        }}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ✓ Rezolvat
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add Important Note Button - Always visible */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {!showNoteInput ? (
              <motion.button
                onClick={() => setShowNoteInput(true)}
                className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 hover:bg-yellow-500/30 transition-colors text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                📝 Adaugă notă nouă {importantNotes.length > 0 && `(${importantNotes.length} active)`}
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800/50 border border-gray-600 rounded-xl p-4 backdrop-blur-lg"
              >
                <div className="space-y-3">
                  <input
                    value={noteTitleValue}
                    onChange={(e) => setNoteTitleValue(e.target.value)}
                    placeholder="Titlul notei importante..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                  />
                  <textarea
                    value={noteInputValue}
                    onChange={(e) => setNoteInputValue(e.target.value)}
                    placeholder="Scrie descrierea problemei aici..."
                    className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 resize-none"
                  />
                  <div className="flex items-center space-x-3">
                    <motion.button
                      onClick={() => {
                        if (noteInputValue.trim() && noteTitleValue.trim()) {
                          const newNote = {
                            id: Date.now(),
                            title: noteTitleValue.trim(),
                            content: noteInputValue.trim(),
                            createdAt: new Date().toISOString()
                          };
                          const updatedNotes = [...importantNotes, newNote];
                          setImportantNotes(updatedNotes);
                          localStorage.setItem('important-notes', JSON.stringify(updatedNotes));
                          setNoteInputValue('');
                          setNoteTitleValue('');
                          setShowNoteInput(false);
                        }
                      }}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg text-sm font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!noteInputValue.trim() || !noteTitleValue.trim()}
                    >
                      💾 Salvează nota
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowNoteInput(false);
                        setNoteInputValue('');
                        setNoteTitleValue('');
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Anulează
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
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
                  uploadedFiles={uploadedFiles}
                />
                
                {/* Buton pentru a curăța toate fișierele încărcate */}
                {(uploadedFiles.trip.length > 0 || uploadedFiles.invoice7.length > 0 || uploadedFiles.invoice30.length > 0) && (
                  <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Button 
                      onClick={clearUploadedFiles}
                      variant="outline" 
                      className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                    >
                      Șterge toate fișierele încărcate
                    </Button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Data Processing Tab */}
            {activeTab === 'calculations' && (
              <div className="space-y-6">

                
                <PendingDriverMappings
                  pendingMappings={pendingMappings}
                  setPendingMappings={setPendingMappings}
                  addDriverToDatabase={addDriverToDatabase}
                  onMappingComplete={async () => {
                    // Refresh driver mappings and reprocess data to eliminate Pending Mapping entries
                    console.log('🔄 onMappingComplete: Starting comprehensive reprocessing...');
                    
                    if (loadDriversFromDatabase) {
                      await loadDriversFromDatabase();
                      console.log('✅ Driver mappings reloaded from database');
                      
                      // Force a complete reprocess to move VRIDs from Pending Mapping to correct companies
                      if (tripData.length > 0 && (invoice7Data.length > 0 || invoice30Data.length > 0)) {
                        console.log('🔄 Reprocessing all data to resolve Pending Mappings...');
                        await processData();
                        console.log('✅ Data reprocessed - Pending Mappings should be resolved');
                      }
                    }
                  }}
                />
                
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
                  saveProcessedData={saveProcessedData}
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
                            // Only show payments for current processed week, not all historical payments
                            const currentWeekPayments = weeklyPaymentHistory[selectedWeek || processingWeek || ''] || [];
                            const paid = currentWeekPayments
                              .filter((payment: any) => payment.company === company)
                              .reduce((sum: number, payment: any) => sum + payment.amount, 0);
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
                  <TruckEmptyState
                    icon={Calculator}
                    title="Nu există date procesate"
                    description="Încărcați fișierele și procesați datele pentru a vedea calculele și comenzile de transport."
                    actionText="Mergi la Încărcare Fișiere"
                    onAction={() => setActiveTab('upload')}
                  />
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
                      onChange={(e) => {
                        const weekLabel = e.target.value;
                        if (weekLabel) {
                          loadWeeklyProcessingByWeek(weekLabel);
                        } else {
                          // Clear processed data if no selection
                          // setProcessedData({});
                          // setSelectedWeek('');
                        }
                      }}
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
                  processedData={savedProcessedData}
                  payments={payments}
                  paymentHistory={paymentHistory}
                  recordPayment={recordPayment}
                  deletePayment={deletePayment}
                  getRemainingPayment={getRemainingPayment}
                  selectedWeek={selectedWeek || ''}
                />
              </div>
            )}

            {/* Company Balances Tab */}
            {activeTab === 'balances' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CompanyBalancesView />
              </motion.div>
            )}

            {/* Company Summary Tab */}
            {activeTab === 'summary' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CompanySummaryTable weeklyProcessingData={weeklyProcessingData || []} />
              </motion.div>
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

            {/* Payment History Tab */}
            {activeTab === 'history' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PaymentHistoryView />
              </motion.div>
            )}

            {/* Driver Analytics Tab */}
            {activeTab === 'driver-analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DriverAnalytics activeTab={activeTab} />
              </motion.div>
            )}

            {/* Year-End Closure Tab */}
            {activeTab === 'year-closure' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <YearEndClosurePanel />
              </motion.div>
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

      {/* Small Amount Alerts Modal */}
      <SmallAmountAlertsModal
        isOpen={showSmallAmountAlertsModal}
        onClose={() => setShowSmallAmountAlertsModal(false)}
      />
    </div>
  );
}
