import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
    toast({
      title: "Vizualizare utilizator",
      description: `Afișez detaliile pentru utilizatorul ID: ${userId}`,
    });
    console.log('View user:', userId);
  };

  const handleEditUser = (userId: number) => {
    toast({
      title: "Editare utilizator",
      description: `Deschid formularul de editare pentru utilizatorul ID: ${userId}`,
    });
    console.log('Edit user:', userId);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Ești sigur că vrei să ștergi acest utilizator?')) {
      toast({
        title: "Utilizator șters",
        description: `Utilizatorul ID: ${userId} a fost șters`,
        variant: "destructive",
      });
      console.log('Delete user:', userId);
    }
  };

  const handleAddSubscriber = () => {
    toast({
      title: "Adaugă abonat nou",
      description: "Deschid formularul pentru adăugarea unui abonat nou",
    });
    console.log('Add new subscriber');
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
    </div>
  );
}