import { motion } from "framer-motion";
import { Settings, Play, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface DataProcessingSectionProps {
  selectedWeek: string;
  processingWeek: string;
  loading: boolean;
  weekOptions: any[];
  setProcessingWeek: (week: string) => void;
  setShowCalendar: (show: boolean) => void;
  processData: () => void;
  canProcess: boolean;
  processedData?: any;
  saveProcessedData: (week: string) => void;
  onShowUnmatchedModal?: () => void;
}

export function DataProcessingSection({
  selectedWeek,
  processingWeek,
  loading,
  weekOptions,
  setProcessingWeek,
  setShowCalendar,
  processData,
  canProcess,
  processedData,
  saveProcessedData,
  onShowUnmatchedModal
}: DataProcessingSectionProps) {
  return (
    <motion.div 
      className="glass-effect rounded-2xl p-8 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Procesare Date</h2>
          <p className="text-gray-400">Selectează săptămâna și procesează datele încărcate</p>
        </div>
        <motion.div 
          className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center animate-float"
          animate={{ y: [-10, 0, -10] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Settings className="text-white" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Week Selection */}
        <div className="space-y-4">
          <label className="block text-white font-medium">Selectează Săptămâna</label>
          <Select value={processingWeek} onValueChange={setProcessingWeek}>
            <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white focus:border-primary">
              <SelectValue placeholder="Alege săptămâna..." />
            </SelectTrigger>
            <SelectContent>
              {weekOptions.map(week => (
                <SelectItem key={week.value} value={week.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{week.label}</span>
                    {week.label.includes('2024') && (
                      <span className="text-orange-400 text-xs ml-2">📅 2024</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {processingWeek && processingWeek.includes('2024') && (
            <div className="text-orange-400 text-xs bg-orange-400/10 p-2 rounded-lg">
              ⚠️ Atenție: Procesezi date din anul 2024
            </div>
          )}
          
          <Button
            onClick={() => setShowCalendar(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover-glow"
            variant="default"
          >
            <CalendarIcon className="mr-2" size={16} />
            Deschide Calendarul
          </Button>
        </div>

        {/* Processing Actions */}
        <div className="space-y-4">
          <label className="block text-white font-medium">Acțiuni de Procesare</label>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={processData}
              disabled={!canProcess || loading}
              className="w-full gradient-primary hover-glow disabled:opacity-50"
              size="lg"
            >
              <Play className="mr-2" size={16} />
              {loading ? 'Procesare...' : 'Procesează Datele'}
            </Button>
            
            {/* Manual Save Button - Only shows after processing */}
            {processedData && Object.keys(processedData).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3"
              >
                <Button
                  onClick={() => {
                    if (processingWeek) {
                      saveProcessedData(processingWeek);
                    } else {
                      alert('Selectează o săptămână pentru a salva datele');
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  💾 Salvează în DB
                </Button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Datele sunt procesate în memorie. Apasă pentru a salva în baza de date.
                </p>
              </motion.div>
            )}
            
            {processedData && processedData.Unmatched && onShowUnmatchedModal && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={onShowUnmatchedModal}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white mt-3"
                  size="lg"
                >
                  VRID Neîmperecheate ({Object.keys(processedData.Unmatched.VRID_details || {}).length})
                </Button>
              </motion.div>
            )}
          </motion.div>
          
          {/* Processing Progress */}
          {loading && (
            <motion.div 
              className="bg-gray-800 rounded-xl p-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Progres procesare</span>
                <span className="text-primary-400 text-sm font-medium">75%</span>
              </div>
              <Progress value={75} className="w-full" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
