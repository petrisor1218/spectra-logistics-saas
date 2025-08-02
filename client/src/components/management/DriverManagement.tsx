import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Save, X, User, Building, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IsolatedInput } from '@/components/ui/isolated-input';

interface Driver {
  id: number;
  name: string;
  companyId: number | null;
  nameVariants?: string[];
  company?: {
    id: number;
    name: string;
  };
}

interface Company {
  id: number;
  name: string;
}

interface DriverManagementProps {
  loadDriversFromDatabase?: () => Promise<any>;
}

// Mutăm DriverForm în afara componentei principale pentru a preveni re-crearea
const DriverForm = memo(({ data, companies, onChange, onSave, onCancel }: {
  data: Partial<Driver>;
  companies: Company[];
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const generateNameVariants = (name: string) => {
    const cleaned = name.trim().replace(/\s+/g, ' ');
    const variants = [cleaned.toLowerCase()];
    
    const parts = cleaned.split(' ');
    if (parts.length > 1) {
      const reversed = [...parts].reverse();
      variants.push(reversed.join(' ').toLowerCase());
      
      if (parts.length >= 3) {
        const [first, ...rest] = parts;
        const restReversed = [...rest].reverse();
        variants.push(`${first.toLowerCase()} ${restReversed.join(' ').toLowerCase()}`);
        
        const last = parts[parts.length - 1];
        const beforeLast = parts.slice(0, -1).reverse();
        variants.push(`${last.toLowerCase()} ${beforeLast.join(' ').toLowerCase()}`);
      }
    }
    
    return Array.from(new Set(variants));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-6 rounded-xl border border-white/10"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nume Șofer *
          </label>
          <IsolatedInput
            value={data.name || ''}
            onChange={(value) => onChange('name', value)}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
            placeholder="Introduceti numele complet al soferului"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Companie *
          </label>
          <select
            value={data.companyId || ''}
            onChange={(e) => onChange('companyId', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          >
            <option value="" className="bg-gray-800 text-white">Selectați compania</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id} className="bg-gray-800 text-white">
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {data.name && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Variante nume generate automat:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {generateNameVariants(data.name).map((variant, index) => (
              <div key={index} className="bg-white/5 rounded px-2 py-1 text-gray-400 font-mono">
                {variant}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Aceste variante vor fi folosite pentru maparea automată în procesarea fișierelor
          </p>
        </div>
      )}

      <div className="flex space-x-3 mt-6">
        <motion.button
          onClick={onSave}
          disabled={!data.name || !data.companyId}
          className="glass-button bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Save className="w-4 h-4" />
          <span>Salvează</span>
        </motion.button>

        <motion.button
          onClick={onCancel}
          className="glass-button bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-4 py-2 rounded-lg flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <X className="w-4 h-4" />
          <span>Anulează</span>
        </motion.button>
      </div>
    </motion.div>
  );
});

// Adăugăm displayName pentru debugging
DriverForm.displayName = 'DriverForm';

export function DriverManagement({ loadDriversFromDatabase }: DriverManagementProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Driver>>({
    name: '',
    companyId: null,
    nameVariants: []
  });
  const { toast } = useToast();

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await fetch('/api/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca șoferii",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchDrivers(), fetchCompanies()]);
  }, [fetchDrivers, fetchCompanies]);

  const generateNameVariants = useCallback((name: string) => {
    const cleaned = name.trim().replace(/\s+/g, ' ');
    const variants = [cleaned.toLowerCase()];
    
    const parts = cleaned.split(' ');
    if (parts.length > 1) {
      const reversed = [...parts].reverse();
      variants.push(reversed.join(' ').toLowerCase());
      
      if (parts.length >= 3) {
        const [first, ...rest] = parts;
        const restReversed = [...rest].reverse();
        variants.push(`${first.toLowerCase()} ${restReversed.join(' ').toLowerCase()}`);
        
        const last = parts[parts.length - 1];
        const beforeLast = parts.slice(0, -1).reverse();
        variants.push(`${last.toLowerCase()} ${beforeLast.join(' ').toLowerCase()}`);
      }
    }
    
    return Array.from(new Set(variants));
  }, []);

  const handleSave = useCallback(async (driverData: Partial<Driver>) => {
    try {
      console.log('🔄 Salvare șofer - date:', driverData);
      console.log('🏢 Companiile disponibile în handleSave:', companies.length, companies.map(c => `${c.name} (ID: ${c.id})`));
      
      const variants = driverData.name ? generateNameVariants(driverData.name) : [];
      const dataToSave = {
        ...driverData,
        nameVariants: variants
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/drivers/${editingId}` : '/api/drivers';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });

      if (response.ok) {
        console.log('✅ Șofer salvat cu succes, resetez formularul...');
        await fetchDrivers();
        setEditingId(null);
        setShowAddForm(false);
        setFormData({
          name: '',
          companyId: null,
          nameVariants: []
        });
        console.log('🔄 Stare resetată pentru următorul șofer');
        toast({
          title: "Succes",
          description: editingId ? "Șoferul a fost actualizat" : "Șoferul a fost adăugat",
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving driver:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut salva șoferul",
        variant: "destructive"
      });
    }
  }, [editingId, fetchDrivers, generateNameVariants, toast, companies]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Sigur doriți să ștergeți acest șofer?')) return;
    
    try {
      const response = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchDrivers();
        toast({
          title: "Succes",
          description: "Șoferul a fost șters",
        });
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge șoferul",
        variant: "destructive"
      });
    }
  }, [fetchDrivers, toast]);

  const startEdit = useCallback((driver: Driver) => {
    setEditingId(driver.id);
    setFormData({
      name: driver.name,
      companyId: driver.companyId,
      nameVariants: driver.nameVariants || []
    });
    setShowAddForm(false);
  }, []);

  // Stabilizăm callback-urile pentru a preveni re-render-ul
  const handleFormChange = useCallback((field: string, value: any) => {
    console.log(`📝 Schimbare în formular: ${field} = ${value}`);
    if (field === 'companyId') {
      console.log('🏢 Compania selectată:', value, companies.find(c => c.id === parseInt(value))?.name);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [companies]);

  const handleSaveForm = useCallback(() => {
    handleSave(formData);
  }, [formData, handleSave]);

  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false);
    setFormData({
      name: '',
      companyId: null,
      nameVariants: []
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setFormData({
      name: '',
      companyId: null,
      nameVariants: []
    });
  }, []);

  const handleStartAdd = useCallback(() => {
    console.log('🆕 Începe adăugarea unui șofer nou');
    console.log('🏢 Companiile disponibile la start:', companies.length, companies.map(c => `${c.name} (ID: ${c.id})`));
    setShowAddForm(true);
    setEditingId(null);
    setFormData({
      name: '',
      companyId: null,
      nameVariants: []
    });
  }, [companies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <User className="w-6 h-6" />
          <span>Gestionare Șoferi</span>
        </h2>

        <div className="flex items-center space-x-3">
          {loadDriversFromDatabase && (
            <motion.button
              onClick={async () => {
                await loadDriversFromDatabase();
                toast({
                  title: "Succes",
                  description: "Mappingul șoferilor a fost reîmprospătat cu auto-mapare activată",
                  variant: "default"
                });
              }}
              className="glass-button bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-lg flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reîmprospătează cu Auto-Mapare</span>
            </motion.button>
          )}
          
          <motion.button
            onClick={handleStartAdd}
            className="glass-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg flex items-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>Adaugă Șofer</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showAddForm && (
          <DriverForm
            key="add-form"
            data={formData}
            companies={companies}
            onChange={handleFormChange}
            onSave={handleSaveForm}
            onCancel={handleCancelAdd}
          />
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {drivers.map((driver) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-xl border border-white/10"
          >
            {editingId === driver.id ? (
              <DriverForm
                key={`edit-form-${driver.id}`}
                data={formData}
                companies={companies}
                onChange={handleFormChange}
                onSave={handleSaveForm}
                onCancel={handleCancelEdit}
              />
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>{driver.name}</span>
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Building className="w-4 h-4" />
                      <span>{driver.company?.name || 'Fără companie'}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() => startEdit(driver)}
                      className="glass-button p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-400"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Editează"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      onClick={() => handleDelete(driver.id)}
                      className="glass-button p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Șterge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Variante nume pentru preview */}
                {driver.nameVariants && driver.nameVariants.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Variante nume:</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {driver.nameVariants.map((variant, index) => (
                        <div key={index} className="bg-white/5 rounded px-2 py-1 text-gray-400 font-mono">
                          {variant}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {drivers.length === 0 && (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">Nu sunt șoferi înregistrați</p>
          <p className="text-gray-500 text-sm mt-2">Adăugați primul șofer pentru a începe</p>
        </div>
      )}
    </div>
  );
}