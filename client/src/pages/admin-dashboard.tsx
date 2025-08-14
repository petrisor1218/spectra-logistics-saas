import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { 
  Users, 
  Database, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Settings,
  BarChart3,
  Activity,
  Shield,
  DollarSign,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Trash2,
  Play,
  Pause
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  status: string;
  subscriptionStatus: string;
  contactEmail: string;
  companyName: string;
  databaseSize: number;
  apiCallsCount: number;
  activeUsersCount: number;
  monthlyRecurringRevenue: number;
  trialEndsAt: string;
  promotionalEndsAt: string;
  createdAt: string;
  lastApiCall: string;
}

interface SystemMetrics {
  mrr: number;
  activeTenantsCount: number;
  trialTenantsCount: number;
  totalTenantsCount: number;
  churnRate: number;
  growthRate: number;
}

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tenants
      const tenantsResponse = await fetch("/api/admin/tenants");
      const tenantsData = await tenantsResponse.json();
      
      // Fetch metrics
      const metricsResponse = await fetch("/api/admin/metrics");
      const metricsData = await metricsResponse.json();
      
      setTenants(tenantsData.tenants);
      setMetrics(metricsData);
    } catch (err) {
      setError("Eroare la încărcarea datelor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantAction = async (tenantId: number, action: string) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/${action}`, {
        method: "POST",
      });
      
      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        throw new Error("Eroare la executarea acțiunii");
      }
    } catch (err) {
      setError("Eroare la executarea acțiunii");
      console.error(err);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activ</Badge>;
      case "trial":
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspendat</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactiv</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activ</Badge>;
      case "trialing":
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case "past_due":
        return <Badge className="bg-yellow-100 text-yellow-800">Scadent</Badge>;
      case "canceled":
        return <Badge className="bg-red-100 text-red-800">Anulat</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Super Admin</h1>
          <p className="text-gray-600">Gestionarea și monitorizarea tuturor tenantilor</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{metrics.mrr.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Monthly Recurring Revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tenanți Activi</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeTenantsCount}</div>
                <p className="text-xs text-muted-foreground">
                  din {metrics.totalTenantsCount} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">În Trial</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.trialTenantsCount}</div>
                <p className="text-xs text-muted-foreground">
                  în perioada de testare
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rata de Churn</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.churnRate?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  ultimele 30 zile
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Evoluția MRR</CardTitle>
              <CardDescription>Monthly Recurring Revenue în ultimele 12 luni</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { month: "Ian", mrr: 0 },
                  { month: "Feb", mrr: 0 },
                  { month: "Mar", mrr: 0 },
                  { month: "Apr", mrr: 0 },
                  { month: "Mai", mrr: 0 },
                  { month: "Iun", mrr: 0 },
                  { month: "Iul", mrr: 0 },
                  { month: "Aug", mrr: 0 },
                  { month: "Sep", mrr: 0 },
                  { month: "Oct", mrr: 0 },
                  { month: "Noi", mrr: 0 },
                  { month: "Dec", mrr: metrics?.mrr || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value}`, "MRR"]} />
                  <Line type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuția Tenantilor</CardTitle>
              <CardDescription>Statusul abonamentelor</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Activ", value: metrics?.activeTenantsCount || 0, color: "#10b981" },
                      { name: "Trial", value: metrics?.trialTenantsCount || 0, color: "#3b82f6" },
                      { name: "Suspendat", value: tenants.filter(t => t.status === "suspended").length, color: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: "Activ", value: metrics?.activeTenantsCount || 0, color: "#10b981" },
                      { name: "Trial", value: metrics?.trialTenantsCount || 0, color: "#3b82f6" },
                      { name: "Suspendat", value: tenants.filter(t => t.status === "suspended").length, color: "#ef4444" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestionare Tenanți</CardTitle>
                <CardDescription>
                  {filteredTenants.length} din {tenants.length} tenanți
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tenant Nou
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="search">Caută</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Caută după nume, subdomain sau companie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toți</option>
                  <option value="active">Activ</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspendat</option>
                  <option value="inactive">Inactiv</option>
                </select>
              </div>
            </div>

            {/* Tenants Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Abonament</TableHead>
                    <TableHead>Utilizatori</TableHead>
                    <TableHead>DB Size</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Ultima Activitate</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-gray-500">
                            {tenant.subdomain}.{window.location.hostname}
                          </div>
                          <div className="text-sm text-gray-500">{tenant.companyName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>{getSubscriptionStatusBadge(tenant.subscriptionStatus)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tenant.activeUsersCount} activi</div>
                          <div className="text-gray-500">{tenant.apiCallsCount} API calls</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {tenant.databaseSize} MB
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          €{tenant.monthlyRecurringRevenue?.toFixed(2) || "0.00"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {tenant.lastApiCall ? new Date(tenant.lastApiCall).toLocaleDateString('ro-RO') : "Niciodată"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalii Tenant</DialogTitle>
                                <DialogDescription>
                                  Informații detaliate despre {tenant.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Nume</Label>
                                    <div className="text-sm">{tenant.name}</div>
                                  </div>
                                  <div>
                                    <Label>Subdomain</Label>
                                    <div className="text-sm">{tenant.subdomain}</div>
                                  </div>
                                  <div>
                                    <Label>Email Contact</Label>
                                    <div className="text-sm">{tenant.contactEmail}</div>
                                  </div>
                                  <div>
                                    <Label>Companie</Label>
                                    <div className="text-sm">{tenant.companyName}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Status</Label>
                                    <div>{getStatusBadge(tenant.status)}</div>
                                  </div>
                                  <div>
                                    <Label>Abonament</Label>
                                    <div>{getSubscriptionStatusBadge(tenant.subscriptionStatus)}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Trial se termină</Label>
                                    <div className="text-sm">
                                      {tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString('ro-RO') : "N/A"}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Preț promotional se termină</Label>
                                    <div className="text-sm">
                                      {tenant.promotionalEndsAt ? new Date(tenant.promotionalEndsAt).toLocaleDateString('ro-RO') : "N/A"}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Utilizatori Activi</Label>
                                    <div className="text-sm">{tenant.activeUsersCount}</div>
                                  </div>
                                  <div>
                                    <Label>API Calls</Label>
                                    <div className="text-sm">{tenant.apiCallsCount}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>DB Size</Label>
                                    <div className="text-sm">{tenant.databaseSize} MB</div>
                                  </div>
                                  <div>
                                    <Label>MRR</Label>
                                    <div className="text-sm">€{tenant.monthlyRecurringRevenue?.toFixed(2) || "0.00"}</div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {tenant.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTenantAction(tenant.id, "suspend")}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTenantAction(tenant.id, "activate")}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Acțiuni pentru {tenant.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => window.open(`https://${tenant.subdomain}.${window.location.hostname}`, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Accesează Platforma
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                >
                                  <Database className="h-4 w-4 mr-2" />
                                  Backup Database
                                </Button>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start"
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Configurare
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="w-full justify-start"
                                  onClick={() => handleTenantAction(tenant.id, "delete")}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Șterge Tenant
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}