import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building, User, Mail, Phone, Calendar, Check, Clock, AlertCircle } from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";

interface Tenant {
  id: number;
  name: string;
  adminEmail: string;
  contactPerson: string;
  contactPhone: string;
  status: 'active' | 'inactive' | 'trial';
  subscriptionId?: string;
  createdAt: string;
  adminUsername?: string;
}

interface CreateTenantForm {
  companyName: string;
  firstName: string;
  lastName: string;
  contactEmail: string;
  contactPhone: string;
}

export default function AdminTenants() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateTenantForm>({
    companyName: '',
    firstName: '',
    lastName: '',
    contactEmail: '',
    contactPhone: ''
  });

  // Query pentru lista tenant-urilor
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ['/api/admin/tenants'],
    retry: 1
  });

  // Mutation pentru creare tenant
  const createTenantMutation = useMutation({
    mutationFn: async (data: CreateTenantForm) => {
      return await apiRequest('POST', '/api/admin/create-tenant', data);
    },
    onSuccess: (response) => {
      toast({
        title: "✅ Tenant creat cu succes",
        description: `Credențialele au fost trimise la ${response.credentials.username}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      setShowCreateForm(false);
      setFormData({
        companyName: '',
        firstName: '',
        lastName: '',
        contactEmail: '',
        contactPhone: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Eroare la creare",
        description: error.message || "Nu s-a putut crea tenant-ul",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTenantMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CreateTenantForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><Check className="w-3 h-3 mr-1" />Activ</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"><AlertCircle className="w-3 h-3 mr-1" />Inactiv</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Administrare <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Tenant-uri</span>
          </h1>
          <p className="text-gray-300 text-lg">Gestionează abonamentele și tenant-urile Transport Pro</p>
        </motion.div>

        {/* Create Tenant Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Creează Tenant Nou
          </Button>
        </motion.div>

        {/* Create Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Creează Tenant Nou
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-gray-200">Numele Companiei</Label>
                    <Input
                      id="companyName"
                      placeholder="Ex: Fast Express S.R.L."
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-200">Prenume</Label>
                    <Input
                      id="firstName"
                      placeholder="Ion"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-200">Nume</Label>
                    <Input
                      id="lastName"
                      placeholder="Popescu"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-gray-200">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="ion@fastexpress.ro"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-gray-200">Telefon</Label>
                    <Input
                      id="contactPhone"
                      placeholder="0740123456"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-4">
                    <Button
                      type="submit"
                      disabled={createTenantMutation.isPending}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {createTenantMutation.isPending ? 'Se creează...' : 'Creează Tenant'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Anulează
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tenants List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Tenant-uri Existente ({tenants?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-gray-300 py-8">Se încarcă...</div>
              ) : !tenants || tenants.length === 0 ? (
                <div className="text-center text-gray-300 py-8">
                  Nu există tenant-uri create încă
                </div>
              ) : (
                <div className="space-y-4">
                  {tenants.map((tenant, index) => (
                    <motion.div
                      key={tenant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{tenant.name}</h3>
                            {getStatusBadge(tenant.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {tenant.contactPerson}
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {tenant.adminEmail}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {tenant.contactPhone}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(tenant.createdAt).toLocaleDateString('ro-RO')}
                            </div>
                          </div>

                          {tenant.adminUsername && (
                            <div className="mt-2 text-xs text-blue-300">
                              Username admin: <code className="bg-white/10 px-2 py-1 rounded">{tenant.adminUsername}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}