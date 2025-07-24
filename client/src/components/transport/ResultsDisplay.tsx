import { motion } from "framer-motion";
import { Building, DollarSign, Check, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsDisplayProps {
  processedData: any;
  payments: any;
  paymentHistory: any[];
  recordPayment: (company: string, amount: number, description?: string) => void;
  getRemainingPayment: (company: string) => number;
}

export function ResultsDisplay({
  processedData,
  payments,
  paymentHistory,
  recordPayment,
  getRemainingPayment
}: ResultsDisplayProps) {
  const companies = Object.keys(processedData);

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
                  <div>
                    <h4 className="font-medium text-white">{company}</h4>
                    <p className="text-gray-400 text-sm">{driversCount} șoferi</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">€{totalAmount.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">Comision {commissionRate}</p>
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
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">€{payment.amount}</p>
                  <p className="text-gray-400 text-sm">Completed</p>
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
              onClick={() => {
                const company = companies[0];
                const remaining = getRemainingPayment(company);
                if (remaining > 0) {
                  recordPayment(company, remaining, "Plată automată");
                }
              }}
              className="w-full gradient-primary hover-glow"
              disabled={companies.length === 0}
            >
              <Plus className="mr-2" size={16} />
              Înregistrează Plată
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
