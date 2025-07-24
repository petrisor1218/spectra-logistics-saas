import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Calculator } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: string;
  totalAmount: number;
  sevenDaysAmount: number;
  thirtyDaysAmount: number;
  commission: number;
  onConfirmPayment: (amount: number, description: string, type: 'partial' | 'full') => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  company,
  totalAmount,
  sevenDaysAmount,
  thirtyDaysAmount,
  commission,
  onConfirmPayment
}: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [paymentType, setPaymentType] = useState<'7days' | '30days' | 'custom' | 'full'>('7days');

  const handlePaymentTypeChange = (type: '7days' | '30days' | 'custom' | 'full') => {
    setPaymentType(type);
    switch (type) {
      case '7days':
        setPaymentAmount(sevenDaysAmount);
        setDescription('Plată facturi 7 zile');
        break;
      case '30days':
        setPaymentAmount(thirtyDaysAmount);
        setDescription('Plată facturi 30 zile');
        break;
      case 'full':
        setPaymentAmount(totalAmount);
        setDescription('Plată completă');
        break;
      case 'custom':
        setPaymentAmount(0);
        setDescription('Plată parțială personalizată');
        break;
    }
  };

  const handleConfirm = () => {
    if (paymentAmount > 0 && paymentAmount <= totalAmount) {
      const type = paymentAmount === totalAmount ? 'full' : 'partial';
      onConfirmPayment(paymentAmount, description, type);
      onClose();
      setPaymentAmount(0);
      setDescription('');
      setPaymentType('7days');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="glass-effect rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                  <DollarSign className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Înregistrează Plată</h3>
                  <p className="text-gray-400">{company}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <h4 className="text-white font-medium mb-3">Detalii Plată</h4>
              <div className="space-y-2 text-sm">
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
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-white">Total de plată:</span>
                    <span className="text-white">€{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Type Selection */}
            <div className="mb-6">
              <Label className="text-white font-medium mb-3 block">Tipul Plății</Label>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePaymentTypeChange('7days')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    paymentType === '7days'
                      ? 'border-green-500 bg-green-500/20 text-green-300'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Doar 7 zile
                  <div className="text-xs mt-1">€{sevenDaysAmount.toFixed(2)}</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePaymentTypeChange('30days')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    paymentType === '30days'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Doar 30 zile
                  <div className="text-xs mt-1">€{thirtyDaysAmount.toFixed(2)}</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePaymentTypeChange('full')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    paymentType === 'full'
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Plată totală
                  <div className="text-xs mt-1">€{totalAmount.toFixed(2)}</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePaymentTypeChange('custom')}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    paymentType === 'custom'
                      ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  Sumă custom
                  <div className="text-xs mt-1">Personalizată</div>
                </motion.button>
              </div>
            </div>

            {/* Payment Amount Input */}
            <div className="mb-4">
              <Label htmlFor="amount" className="text-white font-medium mb-2 block">
                Suma de Plată (€)
              </Label>
              <div className="relative">
                <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  max={totalAmount}
                  min={0}
                  step="0.01"
                  className="pl-10 bg-gray-800 border-gray-600 text-white focus:border-primary"
                  placeholder="0.00"
                />
              </div>
              {paymentAmount > totalAmount && (
                <p className="text-red-400 text-xs mt-1">Suma nu poate fi mai mare decât totalul de plată</p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <Label htmlFor="description" className="text-white font-medium mb-2 block">
                Descriere Plată
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white focus:border-primary"
                placeholder="Detalii despre plată..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Anulează
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={paymentAmount <= 0 || paymentAmount > totalAmount}
                className="flex-1 gradient-primary hover-glow disabled:opacity-50"
              >
                Confirmă Plata
              </Button>
            </div>

            {/* Remaining Amount Info */}
            {paymentAmount > 0 && paymentAmount < totalAmount && (
              <motion.div 
                className="mt-4 bg-blue-500/20 border border-blue-500/30 rounded-lg p-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-blue-300 text-sm">
                  Restul de plată: <strong>€{(totalAmount - paymentAmount).toFixed(2)}</strong>
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}