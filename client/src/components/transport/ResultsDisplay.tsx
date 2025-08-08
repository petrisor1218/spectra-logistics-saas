import { motion } from "framer-motion";
import { Building, DollarSign, Check, Clock, Plus, Trash2, Truck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "./PaymentModal";
import { TransportOrderModal } from "./TransportOrderModal";
import { useState } from "react";

interface ResultsDisplayProps {
  processedData: any;
  payments: any;
  paymentHistory: any[];
  recordPayment: (company: string, amount: number, description?: string) => void;
  deletePayment: (paymentId: number) => void;
  getRemainingPayment: (company: string) => number;
  selectedWeek: string;
}

export function ResultsDisplay({
  processedData,
  payments,
  paymentHistory,
  recordPayment,
  deletePayment,
  getRemainingPayment,
  selectedWeek
}: ResultsDisplayProps) {
  // Filter out "Unmatched" from companies list for payments view
  const companies = Object.keys(processedData).filter(company => company !== 'Unmatched');
  
  // Debug log
  console.log('ResultsDisplay - processedData:', processedData);
  console.log('ResultsDisplay - companies (filtered):', companies);
  
  if (!processedData || Object.keys(processedData).length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>Nu există date procesate pentru afișare</p>
      </div>
    );
  }
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransportOrderModal, setShowTransportOrderModal] = useState(false);

  const openPaymentModal = (company: string) => {
    setSelectedCompany(company);
    setShowPaymentModal(true);
  };

  const openTransportOrderModal = (company: string) => {
    setSelectedCompany(company);
    setShowTransportOrderModal(true);
  };

  const handleConfirmPayment = (amount: number, description: string, type: 'partial' | 'full') => {
    if (selectedCompany) {
      recordPayment(selectedCompany, amount, description);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Company Breakdown */}
      <motion.div 
        className="glass-effect rounded-2xl p-8"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Breakdown pe Companii</h3>
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Building className="text-white" size={20} />
          </div>
        </div>

        <div className="space-y-4">
          {companies.map((company, index) => {
            const data = processedData[company];
            const totalAmount = data.Total_7_days + data.Total_30_days - data.Total_comision;
            const driversCount = Object.keys(data.VRID_details || {}).length;
            const commissionRate = company === "Fast Express" ? "2%" : "4%";

            return (
              <motion.div
                key={company}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="data-card rounded-xl p-4"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{company}</h4>
                    <p className="text-gray-400 text-sm">{driversCount} șoferi</p>
                    <div className="flex space-x-4 mt-1 text-xs">
                      <span className="text-green-400">7z: €{data.Total_7_days.toFixed(0)}</span>
                      <span className="text-blue-400">30z: €{data.Total_30_days.toFixed(0)}</span>
                      <span className="text-red-400">Com: €{data.Total_comision.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">€{totalAmount.toFixed(2)}</p>
                      <p className="text-gray-400 text-sm">Comision {commissionRate}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openPaymentModal(company)}
                        className="px-3 py-2 gradient-primary rounded-lg text-white text-sm font-medium hover-glow"
                      >
                        Plătește
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openTransportOrderModal(company)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium border-2 border-blue-400"
                        title="Generează comandă de transport"
                      >
                        <Truck className="w-4 h-4" />
                        <span className="ml-1 text-xs">Comandă</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Payment Management */}
      <motion.div 
        className="glass-effect rounded-2xl p-8"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Evidența Plăților</h3>
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <DollarSign className="text-white" size={20} />
          </div>
        </div>

        <div className="space-y-4">
          {paymentHistory.slice(0, 5).map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="data-card rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="text-white" size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{payment.company}</p>
                    <p className="text-gray-400 text-sm">{payment.date}</p>
                    {payment.description && (
                      <p className="text-gray-500 text-xs">{payment.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-bold text-green-400">€{payment.amount}</p>
                    <p className="text-gray-400 text-sm">Completed</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deletePayment(payment.id)}
                    className="w-8 h-8 bg-red-500/20 hover:bg-red-500 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="text-red-400 hover:text-white" size={14} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}

          {paymentHistory.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nu există plăți înregistrate încă</p>
            </div>
          )}
        </div>

        {companies.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6"
          >
            <Button
              onClick={() => openPaymentModal(companies[0])}
              className="w-full gradient-primary hover-glow"
              disabled={companies.length === 0}
            >
              <Plus className="mr-2" size={16} />
              Înregistrează Plată
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Payment Modal */}
      {selectedCompany && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
          totalAmount={
            processedData[selectedCompany]?.Total_7_days + 
            processedData[selectedCompany]?.Total_30_days - 
            processedData[selectedCompany]?.Total_comision || 0
          }
          sevenDaysAmount={processedData[selectedCompany]?.Total_7_days || 0}
          thirtyDaysAmount={processedData[selectedCompany]?.Total_30_days || 0}
          commission={processedData[selectedCompany]?.Total_comision || 0}
          alreadyPaid={payments[selectedCompany] || 0}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* Transport Order Modal */}
      {selectedCompany && (
        <TransportOrderModal
          isOpen={showTransportOrderModal}
          onClose={() => {
            setShowTransportOrderModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
          processedData={processedData}
          selectedWeek={selectedWeek}
        />
      )}
    </div>
  );
}
