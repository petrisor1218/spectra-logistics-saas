import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  DollarSign, 
  Settings, 
  Shield, 
  Database,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  companyName?: string;
  subscriptionStatus: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface Analytics {
  totalSubscribers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  trialUsers: number;
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    companyName: '',
    subscriptionStatus: '',
    role: '',
    password: ''
  });
  const { toast } = useToast();

  // Fetch all subscribers
  const { data: subscribers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/subscribers'],
    retry: false,
  });

  // Fetch subscription analytics
  const { data: analytics = {} } = useQuery<Analytics>({
    queryKey: ['/api/admin/analytics'],
    retry: false,
  });

  const handleViewUser = (userId: number) => {
    const user = subscribers.find((u: User) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setIsViewDialogOpen(true);
    }
  };

  const handleEditUser = (userId: number) => {
    const user = subscribers.find((u: User) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setEditForm({
        username: user.username,
        email: user.email,
        companyName: user.companyName || '',
        subscriptionStatus: user.subscriptionStatus,
        role: user.role,
        password: '' // Don't prefill password for security
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (selectedUser) {
      try {
        // Only include password if it's not empty
        const updateData = { ...editForm };
        if (!updateData.password.trim()) {
          delete updateData.password;
        }
        
        const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          toast({
            title: "Utilizator actualizat",
            description: editForm.password ? "Utilizatorul și parola au fost actualizate" : "Utilizatorul a fost actualizat",
          });
          setIsEditDialogOpen(false);
          window.location.reload();
        } else {
          throw new Error('Failed to update user');
        }
      } catch (error) {
        toast({
          title: "Eroare",
          description: "Nu s-au putut salva modificările",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Ești sigur că vrei să ștergi acest utilizator?')) {
      fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
        .then(response => {
          if (response.ok) {
            toast({
              title: "Utilizator șters",
              description: "Utilizatorul a fost șters cu succes",
              variant: "destructive",
            });
            window.location.reload();
          }
        })
        .catch(() => {
          toast({
            title: "Eroare",
            description: "Nu s-a putut șterge utilizatorul",
            variant: "destructive",
          });
        });
    }
  };

  const handleAddSubscriber = () => {
    setEditForm({
      username: '',
      email: '',
      companyName: '',
      subscriptionStatus: 'active',
      role: 'subscriber',
      password: ''
    });
    setIsAddDialogOpen(true);
  };

  const handleSaveNewUser = async () => {
    // Check if required fields are filled
    if (!editForm.username.trim() || !editForm.email.trim() || !editForm.password.trim()) {
      toast({
        title: "Câmpuri incomplete",
        description: "Te rog completează toate câmpurile obligatorii (nume, email, parolă)",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Utilizator adăugat",
          description: `Noul utilizator "${editForm.username}" a fost creat cu succes`,
        });
        setIsAddDialogOpen(false);
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea utilizatorul",
        variant: "destructive",
      });
    }
  };

  const handleDatabaseAccess = (userId: number) => {
    toast({
      title: "Acces bază de date",
      description: `Conectez la baza de date pentru utilizatorul ID: ${userId}`,
    });
    console.log('Database access for user:', userId);
  };

  const filteredSubscribers = subscribers.filter((user: User) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.subscriptionStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'trialing': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'canceled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activ';
      case 'trialing': return 'Perioada probă';
      case 'canceled': return 'Anulat';
      case 'inactive': return 'Inactiv';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Dashboard Administrator
              </h1>
              <p className="text-gray-300">
                Gestionează abonaților și monitorizează sistemul Transport Pro
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleAddSubscriber}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adaugă abonat
              </Button>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Total abonaților</p>
                    <p className="text-3xl font-bold">{analytics.totalSubscribers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Abonaități active</p>
                    <p className="text-3xl font-bold">{analytics.activeSubscriptions || 0}</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Venit lunar</p>
                    <p className="text-3xl font-bold">€{analytics.monthlyRevenue || 0}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Perioada probă</p>
                    <p className="text-3xl font-bold">{analytics.trialUsers || 0}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="subscribers" className="space-y-6">
            <TabsList className="bg-white/10 backdrop-blur-lg border-white/20">
              <TabsTrigger value="subscribers" className="data-[state=active]:bg-white/20">
                Abonaților
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
                Analize
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white/20">
                Setări
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscribers" className="space-y-6">
              {/* Filters */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[300px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Caută după nume, email sau companie..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                    >
                      <option value="all">Toate statusurile</option>
                      <option value="active">Activ</option>
                      <option value="trialing">Perioada probă</option>
                      <option value="canceled">Anulat</option>
                      <option value="inactive">Inactiv</option>
                    </select>

                    <Button 
                      variant="outline" 
                      className="border-white/30 text-white hover:bg-white/10"
                      onClick={() => {
                        toast({
                          title: "Export date",
                          description: "Exportez lista de abonaților în format CSV",
                        });
                        console.log('Export subscribers data');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Subscribers Table */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Lista abonaților ({filteredSubscribers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4">Utilizator</th>
                          <th className="text-left py-3 px-4">Companie</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Ultima conectare</th>
                          <th className="text-left py-3 px-4">Acțiuni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubscribers.map((user: any) => (
                          <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{user.username}</div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm">{user.companyName || 'Nu este specificat'}</div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusColor(user.subscriptionStatus)}>
                                {getStatusText(user.subscriptionStatus)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-gray-400">
                                {user.lastLoginAt ? 
                                  new Date(user.lastLoginAt).toLocaleDateString('ro-RO') : 
                                  'Niciodată'
                                }
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-white/30 text-white hover:bg-white/10"
                                  onClick={() => handleViewUser(user.id)}
                                  title="Vizualizare detalii"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-white/30 text-white hover:bg-white/10"
                                  onClick={() => handleDatabaseAccess(user.id)}
                                  title="Acces bază de date"
                                >
                                  <Database className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-white/30 text-white hover:bg-white/10"
                                  onClick={() => handleEditUser(user.id)}
                                  title="Editare utilizator"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Analize detaliate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Grafice și statistici detaliate vor fi implementate aici.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Setări sistem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Configurări pentru sistemul de abonamente și plăți.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Detalii utilizator</DialogTitle>
            <DialogDescription>
              Informații complete despre utilizatorul selectat
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Nume utilizator</Label>
                <p className="text-gray-300">{selectedUser.username}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-gray-300">{selectedUser.email}</p>
              </div>
              <div>
                <Label>Companie</Label>
                <p className="text-gray-300">{selectedUser.companyName || 'Nu este specificat'}</p>
              </div>
              <div>
                <Label>Rol</Label>
                <p className="text-gray-300">{selectedUser.role}</p>
              </div>
              <div>
                <Label>Status abonament</Label>
                <Badge className={getStatusColor(selectedUser.subscriptionStatus)}>
                  {getStatusText(selectedUser.subscriptionStatus)}
                </Badge>
              </div>
              <div>
                <Label>Data înregistrării</Label>
                <p className="text-gray-300">{new Date(selectedUser.createdAt).toLocaleDateString('ro-RO')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Editare utilizator</DialogTitle>
            <DialogDescription>
              Modifică informațiile utilizatorului
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Nume utilizator</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="companyName">Companie</Label>
              <Input
                id="companyName"
                value={editForm.companyName}
                onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Selectează rolul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="subscriber">Abonat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status abonament</Label>
              <Select value={editForm.subscriptionStatus} onValueChange={(value) => setEditForm({...editForm, subscriptionStatus: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Selectează statusul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activ</SelectItem>
                  <SelectItem value="trialing">Perioada probă</SelectItem>
                  <SelectItem value="canceled">Anulat</SelectItem>
                  <SelectItem value="inactive">Inactiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="password">Parolă nouă (opțional)</Label>
              <Input
                id="password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                className="bg-gray-800 border-gray-600"
                placeholder="Lasă gol pentru a păstra parola existentă"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Adaugă utilizator nou</DialogTitle>
            <DialogDescription>
              Creează un nou cont de utilizator
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-username">Nume utilizator</Label>
              <Input
                id="new-username"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="new-companyName">Companie</Label>
              <Input
                id="new-companyName"
                value={editForm.companyName}
                onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                className="bg-gray-800 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="new-role">Rol</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Selectează rolul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="subscriber">Abonat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-status">Status abonament</Label>
              <Select value={editForm.subscriptionStatus} onValueChange={(value) => setEditForm({...editForm, subscriptionStatus: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Selectează statusul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activ</SelectItem>
                  <SelectItem value="trialing">Perioada probă</SelectItem>
                  <SelectItem value="canceled">Anulat</SelectItem>
                  <SelectItem value="inactive">Inactiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-password">Parolă</Label>
              <Input
                id="new-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                className="bg-gray-800 border-gray-600"
                placeholder="Introduceți parola pentru noul utilizator"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleSaveNewUser} className="bg-green-600 hover:bg-green-700">
              Creează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}