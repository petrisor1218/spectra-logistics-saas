import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, AlertTriangle, Check } from 'lucide-react';

interface SmallAmountAlert {
  vrid: string;
  amount: number;
  company: string;
  invoiceType: string;
}

interface SmallAmountAlertsModalProps {
  alerts: SmallAmountAlert[];
  isOpen: boolean;
  onClose: () => void;
}

const SmallAmountAlertsModal: React.FC<SmallAmountAlertsModalProps> = ({
  alerts,
  isOpen,
  onClose
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  // Format pentru copiere individuală
  const copyIndividualAlert = async (alert: SmallAmountAlert, index: number) => {
    const text = `VRID: ${alert.vrid} - €${alert.amount.toFixed(2)} (${alert.company} - ${alert.invoiceType})`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Nu s-a putut copia:', err);
    }
  };

  // Format pentru copiere completă
  const copyAllAlerts = async () => {
    const text = `⚠️ VRID-uri cu sume mici (≤10 EUR) - Total: ${alerts.length}\n\n` +
      alerts.map((alert, index) => 
        `${index + 1}. VRID: ${alert.vrid}\n   • Sumă: €${alert.amount.toFixed(2)}\n   • Companie: ${alert.company}\n   • Tip: ${alert.invoiceType}`
      ).join('\n\n') +
      '\n\n🔍 Verificați aceste VRID-uri pentru posibile erori sau cursuri incomplete!';
    
    try {
      await navigator.clipboard.writeText(text);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    } catch (err) {
      console.error('Nu s-a putut copia:', err);
    }
  };

  if (!isOpen || alerts.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-yellow-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Alerte Sume Mici (≤10 EUR)
                </h2>
                <p className="text-gray-400 text-sm">
                  {alerts.length} VRID-uri detectate cu sume foarte mici
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Copy All Button */}
          <div className="mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyAllAlerts}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all"
            >
              {allCopied ? <Check size={20} /> : <Copy size={20} />}
              <span>{allCopied ? 'Lista Copiată!' : 'Copiază Toate Alertele'}</span>
            </motion.button>
          </div>

          {/* Alerts List */}
          <div className="overflow-y-auto max-h-96 space-y-3">
            {alerts.map((alert, index) => (
              <motion.div
                key={`${alert.vrid}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-yellow-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-yellow-400 font-mono font-bold">
                        VRID: {alert.vrid}
                      </span>
                      <span className="text-red-400 font-bold">
                        €{alert.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>🏢 {alert.company}</span>
                      <span>📊 {alert.invoiceType}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyIndividualAlert(alert, index)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check size={16} />
                        <span className="text-xs">Copiat!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span className="text-xs">Copiază</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <p className="text-yellow-400 text-sm flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span>
                🔍 Verificați aceste VRID-uri pentru posibile erori în procesare sau cursuri incomplete.
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SmallAmountAlertsModal;