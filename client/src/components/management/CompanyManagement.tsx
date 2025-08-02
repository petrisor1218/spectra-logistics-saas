import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Save, X, Building, Phone, MapPin, CreditCard, Trash2, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IsolatedInput } from '@/components/ui/isolated-input';

interface Company {
  id: number;
  name: string;
  commissionRate: string;
  cif?: string;
  tradeRegisterNumber?: string;
  address?: string;
  location?: string;
  county?: string;
  country?: string;
  contact?: string;
}

// Mutăm CompanyForm în afara componentei principale pentru a preveni re-crearea
const CompanyForm = memo(({ data, onChange, onSave, onCancel }: {
  data: Partial<Company>;
  onChange: (field: string, value: string | number) => void;
  onSave: () => void;
  onCancel: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="glass-card p-6 rounded-xl border border-white/10"
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nume Companie *
        </label>
        <IsolatedInput
          value={data.name || ''}
          onChange={(value) => onChange('name', value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          placeholder="Introduceti numele companiei"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Rata comision (decimal) *
        </label>
        <IsolatedInput
          type="number"
          step="0.0001"
          value={data.commissionRate || ''}
          onChange={(value) => onChange('commissionRate', value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          placeholder="0.04"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          CIF
        </label>
        <IsolatedInput
          value={data.cif || ''}
          onChange={(value) => onChange('cif', value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          placeholder="RO12345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nr. Registrul Comerțului
        </label>
        <IsolatedInput
          value={data.tradeRegisterNumber || ''}
          onChange={(value) => onChange('tradeRegisterNumber', value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          placeholder="J40/1234/2020"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Adresă
        </label>
        <IsolatedInput
          value={data.address || ''}
          onChange={(value) => onChange('address', value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          placeholder="Str. Exemplu, Nr. 1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Localitate
        </label>
        <IsolatedInput
          value={data.location || ''}
          onChange={(value) => onChange('location', value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          placeholder="București"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Județ
        </label>
        <IsolatedInput
          value={data.county || ''}
          onChange={(value) => onChange('county', value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          placeholder="București"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Țară
        </label>
        <IsolatedInput
          value={data.country || ''}
          onChange={(value) => onChange('country', value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          placeholder="Romania"
        />
      </div>



      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Contact
        </label>
        <IsolatedInput
          value={data.contact || ''}
          onChange={(value) => onChange('contact', value)}
          className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
          placeholder="+40 123 456 789, email@company.com"
        />
      </div>
    </div>

    <div className="flex space-x-3 mt-6">
      <motion.button
        onClick={onSave}
        disabled={!data.name || !data.commissionRate}
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
));

// Adăugăm displayName pentru debugging
CompanyForm.displayName = 'CompanyForm';

export function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    commissionRate: '0.04',
    cif: '',
    tradeRegisterNumber: '',
    address: '',
    location: '',
    county: '',
    country: 'Romania',
    contact: ''
  });
  const { toast } = useToast();

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`🏢 API returned ${data.length} companies:`, data.map(c => `${c.name} (ID: ${c.id}) ${c.isMainCompany ? '[MAIN]' : '[TRANSPORT]'}`));
        
        // Filter out main company and remove duplicates
        const filteredCompanies = data.filter((company: any) => !company.isMainCompany);
        
        const uniqueCompanies = filteredCompanies.reduce((acc: any[], current: any) => {
          const existsById = acc.find(item => item.id === current.id);
          const existsByName = acc.find(item => item.name === current.name && item.id !== current.id);
          
          if (!existsById && !existsByName) {
            acc.push(current);
          } else {
            console.log(`🚫 Skipping duplicate company: ${current.name} (ID: ${current.id})`);
          }
          return acc;
        }, []);
        
        console.log(`✅ Setting ${uniqueCompanies.length} transport companies in state (excluding main company)`);
        setCompanies(uniqueCompanies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca companiile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSave = useCallback(async (companyData: Partial<Company>) => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/companies/${editingId}` : '/api/companies';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });

      if (response.ok) {
        await fetchCompanies();
        setEditingId(null);
        setShowAddForm(false);
        setFormData({
          name: '',
          commissionRate: '0.04',
          cif: '',
          tradeRegisterNumber: '',
          address: '',
          location: '',
          county: '',
          country: 'Romania',
          contact: ''
        });
        toast({
          title: "Succes",
          description: editingId ? "Compania a fost actualizată" : "Compania a fost adăugată",
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut salva compania",
        variant: "destructive"
      });
    }
  }, [editingId, fetchCompanies, toast]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Sigur doriți să ștergeți această companie?')) return;
    
    try {
      const response = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchCompanies();
        toast({
          title: "Succes",
          description: "Compania a fost ștearsă",
        });
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge compania",
        variant: "destructive"
      });
    }
  }, [fetchCompanies, toast]);

  const startEdit = useCallback((company: Company) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      commissionRate: company.commissionRate,
      cif: company.cif || '',
      tradeRegisterNumber: company.tradeRegisterNumber || '',
      address: company.address || '',
      location: company.location || '',
      county: company.county || '',
      country: company.country || 'Romania',
      contact: company.contact || ''
    });
    setShowAddForm(false);
  }, []);

  // Stabilizăm callback-urile pentru a preveni re-render-ul
  const handleFormChange = useCallback((field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveForm = useCallback(() => {
    handleSave(formData);
  }, [formData, handleSave]);

  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false);
    setFormData({
      name: '',
      commissionRate: '0.04',
      cif: '',
      tradeRegisterNumber: '',
      address: '',
      location: '',
      county: '',
      country: 'Romania',
      contact: ''
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setFormData({
      name: '',
      commissionRate: '0.04',
      cif: '',
      tradeRegisterNumber: '',
      address: '',
      location: '',
      county: '',
      country: 'Romania',
      contact: ''
    });
  }, []);

  const handleStartAdd = useCallback(() => {
    setShowAddForm(true);
    setEditingId(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // Add debugging info for companies
  console.log(`🎯 CompanyManagement render: ${companies.length} companies in state`);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Building className="w-6 h-6" />
          <span>Companii Transport ({companies.length})</span>
        </h2>

        <motion.button
          onClick={handleStartAdd}
          className="glass-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          <span>Adaugă Companie Transport</span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {showAddForm && (
          <CompanyForm
            key="add-form"
            data={formData}
            onChange={handleFormChange}
            onSave={handleSaveForm}
            onCancel={handleCancelAdd}
          />
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {companies.map((company, index) => (
          <motion.div
            key={`company-${company.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-xl border border-white/10"
          >
            {editingId === company.id ? (
              <CompanyForm
                key={`edit-form-${company.id}`}
                data={formData}
                onChange={handleFormChange}
                onSave={handleSaveForm}
                onCancel={handleCancelEdit}
              />
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center space-x-2">
                      <Building className="w-5 h-5" />
                      <span>{company.name}</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Comision: {(parseFloat(company.commissionRate) * 100).toFixed(2)}%</span>
                      </div>
                      {company.cif && (
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4" />
                          <span>CIF: {company.cif}</span>
                        </div>
                      )}
                      {company.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{company.location}, {company.county}</span>
                        </div>
                      )}
                      {company.contact && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{company.contact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() => startEdit(company)}
                      className="glass-button p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-400"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Editează"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      onClick={() => handleDelete(company.id)}
                      className="glass-button p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Șterge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-8">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">Nu sunt companii înregistrate</p>
          <p className="text-gray-500 text-sm mt-2">Adăugați prima companie pentru a începe</p>
        </div>
      )}
    </div>
  );
}