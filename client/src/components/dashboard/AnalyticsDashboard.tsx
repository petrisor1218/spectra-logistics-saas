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
  Target,
  Calendar
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
  outstandingBalance: number;
  commission: number;
  status: string;
  paymentStatus: string;
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

  // Calculate metrics using BOTH sources for consistency checking
  // Main metrics from company_balances (current system)
  const totalInvoicedFromBalances = balances.reduce((sum, b) => sum + Number(b.totalInvoiced || 0), 0);
  const totalPaid = balances.reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);
  
  // FIX: Ensure Total Paid never exceeds Total Invoiced
  // If total paid > total invoiced, it means there are overpayments but debt should be 0
  const correctedTotalPaid = Math.min(totalPaid, totalInvoicedFromBalances);
  const totalRemaining = Math.max(0, totalInvoicedFromBalances - correctedTotalPaid);
  
  const activeCompanies = new Set(balances.map(b => b.companyName)).size;
  const averagePayment = payments.length > 0 ? correctedTotalPaid / payments.length : 0;
  const overdueBalances = balances.filter(b => (b.paymentStatus === 'pending' || b.status === 'pending') && Number(b.outstandingBalance || 0) > 1).length;
  
  // Debug the calculation
  console.log('💰 Debug calcule Analytics:');
  console.log('   Total Facturat:', totalInvoicedFromBalances.toFixed(2));
  console.log('   Total Încasat (original):', totalPaid.toFixed(2));
  console.log('   Total Încasat (corectat):', correctedTotalPaid.toFixed(2));
  console.log('   De Încasat (corect):', totalRemaining.toFixed(2));
  console.log('   Sumă individual outstandingBalance:', balances.reduce((sum, b) => sum + Number(b.outstandingBalance || 0), 0).toFixed(2));
  
  // Calculate total invoiced from weekly processing data (for consistency)
  const totalInvoicedFromWeeklyData = weeklyProcessingData.reduce((sum, week: any) => {
    if (!week.processedData) return sum;
    
    const processedData = week.processedData as any;
    let weekTotal = 0;
    
    Object.keys(processedData).forEach(companyName => {
      if (companyName === 'Unmatched' || companyName === 'Totals') return;
      
      const companyData = processedData[companyName];
      if (companyData && (companyData.Total_7_days || companyData.Total_30_days)) {
        const total7Days = parseFloat(companyData.Total_7_days) || 0;
        const total30Days = parseFloat(companyData.Total_30_days) || 0;
        const totalCommission = parseFloat(companyData.Total_comision) || 0;
        
        // Total invoiced excluding commission
        weekTotal += total7Days + total30Days - totalCommission;
      }
    });
    
    return sum + weekTotal;
  }, 0);
  
  // Use company balances as the authoritative source - these are the real processed amounts  
  const totalInvoiced = totalInvoicedFromBalances;
  
  // Debug info - confirm we're using the correct data source
  console.log('✅ Using Company Balances as authoritative source:', totalInvoiced.toFixed(2));

  // Group by full company name first, then prepare display data
  const companyTotals = new Map();
  balances.forEach(balance => {
    const key = balance.companyName;
    if (companyTotals.has(key)) {
      const existing = companyTotals.get(key);
      existing.invoiced += Number(balance.totalInvoiced || 0);
      existing.paid += Number(balance.totalPaid || 0);
      existing.remaining += Math.max(0, Number(balance.outstandingBalance || 0));
    } else {
      companyTotals.set(key, {
        fullName: balance.companyName,
        invoiced: Number(balance.totalInvoiced || 0),
        paid: Number(balance.totalPaid || 0),
        remaining: Math.max(0, Number(balance.outstandingBalance || 0))
      });
    }
  });

  // Convert to array and prepare display names
  const companyPerformanceData = Array.from(companyTotals.values())
    .map(company => ({
      ...company,
      company: company.fullName.length > 20 
        ? company.fullName.substring(0, 17) + '...' 
        : company.fullName
    }))
    .sort((a, b) => b.invoiced - a.invoiced)
    .slice(0, 5);
  
  console.log('📊 DEBUG: Company totals before display:', Array.from(companyTotals.entries()).slice(0, 7));
  console.log('📊 DEBUG: Top 5 companies for chart:', companyPerformanceData);

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
          
          // Total invoiced excluding commission (same calculation as main totalInvoiced)
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

  // Enhanced yearly and monthly analysis with automatic year detection
  const monthlyDataFromBalances = balances.reduce((acc: any[], balance) => {
    const weekLabel = balance.weekLabel;
    let weekDate = new Date();
    let year = 2024; // default
    
    try {
      // Parse week label like "11 feb. - 17 feb." or "5 ian. - 11 ian. 2025"
      const monthMatch = weekLabel.match(/(\d+)\s+(\w+)/);
      // Check if year is explicitly mentioned in the label
      const yearMatch = weekLabel.match(/(\d{4})/);
      
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
      } else {
        // Smart year detection based on month and processing date
        if (balance.createdAt) {
          const createdDate = new Date(balance.createdAt);
          year = createdDate.getFullYear();
        } else {
          // If weekLabel contains "ian" (January), it's likely 2025 data
          if (weekLabel.toLowerCase().includes('ian')) {
            year = 2025;
          }
        }
      }
      
      if (monthMatch) {
        const day = parseInt(monthMatch[1]);
        const monthStr = monthMatch[2].toLowerCase();
        
        // Map Romanian month abbreviations to numbers
        const monthMap: Record<string, number> = {
          'ian': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mai': 4, 'iun': 5,
          'iul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        
        const monthNum = monthMap[monthStr.substring(0, 3)];
        if (monthNum !== undefined) {
          weekDate = new Date(year, monthNum, day);
        }
      }
    } catch (error) {
      console.log('Error parsing balance date:', error);
      weekDate = new Date(); // fallback to current date
    }
    
    const monthKey = `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = weekDate.toLocaleDateString('ro-RO', { month: 'long' });
    const fullMonthName = weekDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
    
    const existing = acc.find(item => item.monthKey === monthKey);
    if (existing) {
      existing.totalInvoiced += Number(balance.totalInvoiced || 0);
      existing.weekCount += 1;
    } else {
      acc.push({
        monthKey,
        monthName,
        fullMonthName,
        year: weekDate.getFullYear(),
        totalInvoiced: Number(balance.totalInvoiced || 0),
        weekCount: 1,
        date: weekDate
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

  // Separate data by year for yearly analysis
  const dataBy2024 = monthlyDataFromBalances.filter(month => month.year === 2024);
  const dataBy2025 = monthlyDataFromBalances.filter(month => month.year === 2025);
  
  // Month-by-month comparison data - each month gets ONE row with comparative data
  const monthlyComparisonData = (() => {
    const months = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'];
    const monthNames = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 
                       'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    
    return months.map((monthKey, index) => {
      const data2024 = dataBy2024.find((d: any) => {
        const monthStr = d.date.toLocaleDateString('ro-RO', { month: 'short' }).toLowerCase().substring(0, 3);
        return monthStr === monthKey;
      }) || { totalInvoiced: 0 };
      
      const data2025 = dataBy2025.find((d: any) => {
        const monthStr = d.date.toLocaleDateString('ro-RO', { month: 'short' }).toLowerCase().substring(0, 3);
        return monthStr === monthKey;
      }) || { totalInvoiced: 0 };
      
      const total2024 = data2024.totalInvoiced || 0;
      const total2025 = data2025.totalInvoiced || 0;
      const maxValue = Math.max(total2024, total2025);
      
      // Calculate percentage progress for visual bars
      const progress2024 = maxValue > 0 ? (total2024 / maxValue) * 100 : 0;
      const progress2025 = maxValue > 0 ? (total2025 / maxValue) * 100 : 0;
      
      return {
        monthName: monthNames[index],
        monthKey: monthKey,
        total2024: total2024,
        total2025: total2025,
        progress2024: progress2024,
        progress2025: progress2025,
        hasData2024: total2024 > 0,
        hasData2025: total2025 > 0,
        winner: total2025 > total2024 ? '2025' : total2024 > total2025 ? '2024' : 'tie',
        difference: Math.abs(total2025 - total2024),
        percentageChange: total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0
      };
    }).filter(month => month.hasData2024 || month.hasData2025); // Only show months with data
  })();
  
  // Keep the original yearlyMonthlyData for chart compatibility
  const yearlyMonthlyData = monthlyDataFromBalances.map(month => ({
    ...month,
    displayName: `${month.monthName} ${month.year}`,
    colorByYear: month.year === 2025 ? '#10b981' : '#3b82f6' // Green for 2025, Blue for 2024
  }));

  // Use this data for monthly analysis instead of weekly processing data
  const monthlyData = monthlyDataFromBalances;

  // Find best and worst months
  const sortedMonths = [...monthlyData].sort((a, b) => b.totalInvoiced - a.totalInvoiced);
  const bestMonth = sortedMonths[0];
  const worstMonth = sortedMonths[sortedMonths.length - 1];
  
  // Year comparison data
  const total2024 = dataBy2024.reduce((sum, month) => sum + month.totalInvoiced, 0);
  const total2025 = dataBy2025.reduce((sum, month) => sum + month.totalInvoiced, 0);
  const avg2024 = dataBy2024.length > 0 ? total2024 / dataBy2024.length : 0;
  const avg2025 = dataBy2025.length > 0 ? total2025 / dataBy2025.length : 0;
  
  console.log('📊 DEBUG: Yearly data breakdown:');
  console.log('   2024 data:', dataBy2024.length, 'months, total:', total2024.toFixed(2));
  console.log('   2025 data:', dataBy2025.length, 'months, total:', total2025.toFixed(2));

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
        totalPaid: correctedTotalPaid,
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
              <div className="text-2xl font-bold text-green-600">€{correctedTotalPaid.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {totalInvoiced > 0 ? ((correctedTotalPaid / totalInvoiced) * 100).toFixed(1) : '0'}% din total
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

      {/* Monthly Analysis - Best Months */}
      {monthlyData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Analiză Lunară - Care sunt Lunile cele mai Bune?
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Identifică lunile cu cele mai mari facturi pentru planificare strategică
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="fullMonthName" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis formatter={(value: number) => `€${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [
                      `€${value.toLocaleString('ro-RO', { minimumFractionDigits: 2 })}`,
                      'Total Facturat'
                    ]}
                    labelFormatter={(label: string) => `Luna: ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{
                      color: 'hsl(var(--foreground))',
                      fontWeight: '600'
                    }}
                  />
                  <Bar 
                    dataKey="totalInvoiced" 
                    radius={[4, 4, 0, 0]}
                    fill={(entry: any) => {
                      // Different colors for best and worst months
                      if (entry.totalInvoiced === bestMonth?.totalInvoiced) return '#10b981'; // Green for best
                      if (entry.totalInvoiced === worstMonth?.totalInvoiced) return '#ef4444'; // Red for worst
                      return '#3b82f6'; // Blue for others
                    }}
                  >
                    {monthlyData.map((entry: any, index: number) => {
                      let fillColor = '#3b82f6'; // Default blue
                      if (entry.totalInvoiced === bestMonth?.totalInvoiced) fillColor = '#10b981'; // Green for best
                      if (entry.totalInvoiced === worstMonth?.totalInvoiced) fillColor = '#ef4444'; // Red for worst
                      return <Cell key={`cell-${index}`} fill={fillColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Best and Worst Months Highlights */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border-2 border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">🏆 LUNA CEA MAI BUNĂ</div>
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">
                    {bestMonth?.fullMonthName || 'N/A'}
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    €{bestMonth?.totalInvoiced.toLocaleString('ro-RO', { minimumFractionDigits: 0 }) || '0'}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">📊 MEDIA LUNARĂ</div>
                  <div className="text-lg font-medium text-muted-foreground">
                    Pe {monthlyData.length} luni
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    €{(monthlyData.reduce((sum: number, month: any) => sum + month.totalInvoiced, 0) / monthlyData.length || 0)
                      .toLocaleString('ro-RO', { minimumFractionDigits: 0 })}
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center border-2 border-red-200 dark:border-red-800">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">📉 LUNA CEA MAI SLABĂ</div>
                  <div className="text-xl font-bold text-red-700 dark:text-red-300">
                    {worstMonth?.fullMonthName || 'N/A'}
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-2">
                    €{worstMonth?.totalInvoiced.toLocaleString('ro-RO', { minimumFractionDigits: 0 }) || '0'}
                  </div>
                </div>
              </div>
              
              {/* Top 5 Best Months Table */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top 5 Luni cu Cele Mai Mari Facturi
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-foreground/80">Poziție</th>
                        <th className="text-left p-3 font-medium text-foreground/80">Luna</th>
                        <th className="text-right p-3 font-medium text-foreground/80">Sumă Facturată</th>
                        <th className="text-center p-3 font-medium text-foreground/80">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMonths.slice(0, 5).map((month: any, index: number) => {
                        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                        const colors = ['text-yellow-600 dark:text-yellow-400', 'text-gray-500 dark:text-gray-400', 'text-amber-600 dark:text-amber-400', 'text-blue-600 dark:text-blue-400', 'text-purple-600 dark:text-purple-400'];
                        
                        return (
                          <tr key={month.monthKey} className={`border-b border-border hover:bg-muted/50 transition-colors ${
                            index === 0 ? 'bg-green-50 dark:bg-green-900/20' : ''
                          }`}>
                            <td className="p-3 font-bold text-xl text-foreground">{medals[index]}</td>
                            <td className="p-3 font-medium text-foreground">{month.fullMonthName}</td>
                            <td className="p-3 text-right font-mono text-lg text-foreground">
                              €{month.totalInvoiced.toLocaleString('ro-RO', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`font-bold ${colors[index]}`}>
                                {index === 0 ? 'EXCELENT' : index === 1 ? 'FOARTE BUN' : index === 2 ? 'BUN' : 'OK'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Yearly Analysis Section */}
      {(dataBy2024.length > 0 || dataBy2025.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Comparație Lunară - 2024 vs 2025
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Analiză side-by-side a performanței pentru fiecare lună din an
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyComparisonData.map((month) => (
                  <div key={month.monthKey} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {month.monthName}
                        {month.winner !== 'tie' && (
                          <span className={`ml-2 text-sm font-medium ${
                            month.winner === '2025' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {month.winner === '2025' ? '↗️ 2025 câștigă' : '⬇️ 2024 mai bun'}
                          </span>
                        )}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {month.total2024 > 0 && month.total2025 > 0 && (
                          <span className={`font-medium ${
                            month.percentageChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {month.percentageChange > 0 ? '+' : ''}{month.percentageChange.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Split Progress Bars for 2024 and 2025 */}
                    <div className="space-y-3">
                      {/* 2024 Section */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm font-medium text-blue-700 dark:text-blue-300">
                          2024
                        </div>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                          {month.hasData2024 && (
                            <div 
                              className="bg-blue-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${month.progress2024}%` }}
                            >
                              <span className="text-white text-xs font-medium">
                                €{month.total2024.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          )}
                          {!month.hasData2024 && (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-xs">
                              Fără date
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2025 Section */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm font-medium text-green-700 dark:text-green-300">
                          2025
                        </div>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                          {month.hasData2025 && (
                            <div 
                              className="bg-green-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                              style={{ width: `${month.progress2025}%` }}
                            >
                              <span className="text-white text-xs font-medium">
                                €{month.total2025.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          )}
                          {!month.hasData2025 && (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-xs">
                              Fără date
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Difference Display */}
                    {month.difference > 0 && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-muted-foreground">
                          Diferența: €{month.difference.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Year Summary Cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border-2 border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">📊 ANUL 2024</div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {dataBy2024.length} luni active
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    €{total2024.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Media: €{avg2024.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}/lună
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border-2 border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">🚀 ANUL 2025</div>
                  <div className="text-xl font-bold text-green-700 dark:text-green-300">
                    {dataBy2025.length} luni active
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    €{total2025.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Media: €{avg2025.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}/lună
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toFixed(2)}`, '']} 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{
                      color: 'hsl(var(--foreground))',
                      fontWeight: '600'
                    }}
                  />
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
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toFixed(2)}`, 'Facturat']} 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{
                      color: 'hsl(var(--foreground))',
                      fontWeight: '600'
                    }}
                  />
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
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toFixed(2)}`, 'Sumă']} 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{
                      color: 'hsl(var(--foreground))',
                      fontWeight: '600'
                    }}
                  />
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
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium text-foreground/80">Săptămână</th>
                      <th className="text-right p-3 font-medium text-foreground/80">Sumă Facturată</th>
                      <th className="text-right p-3 font-medium text-foreground/80">Tendință</th>
                      <th className="text-right p-3 font-medium text-foreground/80">Schimbare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyInvoicedData
                      .slice(-8) // Show last 8 weeks
                      .reverse() // Most recent first
                      .map((week: any, index: number) => {
                        const isIncreasing = week.trend > 0;
                        const isDecreasing = week.trend < 0;
                        const trendColor = isIncreasing ? 'text-green-600 dark:text-green-400' : isDecreasing ? 'text-red-600 dark:text-red-400' : 'text-foreground/60';
                        const trendIcon = isIncreasing ? '↗️' : isDecreasing ? '↘️' : '→';
                        
                        return (
                          <tr key={week.weekLabel} className={`border-b border-border hover:bg-muted/50 transition-colors ${
                            index === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}>
                            <td className="p-3 font-medium text-foreground">
                              {week.weekLabel}
                              {index === 0 && (
                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                  Cea mai recentă
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono text-lg text-foreground">
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
                                    <div className="text-xs text-foreground/60 mt-1">
                                      Scădere detecată!
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-foreground/60">Prima săptămână</span>
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

      {/* AI-Powered Business Intelligence Analysis */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
          <CardHeader>
            <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Target className="h-5 w-5" />
              🤖 Analiză Inteligentă AI - Insights Strategice
            </CardTitle>
            <p className="text-sm text-muted-foreground">Analize avansate bazate pe datele tale de business</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Growth Analysis */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">📈 Analiza Creșterii</h3>
              <div className="space-y-2 text-sm">
                {dataBy2025.length > 0 && dataBy2024.length > 0 && (
                  <p>
                    <strong>Trend pozitiv:</strong> În 2025 ai procesat deja {dataBy2025.length} luni cu o medie de{' '}
                    <span className="text-green-600 font-semibold">€{avg2025.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}</span> pe lună,
                    comparativ cu media de €{avg2024.toLocaleString('ro-RO', { minimumFractionDigits: 0 })} din 2024
                    ({avg2025 > avg2024 ? `+${((avg2025 - avg2024) / avg2024 * 100).toFixed(1)}% creștere` : 
                    `${((avg2025 - avg2024) / avg2024 * 100).toFixed(1)}% scădere`}).
                  </p>
                )}
                <p>
                  <strong>Volum de business:</strong> Cu un total facturat de{' '}
                  <span className="text-blue-600 font-semibold">€{totalInvoiced.toLocaleString('ro-RO')}</span> și o rată de colectare de{' '}
                  <span className="text-green-600 font-semibold">{((correctedTotalPaid / totalInvoiced) * 100).toFixed(1)}%</span>,
                  performance-ul financiar este {((correctedTotalPaid / totalInvoiced) * 100) > 90 ? 'excelent' : 
                  ((correctedTotalPaid / totalInvoiced) * 100) > 75 ? 'bun' : 'sub așteptări'}.
                </p>
              </div>
            </div>

            {/* Company Performance Analysis */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">🏢 Analiza Portfolio Companii</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Concentrarea riscului:</strong> Top 3 companii ({companyPerformanceData.slice(0, 3).map(c => c.fullName).join(', ')})
                  reprezintă{' '}
                  <span className="font-semibold">
                    {((companyPerformanceData.slice(0, 3).reduce((sum, c) => sum + c.invoiced, 0) / totalInvoiced) * 100).toFixed(1)}%
                  </span>{' '}
                  din total. {((companyPerformanceData.slice(0, 3).reduce((sum, c) => sum + c.invoiced, 0) / totalInvoiced) * 100) > 70 ? 
                  'Concentrare ridicată - consideră diversificarea.' : 'Distribuție echilibrată a riscului.'}
                </p>
                {companyPerformanceData.length > 0 && (
                  <p>
                    <strong>Top performer:</strong> {companyPerformanceData[0].fullName} generează{' '}
                    <span className="text-green-600 font-semibold">
                      €{companyPerformanceData[0].invoiced.toLocaleString('ro-RO', { minimumFractionDigits: 0 })}
                    </span>{' '}
                    ({((companyPerformanceData[0].invoiced / totalInvoiced) * 100).toFixed(1)}% din total).
                  </p>
                )}
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">💡 Recomandări Strategice</h3>
              <div className="space-y-2 text-sm">
                {totalRemaining > 0 ? (
                  <p>🔴 <strong>Prioritate înaltă:</strong> Există €{totalRemaining.toFixed(2)} restanțe care afectează cash flow-ul. Implementează un sistem de urmărire agresiv.</p>
                ) : (
                  <p>✅ <strong>Excelent:</strong> Nu există restanțe semnificative - cash flow-ul este sănătos.</p>
                )}
                
                {monthlyComparisonData.length > 0 && (
                  <>
                    {monthlyComparisonData.filter(m => m.winner === '2025' && m.hasData2024 && m.hasData2025).length > 0 ? (
                      <p>📈 <strong>Momentum pozitiv:</strong> {monthlyComparisonData.filter(m => m.winner === '2025' && m.hasData2024 && m.hasData2025).length} luni din 2025 depășesc performanța din 2024.</p>
                    ) : dataBy2025.length > 0 ? (
                      <p>⚠️ <strong>Atenție:</strong> Performanța din 2025 este sub nivelul din 2024 - analizează cauzele și implementează măsuri corective.</p>
                    ) : null}
                  </>
                )}

                <p>🎯 <strong>Obiectiv recomandat:</strong> Pentru a menține creșterea, țintește o medie lunară de{' '}
                <span className="text-purple-600 font-semibold">€{(avg2024 * 1.15).toLocaleString('ro-RO', { minimumFractionDigits: 0 })}</span>{' '}
                (+15% față de 2024).</p>
              </div>
            </div>

            {/* Seasonal Insights */}
            {weeklyInvoicedData.length > 5 && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                <h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">📅 Patterns Sezoniere</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Variabilitate săptămânală:</strong> Între{' '}
                    <span className="text-green-600">€{Math.min(...weeklyInvoicedData.map((w: any) => w.totalInvoiced)).toLocaleString('ro-RO', { minimumFractionDigits: 0 })}</span> și{' '}
                    <span className="text-blue-600">€{Math.max(...weeklyInvoicedData.map((w: any) => w.totalInvoiced)).toLocaleString('ro-RO', { minimumFractionDigits: 0 })}</span>.
                    {Math.max(...weeklyInvoicedData.map((w: any) => w.totalInvoiced)) / Math.min(...weeklyInvoicedData.map((w: any) => w.totalInvoiced)) > 2 ? 
                    ' Variabilitate mare - optimizează planificarea.' : ' Consistență bună în operațiuni.'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Alerts */}
      {overdueBalances > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
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