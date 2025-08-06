import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Save, X, Building, Phone, MapPin, CreditCard, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
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
  };

  const handleSave = async (companyData: Partial<Company>) => {
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
  };

  const handleDelete = async (id: number) => {
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
  };

  const startEdit = (company: Company) => {
    setEditingId(company.id);
    setFormData(company);
    setShowAddForm(false);
  };

  const CompanyForm = ({ data, onChange, onSave, onCancel }: {
    data: Partial<Company>;
    onChange: (field: string, value: string) => void;
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
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
            placeholder="Introduceti numele companiei"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rata comision (decimal) *
          </label>
          <input
            type="number"
            step="0.0001"
            value={data.commissionRate || ''}
            onChange={(e) => onChange('commissionRate', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
            placeholder="0.04"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CIF
          </label>
          <input
            type="text"
            value={data.cif || ''}
            onChange={(e) => onChange('cif', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
            placeholder="RO12345678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nr. Registrul Comerțului
          </label>
          <input
            type="text"
            value={data.tradeRegisterNumber || ''}
            onChange={(e) => onChange('tradeRegisterNumber', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
            placeholder="J40/1234/2020"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Adresă
          </label>
          <input
            type="text"
            value={data.address || ''}
            onChange={(e) => onChange('address', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
            placeholder="Str. Exemplu, Nr. 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Localitate
          </label>
          <input
            type="text"
            value={data.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
            placeholder="București"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Județ
          </label>
          <input
            type="text"
            value={data.county || ''}
            onChange={(e) => onChange('county', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
            placeholder="București"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Țară
          </label>
          <input
            type="text"
            value={data.country || ''}
            onChange={(e) => onChange('country', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
            placeholder="România"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contact
          </label>
          <input
            type="text"
            value={data.contact || ''}
            onChange={(e) => onChange('contact', e.target.value)}
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
  );

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
          <Building className="w-6 h-6" />
          <span>Gestionare Companii</span>
        </h2>

        <motion.button
          onClick={() => setShowAddForm(true)}
          className="glass-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          <span>Adaugă Companie</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <CompanyForm
            data={formData}
            onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
            onSave={() => handleSave(formData)}
            onCancel={() => {
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
            }}
          />
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {companies.map((company) => (
          <motion.div
            key={company.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-xl border border-white/10"
          >
            {editingId === company.id ? (
              <CompanyForm
                data={formData}
                onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                onSave={() => handleSave(formData)}
                onCancel={() => {
                  setEditingId(null);
                  setFormData({});
                }}
              />
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center space-x-2">
                      <Building className="w-5 h-5" />
                      <span>{company.name}</span>
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <CreditCard className="w-4 h-4" />
                        <span>Comision: {(parseFloat(company.commissionRate) * 100).toFixed(2)}%</span>
                      </div>
                      {company.cif && (
                        <span>CIF: {company.cif}</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {company.tradeRegisterNumber && (
                    <div className="text-gray-300">
                      <strong>Reg. Com.:</strong> {company.tradeRegisterNumber}
                    </div>
                  )}
                  {company.location && (
                    <div className="text-gray-300 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{company.location}{company.county ? `, ${company.county}` : ''}</span>
                    </div>
                  )}
                  {company.contact && (
                    <div className="text-gray-300 flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{company.contact}</span>
                    </div>
                  )}
                  {company.address && (
                    <div className="text-gray-300 md:col-span-2 lg:col-span-3">
                      <strong>Adresă:</strong> {company.address}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Nu sunt companii înregistrate</p>
          <p className="text-gray-500 text-sm">Adăugați prima companie pentru a începe</p>
        </div>
      )}
    </div>
  );
}