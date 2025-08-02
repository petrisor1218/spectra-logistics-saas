import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { X, FileText, Calendar, Hash, MapPin, Euro, Send, Save } from "lucide-react";

interface TransportOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: string;
  processedData: any;
  selectedWeek: string;
}

export function TransportOrderModal({
  isOpen,
  onClose,
  company,
  processedData,
  selectedWeek
}: TransportOrderModalProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [route, setRoute] = useState('DE-BE-NL');
  const [loading, setLoading] = useState(false);
  const [mainCompany, setMainCompany] = useState<any>(null);

  // Load auto-generated order number, suggested date, and main company when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load next order number
      fetch('/api/next-order-number')
        .then(res => res.json())
        .then(data => setOrderNumber(data.orderNumber.toString()))
        .catch(err => console.error('Error loading order number:', err));
      
      // Load main company
      fetch('/api/main-company')
        .then(res => res.json())
        .then(data => setMainCompany(data))
        .catch(err => console.error('Error loading main company:', err));
      
      // Calculate suggested date from week label
      if (selectedWeek) {
        const dateParts = selectedWeek.split(' - ');
        if (dateParts.length >= 1) {
          // Extract start date from week label like "20 iul. - 26 iul."
          const startDateStr = dateParts[0].trim();
          try {
            // Convert Romanian month names to dates
            const months = {
              'ian.': '01', 'feb.': '02', 'mar.': '03', 'apr.': '04',
              'mai': '05', 'iun.': '06', 'iul.': '07', 'aug.': '08',
              'sep.': '09', 'oct.': '10', 'noi.': '11', 'dec.': '12'
            };
            
            const parts = startDateStr.split(' ');
            if (parts.length >= 2) {
              const day = parts[0].padStart(2, '0');
              const monthKey = parts[1] as keyof typeof months;
              const month = months[monthKey];
              const year = new Date().getFullYear();
              
              if (month) {
                const suggestedDate = `${year}-${month}-${day}`;
                setOrderDate(suggestedDate);
              } else {
                setOrderDate(new Date().toISOString().split('T')[0]);
              }
            } else {
              setOrderDate(new Date().toISOString().split('T')[0]);
            }
          } catch (error) {
            console.error('Error parsing week date:', error);
            setOrderDate(new Date().toISOString().split('T')[0]);
          }
        } else {
          setOrderDate(new Date().toISOString().split('T')[0]);
        }
      } else {
        setOrderDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, selectedWeek]);

  if (!isOpen) return null;

  const companyData = processedData[company];
  if (!companyData) return null;

  // Get all VRIDs that have any value (7_days or 30_days) for this company
  const allVrids = Object.keys(companyData.VRID_details || {});
  
  // Also check if there are any VRIDs from other companies that should be included
  // This is a fallback to include more VRIDs if needed
  const additionalVrids: string[] = [];
  
  // Check all companies for VRIDs that might belong to this company but weren't included
  Object.values(processedData).forEach((otherCompanyData: any) => {
    if (otherCompanyData && otherCompanyData.VRID_details) {
      Object.keys(otherCompanyData.VRID_details).forEach((vrid: string) => {
        // Add logic here if you want to include VRIDs from other processing
        // For now, we stick to the company's own VRIDs
      });
    }
  });

  const vrids = [...allVrids, ...additionalVrids];
  const totalAmount = companyData.Total_7_days + companyData.Total_30_days - companyData.Total_comision;

  const handleGenerateOrder = async () => {
    if (!orderNumber.trim()) {
      alert('Vă rugăm să introduceți numărul comenzii');
      return;
    }

    setLoading(true);
    try {
      // Save transport order to database
      const response = await fetch('/api/transport-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          companyName: mainCompany?.name || company, // Use main company name if available
          orderDate: new Date(orderDate).toISOString(),
          weekLabel: selectedWeek,
          vrids: vrids,
          totalAmount: totalAmount.toFixed(2),
          route: route,
          status: 'draft'
        }),
      });

      if (response.ok) {
        alert('Comanda de transport a fost salvată cu succes!');
        onClose();
      } else {
        throw new Error('Failed to save transport order');
      }
    } catch (error) {
      console.error('Error saving transport order:', error);
      alert('Eroare la salvarea comenzii de transport');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        className="glass-effect rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                Comandă de Transport
              </h2>
              <p className="text-gray-400">{mainCompany?.name || company}</p>
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

        <div className="space-y-6">
          {/* Order Details */}
          <div className="glass-effect rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Hash className="w-5 h-5" />
              <span>Detalii Comandă</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Număr Comandă *
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                  placeholder="Ex: ORD-2024-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data Comandă
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ruta
                </label>
                <input
                  type="text"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                  placeholder="Ex: DE-BE-NL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Săptămâna
                </label>
                <input
                  type="text"
                  value={selectedWeek}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Transport Details */}
          <div className="glass-effect rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Detalii Transport</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-300 mb-2">VRID-uri ({vrids.length})</h4>
                <div className="bg-white/5 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {vrids.map((vrid) => (
                    <div key={vrid} className="text-sm text-gray-300 py-1">
                      {vrid}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Sumar Financiar</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">7 zile:</span>
                    <span className="text-white">€{companyData.Total_7_days.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">30 zile:</span>
                    <span className="text-white">€{companyData.Total_30_days.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Comision:</span>
                    <span className="text-red-400">-€{companyData.Total_comision.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/20 pt-2">
                    <span className="text-gray-300 font-medium">Total:</span>
                    <span className="text-green-400 font-semibold">€{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <motion.button
              onClick={onClose}
              className="glass-button px-6 py-3 rounded-xl hover:bg-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Anulează
            </motion.button>
            
            <motion.button
              onClick={handleGenerateOrder}
              disabled={loading || !orderNumber.trim()}
              className="gradient-primary px-6 py-3 rounded-xl text-white font-medium hover-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Se salvează...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvează Comanda</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}