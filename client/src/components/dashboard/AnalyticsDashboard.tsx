import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  AlertTriangle,
  Download,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, subMonths } from 'date-fns';
import { ro } from 'date-fns/locale';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

interface AnalyticsData {
  paymentTrends: any[];
  companyPerformance: any[];
  monthlyStats: any[];
  weeklyProgress: any[];
  overduePayments: any[];
  topCompanies: any[];
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | '1y'>('90d');
  
  const { data: paymentsData = [], refetch: refetchPayments } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: async () => {
      const response = await fetch('/api/payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  const { data: weeklyData = [], refetch: refetchWeekly } = useQuery({
    queryKey: ['/api/weekly-processing'],
    queryFn: async () => {
      const response = await fetch('/api/weekly-processing');
      if (!response.ok) throw new Error('Failed to fetch weekly data');
      return response.json();
    },
  });

  const { data: balancesData = [], refetch: refetchBalances } = useQuery({
    queryKey: ['/api/company-balances'],
    queryFn: async () => {
      const response = await fetch('/api/company-balances');
      if (!response.ok) throw new Error('Failed to fetch balances');
      return response.json();
    },
  });

  // Calculate analytics data
  const analyticsData: AnalyticsData = {
    // Payment trends over time
    paymentTrends: paymentsData
      .filter((payment: any) => {
        const paymentDate = new Date(payment.paymentDate);
        const cutoffDate = timeRange === '30d' ? subDays(new Date(), 30) :
                          timeRange === '90d' ? subDays(new Date(), 90) :
                          timeRange === '6m' ? subMonths(new Date(), 6) :
                          subMonths(new Date(), 12);
        return paymentDate >= cutoffDate;
      })
      .reduce((acc: any[], payment: any) => {
        const monthYear = format(new Date(payment.paymentDate), 'MMM yyyy', { locale: ro });
        const existing = acc.find(item => item.month === monthYear);
        if (existing) {
          existing.amount += parseFloat(payment.amount);
          existing.count += 1;
        } else {
          acc.push({
            month: monthYear,
            amount: parseFloat(payment.amount),
            count: 1
          });
        }
        return acc;
      }, [])
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),

    // Company performance comparison
    companyPerformance: paymentsData
      .reduce((acc: any[], payment: any) => {
        const existing = acc.find(item => item.company === payment.companyName);
        if (existing) {
          existing.totalPaid += parseFloat(payment.amount);
          existing.paymentCount += 1;
        } else {
          acc.push({
            company: payment.companyName,
            totalPaid: parseFloat(payment.amount),
            paymentCount: 1
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.totalPaid - a.totalPaid),

    // Monthly statistics
    monthlyStats: paymentsData
      .filter((payment: any) => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= subMonths(new Date(), 12);
      })
      .reduce((acc: any[], payment: any) => {
        const month = format(new Date(payment.paymentDate), 'yyyy-MM');
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.payments += parseFloat(payment.amount);
          existing.transactions += 1;
        } else {
          acc.push({
            month,
            monthLabel: format(new Date(payment.paymentDate), 'MMM yyyy', { locale: ro }),
            payments: parseFloat(payment.amount),
            transactions: 1
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a.month.localeCompare(b.month)),

    // Weekly progress
    weeklyProgress: weeklyData.slice(-8).map((week: any) => ({
      week: week.weekLabel,
      processed: week.processedData ? Object.keys(week.processedData).length : 0,
      totalAmount: week.processedData ? 
        Object.values(week.processedData).reduce((sum: number, company: any) => 
          sum + (company.Total_7_days || 0) + (company.Total_30_days || 0), 0
        ) : 0
    })),

    // Overdue payments analysis
    overduePayments: balancesData
      .filter((balance: any) => balance.status === 'pending' || balance.status === 'partial')
      .map((balance: any) => ({
        company: balance.companyName,
        week: balance.weekLabel,
        amount: balance.outstandingAmount,
        daysOverdue: Math.floor((new Date().getTime() - new Date(balance.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue),

    // Top companies by revenue
    topCompanies: paymentsData
      .reduce((acc: any[], payment: any) => {
        const existing = acc.find(item => item.name === payment.companyName);
        if (existing) {
          existing.value += parseFloat(payment.amount);
          existing.payments += 1;
        } else {
          acc.push({
            name: payment.companyName,
            value: parseFloat(payment.amount),
            payments: 1
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  };

  const totalPaid = analyticsData.companyPerformance.reduce((sum, company) => sum + company.totalPaid, 0);
  const totalOverdue = analyticsData.overduePayments.reduce((sum, overdue) => sum + overdue.amount, 0);
  const activeCompanies = analyticsData.companyPerformance.length;
  const averagePayment = totalPaid / Math.max(paymentsData.length, 1);

  const handleRefreshData = () => {
    refetchPayments();
    refetchWeekly();
    refetchBalances();
  };

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      summary: {
        totalPaid,
        totalOverdue,
        activeCompanies,
        averagePayment
      },
      analytics: analyticsData
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transport-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">📊 Dashboard Analytics</h1>
          <p className="text-muted-foreground">Analiza performanței și tendințelor financiare</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizează
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['30d', '90d', '6m', '1y'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === '30d' ? '30 zile' : 
             range === '90d' ? '90 zile' :
             range === '6m' ? '6 luni' : '1 an'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plătit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground">
                {paymentsData.length} tranzacții
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restanțe</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.overduePayments.length} companii
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companii Active</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCompanies}</div>
              <p className="text-xs text-muted-foreground">
                În ultimele {timeRange === '30d' ? '30 zile' : timeRange === '90d' ? '90 zile' : timeRange === '6m' ? '6 luni' : '12 luni'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plată Medie</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(averagePayment)}</div>
              <p className="text-xs text-muted-foreground">
                per tranzacție
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tendința Plăților</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.paymentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value: any) => [formatCurrency(value), 'Suma']} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Company Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performanța pe Companii</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.companyPerformance.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value: any) => [formatCurrency(value), 'Total Plătit']} />
                <Bar dataKey="totalPaid" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Companies Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Companii - Distribuția Veniturilor</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={analyticsData.topCompanies}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {analyticsData.topCompanies.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [formatCurrency(value), 'Venit']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overdue Payments Alert */}
      {analyticsData.overduePayments.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">
              ⚠️ Plăți în Întârziere ({analyticsData.overduePayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.overduePayments.slice(0, 5).map((overdue, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                  <div>
                    <span className="font-medium">{overdue.company}</span>
                    <Badge variant="outline" className="ml-2">{overdue.week}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">{formatCurrency(overdue.amount)}</div>
                    <div className="text-sm text-muted-foreground">{overdue.daysOverdue} zile</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}