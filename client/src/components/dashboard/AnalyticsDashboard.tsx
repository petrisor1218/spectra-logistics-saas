import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface CompanyBalance {
  id: number;
  companyName: string;
  weekLabel: string;
  totalInvoiced: number;
  totalPaid: number;
  remainingAmount: number;
  commission: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentData {
  id: number;
  companyName: string;
  amount: number;
  paymentDate: string;
  weekLabel: string;
  notes?: string;
}

export default function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  const { data: balances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['/api/company-balances'],
    queryFn: async () => {
      const response = await fetch('/api/company-balances');
      if (!response.ok) throw new Error('Failed to fetch balances');
      return response.json() as CompanyBalance[];
    }
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: async () => {
      const response = await fetch('/api/payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json() as PaymentData[];
    }
  });

  // Calculate metrics with safe number conversion and correct field names
  const totalInvoiced = balances.reduce((sum, b) => sum + Number(b.totalInvoiced || 0), 0);
  const totalPaid = balances.reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);
  const totalRemaining = balances.reduce((sum, b) => sum + Number(b.outstandingBalance || 0), 0);
  const activeCompanies = new Set(balances.map(b => b.companyName)).size;
  const averagePayment = payments.length > 0 ? totalPaid / payments.length : 0;
  const overdueBalances = balances.filter(b => b.paymentStatus === 'pending' && Number(b.outstandingBalance || 0) > 1).length;

  // Prepare chart data
  const companyPerformanceData = balances.reduce((acc: any[], balance) => {
    const existing = acc.find(item => item.company === balance.companyName);
    if (existing) {
      existing.invoiced += Number(balance.totalInvoiced || 0);
      existing.paid += Number(balance.totalPaid || 0);
      existing.remaining += Number(balance.outstandingBalance || 0);
    } else {
      acc.push({
        company: balance.companyName.length > 15 
          ? balance.companyName.substring(0, 15) + '...' 
          : balance.companyName,
        invoiced: Number(balance.totalInvoiced || 0),
        paid: Number(balance.totalPaid || 0),
        remaining: Number(balance.outstandingBalance || 0)
      });
    }
    return acc;
  }, []).slice(0, 5); // Top 5 companies

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const pieData = companyPerformanceData.map((item, index) => ({
    name: item.company,
    value: item.invoiced,
    color: pieColors[index % pieColors.length]
  }));

  // Payment trend data (last 30 days simulation)
  const paymentTrendData = payments
    .filter(payment => payment.paymentDate && !isNaN(new Date(payment.paymentDate).getTime()))
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
    .slice(-10)
    .map(payment => ({
      date: new Date(payment.paymentDate).toLocaleDateString('ro-RO', { 
        month: 'short', 
        day: 'numeric' 
      }),
      amount: Number(payment.amount || 0)
    }));

  const exportAnalytics = () => {
    const analyticsData = {
      summary: {
        totalInvoiced,
        totalPaid,
        totalRemaining,
        activeCompanies,
        averagePayment,
        overdueBalances,
        exportedAt: new Date().toISOString()
      },
      companyPerformance: companyPerformanceData,
      paymentTrends: paymentTrendData,
      detailedBalances: balances,
      recentPayments: payments.slice(-20)
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (balancesLoading || paymentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Se încarcă analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Analiză comprehensivă a performanței financiare și operaționale
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option value="7days">Ultimele 7 zile</option>
            <option value="30days">Ultimele 30 zile</option>
            <option value="90days">Ultimele 90 zile</option>
          </select>
          <Button onClick={exportAnalytics} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Export Date
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturat</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">€{totalInvoiced.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +12% față de luna trecută
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plătit</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">€{totalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {totalInvoiced > 0 ? ((totalPaid / totalInvoiced) * 100).toFixed(1) : '0'}% din total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restanțe</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">€{totalRemaining.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {overdueBalances} companii cu restanțe
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companii Active</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCompanies}</div>
              <p className="text-xs text-muted-foreground">
                Plată medie: €{averagePayment.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Performance Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Performanța Companiilor (Top 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="company" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, '']} />
                  <Bar dataKey="invoiced" fill="#3b82f6" name="Facturat" />
                  <Bar dataKey="paid" fill="#10b981" name="Plătit" />
                  <Bar dataKey="remaining" fill="#ef4444" name="Restant" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Company Distribution Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Distribuția Facturării</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Facturat']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Trends */}
      {paymentTrendData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle>Tendința Plăților Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={paymentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Sumă']} />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Status Alerts */}
      {overdueBalances > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alerte Financiare
              </CardTitle>
            </CardHeader>
            <CardContent className="text-red-700 dark:text-red-300">
              <p>
                Există <strong>{overdueBalances}</strong> companii cu restanțe în valoare totală de{' '}
                <strong>€{totalRemaining.toFixed(2)}</strong>. 
                Consideră urmărirea acestor plăți pentru o mai bună cash flow.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}