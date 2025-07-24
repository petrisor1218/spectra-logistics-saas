import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FileText, Eye, Calendar, Truck, Package, AlertCircle, Loader2 } from "lucide-react";

interface TransportOrder {
  id: number;
  orderNumber: string;
  companyName: string;
  orderDate: string;
  weekLabel: string;
  vrids: string[];
  totalAmount: string;
  route: string;
  status: string;
  createdAt: string;
}

export function TransportOrdersView() {
  const [orders, setOrders] = useState<TransportOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<TransportOrder | null>(null);

  useEffect(() => {
    loadTransportOrders();
  }, []);

  const loadTransportOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transport-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error loading transport orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-400 bg-yellow-400/10';
      case 'sent': return 'text-blue-400 bg-blue-400/10';
      case 'confirmed': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Proiect';
      case 'sent': return 'Trimis';
      case 'confirmed': return 'Confirmat';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="text-gray-300">Se încarcă comenzile de transport...</span>
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
          <Truck className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Comenzi de Transport
            </h2>
            <p className="text-gray-400">Vizualizați și gestionați comenzile de transport generate</p>
          </div>
        </div>
        
        <motion.button
          onClick={loadTransportOrders}
          className="glass-button px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-white/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Package className="w-4 h-4" />
          <span>Reîncarcă</span>
        </motion.button>
      </div>

      {orders.length === 0 ? (
        <motion.div
          className="glass-effect rounded-2xl p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Nu există comenzi de transport
          </h3>
          <p className="text-gray-400">
            Generați comenzi de transport din secțiunea de calcule pentru a le vedea aici.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              className="glass-effect rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-400" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          Comanda #{order.orderNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {order.companyName} • {order.route} • Săptămâna {order.weekLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {order.vrids.length} VRIDs
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        €{parseFloat(order.totalAmount).toFixed(2)}
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="glass-button p-2 rounded-lg hover:bg-white/10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Vezi detalii"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <motion.div
                    className="border-t border-white/10 mt-6 pt-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Informații Comandă</span>
                        </h4>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Data comandă:</span>
                            <span className="text-white">{formatDate(order.orderDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Creat pe:</span>
                            <span className="text-white">{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ruta:</span>
                            <span className="text-white">{order.route}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total:</span>
                            <span className="text-green-400 font-semibold">€{parseFloat(order.totalAmount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span>VRIDs Incluse ({order.vrids.length})</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {order.vrids.map((vrid) => (
                            <div
                              key={vrid}
                              className="bg-white/5 rounded-lg px-2 py-1 text-xs text-gray-300 font-mono"
                            >
                              {vrid}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}