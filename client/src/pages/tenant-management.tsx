import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Building, Users, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface Tenant {
  id: number;
  name: string;
  description?: string;
  status: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  subscriptionPlan: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  tenants: Tenant[];
}

export default function TenantManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
    subscriptionPlan: "professional"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenant statistics
  const { data: stats, isLoading } = useQuery<TenantStats>({
    queryKey: ['/api/admin/tenant-stats'],
  });

  // Fetch all tenants
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ['/api/admin/tenants'],
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant-stats'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "✅ Tenant creat cu succes!",
        description: `Tenant-ul "${formData.name}" a fost adăugat în sistem.`,
      });
    },
    onError: () => {
      toast({
        title: "❌ Eroare la crearea tenant-ului",
        description: "Nu s-a putut crea tenant-ul. Încercați din nou.",
        variant: "destructive",
      });
    },
  });

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/admin/tenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant-stats'] });
      setEditingTenant(null);
      resetForm();
      toast({
        title: "✅ Tenant actualizat!",
        description: "Datele tenant-ului au fost actualizate cu succes.",
      });
    },
  });

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/tenants/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant-stats'] });
      toast({
        title: "✅ Tenant șters!",
        description: "Tenant-ul a fost eliminat din sistem.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Eroare la ștergerea tenant-ului",
        description: "Nu se poate șterge tenant-ul principal (ID: 1).",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "active",
      contactEmail: "",
      contactPhone: "",
      companyName: "",
      subscriptionPlan: "professional"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTenant) {
      updateTenantMutation.mutate({ id: editingTenant.id, data: formData });
    } else {
      createTenantMutation.mutate(formData);
    }
  };

  const startEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      description: tenant.description || "",
      status: tenant.status,
      contactEmail: tenant.contactEmail || "",
      contactPhone: tenant.contactPhone || "",
      companyName: tenant.companyName || "",
      subscriptionPlan: tenant.subscriptionPlan
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (id === 1) {
      toast({
        title: "❌ Operațiune interzisă",
        description: "Nu se poate șterge tenant-ul principal.",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm(`Sigur doriți să ștergeți tenant-ul "${name}"?`)) {
      deleteTenantMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    
    return variants[status as keyof typeof variants] || variants.inactive;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🏢 Gestionare Tenanți
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Administrează și monitorizează toți tenantii din sistem
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setEditingTenant(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Tenant Nou
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? "✏️ Editează Tenant" : "➕ Tenant Nou"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nume Tenant *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descriere</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="companyName">Nume Companie</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="contactEmail">Email Contact</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="contactPhone">Telefon</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activ</SelectItem>
                    <SelectItem value="inactive">Inactiv</SelectItem>
                    <SelectItem value="suspended">Suspendat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subscriptionPlan">Plan Abonament</Label>
                <Select 
                  value={formData.subscriptionPlan} 
                  onValueChange={(value) => setFormData({ ...formData, subscriptionPlan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createTenantMutation.isPending || updateTenantMutation.isPending}
                  className="flex-1"
                >
                  {editingTenant ? "💾 Actualizează" : "✅ Creează"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Anulează
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Tenanți</CardTitle>
                <Building className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTenants}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tenanți Activi</CardTitle>
                <Activity className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTenants}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tenanți Inactivi</CardTitle>
                <Users className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inactiveTenants}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏢 Lista Tenanți
            <Badge variant="outline">{tenants.length} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants.map((tenant, index) => (
              <motion.div
                key={tenant.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">#{tenant.id}</span>
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <Badge className={getStatusBadge(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {tenant.description || "Fără descriere"}
                  </div>
                  {tenant.companyName && (
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      🏢 {tenant.companyName}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Creat: {new Date(tenant.createdAt).toLocaleDateString('ro-RO')}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(tenant)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {tenant.id !== 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(tenant.id, tenant.name)}
                      disabled={deleteTenantMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {tenant.id === 1 && (
                    <Badge variant="secondary">Principal</Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          
          {tenants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nu există tenanți în sistem
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}