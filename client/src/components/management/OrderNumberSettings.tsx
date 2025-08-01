import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Hash, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IsolatedInput } from '@/components/ui/isolated-input';

interface OrderSequence {
  id: number;
  currentNumber: number;
  lastUpdated: string;
}

export function OrderNumberSettings() {
  const [orderSequence, setOrderSequence] = useState<OrderSequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const { toast } = useToast();

  const fetchOrderSequence = useCallback(async () => {
    try {
      const response = await fetch('/api/order-sequence');
      if (response.ok) {
        const data = await response.json();
        setOrderSequence(data);
        setNewNumber(data.currentNumber.toString());
      }
    } catch (error) {
      console.error('Error fetching order sequence:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca setările numerelor de comenzi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrderSequence();
  }, [fetchOrderSequence]);

  const handleSave = useCallback(async () => {
    if (!newNumber || parseInt(newNumber) < 1) {
      toast({
        title: "Eroare",
        description: "Numărul de comandă trebuie să fie mai mare decât 0",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/order-sequence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentNumber: parseInt(newNumber) })
      });

      if (response.ok) {
        await fetchOrderSequence();
        toast({
          title: "Succes",
          description: "Numărul curent de comandă a fost actualizat",
        });
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating order sequence:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza numărul de comandă",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [newNumber, fetchOrderSequence, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl border border-white/10"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Settings className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Setări Numerotare Comenzi</h3>
          <p className="text-sm text-gray-400">Gestionare număr curent pentru comenzile de transport</p>
        </div>
      </div>

      {orderSequence && (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Informații despre numerotare:</p>
                <ul className="space-y-1 text-blue-300">
                  <li>• Numerele de comenzi sunt globale pentru toate companiile</li>
                  <li>• Următoarea comandă va avea numărul: <span className="font-mono font-bold">{orderSequence.currentNumber}</span></li>
                  <li>• Ultima actualizare: {new Date(orderSequence.lastUpdated).toLocaleString('ro-RO')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                Număr Curent Comandă
              </label>
              <IsolatedInput
                type="number"
                value={newNumber}
                onChange={setNewNumber}
                className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
                placeholder="1554"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Următoarea comandă creată va avea acest număr
              </p>
            </div>

            <div className="flex items-end">
              <motion.button
                onClick={handleSave}
                disabled={saving || newNumber === orderSequence.currentNumber.toString()}
                className="glass-button bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Se salvează...' : 'Actualizează Numărul'}</span>
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}