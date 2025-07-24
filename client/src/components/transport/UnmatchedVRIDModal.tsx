import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { X, AlertTriangle, ArrowRight, Building2, Save } from "lucide-react";

interface UnmatchedVRIDModalProps {
  isOpen: boolean;
  onClose: () => void;
  processedData: any;
  onAssignVRID: (vrid: string, fromCompany: string, toCompany: string) => void;
}

export function UnmatchedVRIDModal({
  isOpen,
  onClose,
  processedData,
  onAssignVRID
}: UnmatchedVRIDModalProps) {
  const [selectedVRID, setSelectedVRID] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [unmatchedVRIDs, setUnmatchedVRIDs] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && processedData?.Unmatched?.VRID_details) {
      const vrids = Object.entries(processedData.Unmatched.VRID_details).map(([vrid, details]: [string, any]) => ({
        vrid,
        details
      }));
      setUnmatchedVRIDs(vrids);
    }
  }, [isOpen, processedData]);

  if (!isOpen) return null;

  const companies = Object.keys(processedData || {}).filter(company => company !== 'Unmatched');

  const handleAssign = () => {
    if (selectedVRID && selectedCompany) {
      onAssignVRID(selectedVRID, 'Unmatched', selectedCompany);
      setSelectedVRID('');
      setSelectedCompany('');
      
      // Update local state
      setUnmatchedVRIDs(prev => prev.filter(item => item.vrid !== selectedVRID));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        className="glass-effect rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                VRID-uri Neîmperecheate
              </h2>
              <p className="text-gray-400">
                Asignați VRID-urile care nu au fost găsite în datele TRIP
              </p>
            </div>
          </div>
          
          <motion.button
            onClick={onClose}
            className="glass-button p-2 rounded-xl hover:bg-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {unmatchedVRIDs.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Building2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Excelent! Toate VRID-urile sunt împerecheate
            </h3>
            <p className="text-gray-400">
              Nu există VRID-uri neîmperecheate care să necesite asignare manuală.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* VRID List */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                VRID-uri Neîmperecheate ({unmatchedVRIDs.length})
              </h3>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {unmatchedVRIDs.map((item, index) => {
                  const total = item.details['7_days'] + item.details['30_days'] - item.details.commission;
                  
                  return (
                    <motion.div
                      key={item.vrid}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedVRID === item.vrid
                          ? 'border-blue-400 bg-blue-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedVRID(item.vrid)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-white">{item.vrid}</h4>
                          <div className="flex space-x-4 mt-1 text-xs">
                            <span className="text-green-400">7z: €{item.details['7_days'].toFixed(2)}</span>
                            <span className="text-blue-400">30z: €{item.details['30_days'].toFixed(2)}</span>
                            <span className="text-red-400">Com: €{item.details.commission.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-yellow-400">
                            €{total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Assignment Panel */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Asignare la Companie
              </h3>
              
              {selectedVRID ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      VRID Selectat
                    </label>
                    <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-3">
                      <span className="text-white font-medium">{selectedVRID}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Selectați Compania *
                    </label>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                    >
                      <option value="" className="bg-gray-800 text-gray-300">
                        Alegeți o companie...
                      </option>
                      {companies.map(company => (
                        <option key={company} value={company} className="bg-gray-800 text-white">
                          {company}
                        </option>
                      ))}
                    </select>
                  </div>

                  <motion.button
                    onClick={handleAssign}
                    disabled={!selectedCompany}
                    className="w-full gradient-primary px-6 py-3 rounded-xl text-white font-medium hover-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    whileHover={{ scale: selectedCompany ? 1.05 : 1 }}
                    whileTap={{ scale: selectedCompany ? 0.95 : 1 }}
                  >
                    <Save className="w-4 h-4" />
                    <span>Asignează VRID-ul</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Selectați un VRID din lista de mai sus pentru a-l asigna unei companii</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <motion.button
            onClick={onClose}
            className="glass-button px-6 py-3 rounded-xl hover:bg-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Închide
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}