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

  const { data: weeklyProcessingData = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ['/api/weekly-processing'],
    queryFn: async () => {
      const response = await fetch('/api/weekly-processing');
      if (!response.ok) throw new Error('Failed to fetch weekly processing');
      return response.json();
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

  // Calculate weekly invoiced amounts for trending analysis
  const weeklyInvoicedData = weeklyProcessingData
    .map((week: any) => {
      if (!week.processedData) return null;
      
      let totalWeekInvoiced = 0;
      const processedData = week.processedData as any;
      
      // Sum up all companies' invoiced amounts for this week
      Object.keys(processedData).forEach(companyName => {
        if (companyName === 'Unmatched' || companyName === 'Totals') return;
        
        const companyData = processedData[companyName];
        if (companyData && (companyData.Total_7_days || companyData.Total_30_days)) {
          const total7Days = parseFloat(companyData.Total_7_days) || 0;
          const total30Days = parseFloat(companyData.Total_30_days) || 0;
          const totalCommission = parseFloat(companyData.Total_comision) || 0;
          
          // Total invoiced excluding commission
          const totalInvoiced = total7Days + total30Days - totalCommission;
          totalWeekInvoiced += totalInvoiced;
        }
      });
      
      return {
        weekLabel: week.weekLabel,
        totalInvoiced: totalWeekInvoiced,
        processingDate: week.processingDate,
        // Calculate trend compared to previous week
        trend: 0 // Will be calculated below
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(a.processingDate).getTime() - new Date(b.processingDate).getTime());
  
  // Calculate trends (percentage change from previous week)
  weeklyInvoicedData.forEach((week: any, index: number) => {
    if (index > 0) {
      const previousWeek = weeklyInvoicedData[index - 1] as any;
      const currentAmount = week.totalInvoiced;
      const previousAmount = previousWeek.totalInvoiced;
      
      if (previousAmount > 0) {
        week.trend = ((currentAmount - previousAmount) / previousAmount) * 100;
      }
    }
  });

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

  if (balancesLoading || paymentsLoading || weeklyLoading) {
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

      {/* Weekly Invoiced Amounts Table */}
      {weeklyInvoicedData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Sume Facturate pe Săptămână
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Urmărește tendințele facturării săptămânale pentru a identifica scăderi
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-muted-foreground">Săptămână</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Sumă Facturată</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Tendință</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Schimbare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyInvoicedData
                      .slice(-8) // Show last 8 weeks
                      .reverse() // Most recent first
                      .map((week: any, index: number) => {
                        const isIncreasing = week.trend > 0;
                        const isDecreasing = week.trend < 0;
                        const trendColor = isIncreasing ? 'text-green-600' : isDecreasing ? 'text-red-600' : 'text-muted-foreground';
                        const trendIcon = isIncreasing ? '↗️' : isDecreasing ? '↘️' : '→';
                        
                        return (
                          <tr key={week.weekLabel} className={`border-b hover:bg-muted/50 transition-colors ${
                            index === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}>
                            <td className="p-3 font-medium">
                              {week.weekLabel}
                              {index === 0 && (
                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                  Cea mai recentă
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono text-lg">
                              €{week.totalInvoiced.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`text-2xl ${trendColor}`}>
                                {trendIcon}
                              </span>
                            </td>
                            <td className={`p-3 text-right font-medium ${trendColor}`}>
                              {week.trend !== 0 ? (
                                <>
                                  {week.trend > 0 ? '+' : ''}{week.trend.toFixed(1)}%
                                  {isDecreasing && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Scădere detecată!
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground">Prima săptămână</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              
              {/* Summary Statistics */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Media Săptămânală</div>
                  <div className="text-xl font-bold text-blue-600">
                    €{(weeklyInvoicedData.reduce((sum: number, week: any) => sum + week.totalInvoiced, 0) / weeklyInvoicedData.length || 0)
                      .toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Cea mai mare săptămână</div>
                  <div className="text-xl font-bold text-green-600">
                    €{Math.max(...weeklyInvoicedData.map((w: any) => w.totalInvoiced))
                      .toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Cea mai mică săptămână</div>
                  <div className="text-xl font-bold text-orange-600">
                    €{Math.min(...weeklyInvoicedData.map((w: any) => w.totalInvoiced))
                      .toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Status Alerts */}
      {overdueBalances > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
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