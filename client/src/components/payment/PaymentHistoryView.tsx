import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, CreditCard, Search, Filter, Download, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { Payment } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

interface DeletePaymentModalProps {
  payment: Payment;
  isOpen: boolean;
  onClose: () => void;
}

function DeletePaymentModal({ payment, isOpen, onClose }: DeletePaymentModalProps) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error('Failed to delete payment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plată ștearsă",
        description: `Plata de ${formatCurrency(parseFloat(payment.amount))} pentru ${payment.companyName} a fost ștearsă.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company-balances'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Eroare la ștergerea plății",
        description: "Nu s-a putut șterge plata. Încercați din nou.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Ștergere Plată
          </DialogTitle>
          <DialogDescription>
            Sigur doriți să ștergeți această plată definitiv?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <div><strong>Companie:</strong> {payment.companyName}</div>
            <div><strong>Săptămâna:</strong> {payment.weekLabel}</div>
            <div><strong>Suma:</strong> {formatCurrency(parseFloat(payment.amount))}</div>
            <div><strong>Data:</strong> {formatDate(payment.paymentDate)}</div>
            {payment.description && <div><strong>Descriere:</strong> {payment.description}</div>}
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-4">
            <div className="text-sm text-red-600 dark:text-red-400">
              ⚠️ Această acțiune este permanentă și va recalcula automat bilanțele companiei.
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Anulare
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="destructive" 
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Se șterge..." : "Șterge definitiv"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentHistoryView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: async () => {
      const response = await fetch('/api/payments');
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refresh more frequently
  }) as { data: Payment[], isLoading: boolean };
  
  console.log('💳 Payments loaded:', payments.length, 'payments');

  // Fetch weekly processing data to get 7-day and 30-day details
  const { data: weeklyData = [] } = useQuery({
    queryKey: ['/api/weekly-processing'],
    queryFn: async () => {
      const response = await fetch('/api/weekly-processing');
      if (!response.ok) {
        throw new Error('Failed to fetch weekly data');
      }
      return response.json();
    },
    refetchInterval: 60000,
  });

  // Get unique companies and weeks for filters
  const uniqueCompanies = [...new Set(payments.map(p => p.companyName))].sort();
  const uniqueWeeks = [...new Set(payments.map(p => p.weekLabel))].sort();

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.weekLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (payment.description && payment.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCompany = selectedCompany === "all" || payment.companyName === selectedCompany;
    const matchesWeek = selectedWeek === "all" || payment.weekLabel === selectedWeek;
    
    return matchesSearch && matchesCompany && matchesWeek;
  }).sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()); // Latest payments at the bottom

  // Group payments by week
  const groupedByWeek = filteredPayments.reduce((acc, payment) => {
    const week = payment.weekLabel;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(payment);
    return acc;
  }, {} as Record<string, Payment[]>);

  // Sort weeks by most recent first
  const sortedWeeks = Object.keys(groupedByWeek).sort((a, b) => {
    const weekA = groupedByWeek[a][0];
    const weekB = groupedByWeek[b][0];
    return new Date(weekB.paymentDate).getTime() - new Date(weekA.paymentDate).getTime();
  });

  // Get weekly processing details for a specific week and company
  const getWeeklyDetails = (weekLabel: string, companyName: string) => {
    const weekData = weeklyData.find((w: any) => w.weekLabel === weekLabel);
    if (!weekData || !weekData.processedData) return null;
    
    const companyData = weekData.processedData[companyName];
    if (!companyData) return null;
    
    return {
      total7Days: companyData.Total_7_days || 0,
      total30Days: companyData.Total_30_days || 0,
      totalCommission: companyData.Total_comision || 0,
      totalInvoiced: (companyData.Total_7_days || 0) + (companyData.Total_30_days || 0),
      totalToPay: (companyData.Total_7_days || 0) + (companyData.Total_30_days || 0) - (companyData.Total_comision || 0)
    };
  };

  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const totalByCompany = filteredPayments.reduce((acc, payment) => {
    acc[payment.companyName] = (acc[payment.companyName] || 0) + parseFloat(payment.amount);
    return acc;
  }, {} as Record<string, number>);

  const handleDeleteClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Companie', 'Săptămâna', 'Suma', 'Descriere'];
    const csvData = [
      headers.join(','),
      ...filteredPayments.map(payment => [
        formatDate(payment.paymentDate),
        payment.companyName,
        payment.weekLabel,
        payment.amount,
        payment.description || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `istoric_plati_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Istoric Plăți</h1>
          <p className="text-muted-foreground">Toate plățile înregistrate în sistem</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Plăți</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valoare Totală</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Companii Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(totalByCompany).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Căutare</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Căutare..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="company">Companie</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Toate companiile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate companiile</SelectItem>
                  {uniqueCompanies.map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="week">Săptămâna</Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Toate săptămânile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate săptămânile</SelectItem>
                  {uniqueWeeks.map(week => (
                    <SelectItem key={week} value={week}>{week}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCompany("all");
                  setSelectedWeek("all");
                }}
                variant="outline"
                className="w-full"
              >
                Resetează filtrele
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List Grouped by Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Plăți pe Perioade Săptămânale ({filteredPayments.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nu s-au găsit plăți cu filtrele selectate</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedWeeks.map((weekLabel, weekIndex) => {
                const weekPayments = groupedByWeek[weekLabel];
                const weekTotal = weekPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
                const companiesInWeek = [...new Set(weekPayments.map(p => p.companyName))];
                
                return (
                  <motion.div
                    key={weekLabel}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: weekIndex * 0.1 }}
                    className="border rounded-xl overflow-hidden"
                  >
                    {/* Week Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            📅 {weekLabel}
                          </h3>
                          <p className="text-sm text-blue-600 dark:text-blue-300">
                            {weekPayments.length} plăți • {companiesInWeek.length} companii
                          </p>
                        </div>
                        
                        {/* Week Totals Summary */}
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(weekTotal)}
                            </div>
                            <p className="text-xs text-muted-foreground">Total Plăți</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Company Details for the Week */}
                      <div className="mt-4 space-y-2">
                        {companiesInWeek.map(companyName => {
                          const companyPayments = weekPayments.filter(p => p.companyName === companyName);
                          const companyPaidTotal = companyPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                          const weekDetails = getWeeklyDetails(weekLabel, companyName);
                          
                          return (
                            <div key={companyName} className="bg-white/10 dark:bg-black/10 rounded-lg p-3">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-white/20">
                                    {companyName}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {companyPayments.length} plată{companyPayments.length !== 1 ? 'i' : ''}
                                  </span>
                                </div>
                                
                                {weekDetails && (
                                  <div className="flex gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="font-medium text-blue-600 dark:text-blue-400">
                                        {formatCurrency(weekDetails.total7Days)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">7 zile</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-medium text-purple-600 dark:text-purple-400">
                                        {formatCurrency(weekDetails.total30Days)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">30 zile</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-medium text-red-600 dark:text-red-400">
                                        -{formatCurrency(weekDetails.totalCommission)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">Comision</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(weekDetails.totalToPay)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">De plată</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-medium text-green-600 dark:text-green-400">
                                        {formatCurrency(companyPaidTotal)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">Plătit</div>
                                    </div>
                                    <div className="text-center">
                                      <div className={`font-medium ${
                                        weekDetails.totalToPay - companyPaidTotal <= 1 
                                          ? 'text-green-600 dark:text-green-400' 
                                          : 'text-orange-600 dark:text-orange-400'
                                      }`}>
                                        {formatCurrency(Math.max(0, weekDetails.totalToPay - companyPaidTotal))}
                                      </div>
                                      <div className="text-xs text-muted-foreground">Rest</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Week Payments */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {weekPayments.map((payment, paymentIndex) => (
                        <motion.div
                          key={payment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (weekIndex * 0.1) + (paymentIndex * 0.05) }}
                          className="px-6 py-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="font-medium">
                                  {payment.companyName}
                                </Badge>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(payment.paymentDate)}
                                </div>
                              </div>
                              <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                                {formatCurrency(parseFloat(payment.amount))}
                              </div>
                              {payment.description && (
                                <div className="text-sm text-muted-foreground">
                                  💬 {payment.description}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(payment)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Șterge
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary by Company */}
      {Object.keys(totalByCompany).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sumar pe Companii - Situația Financiară</CardTitle>
            <CardDescription>
              Totaluri plătite și restul de încasat pentru fiecare companie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.entries(totalByCompany).map(([company, totalPaid]) => {
                // Calculate total amounts across all weeks for this company
                let totalInvoiced = 0;
                let totalToPay = 0;
                let totalCommission = 0;
                
                // Get all weeks where this company has data
                const companyWeeks = [...new Set(
                  filteredPayments
                    .filter(p => p.companyName === company)
                    .map(p => p.weekLabel)
                )];
                
                // Sum up all financial data for this company across weeks
                companyWeeks.forEach(weekLabel => {
                  const weekDetails = getWeeklyDetails(weekLabel, company);
                  if (weekDetails) {
                    totalInvoiced += weekDetails.totalInvoiced;
                    totalToPay += weekDetails.totalToPay;
                    totalCommission += weekDetails.totalCommission;
                  }
                });
                
                const remainingToPay = Math.max(0, totalToPay - totalPaid);
                const paymentProgress = totalToPay > 0 ? (totalPaid / totalToPay) * 100 : 100;
                
                return (
                  <div key={company} className="border rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">{company}</h3>
                      <Badge variant={remainingToPay <= 1 ? "default" : "secondary"}>
                        {remainingToPay <= 1 ? "Complet" : "În progres"}
                      </Badge>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progres plată</span>
                        <span>{paymentProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            remainingToPay <= 1 
                              ? 'bg-green-500' 
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, paymentProgress)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Financial Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total facturat:</span>
                        <span className="font-medium">{formatCurrency(totalInvoiced)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Comision:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(totalCommission)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-medium">De plată total:</span>
                        <span className="font-bold text-indigo-600">{formatCurrency(totalToPay)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Plătit deja:</span>
                        <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-bold">Rămâne de încasat:</span>
                        <span className={`font-bold text-lg ${
                          remainingToPay <= 1 
                            ? 'text-green-600' 
                            : 'text-orange-600'
                        }`}>
                          {formatCurrency(remainingToPay)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                      {filteredPayments.filter(p => p.companyName === company).length} plăți • {companyWeeks.length} săptămâni
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Overall Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(totalByCompany).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Companii Active</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Plătit</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      Object.entries(totalByCompany).reduce((total, [company, paid]) => {
                        const companyWeeks = [...new Set(
                          filteredPayments
                            .filter(p => p.companyName === company)
                            .map(p => p.weekLabel)
                        )];
                        
                        let companyTotalToPay = 0;
                        companyWeeks.forEach(weekLabel => {
                          const weekDetails = getWeeklyDetails(weekLabel, company);
                          if (weekDetails) {
                            companyTotalToPay += weekDetails.totalToPay;
                          }
                        });
                        
                        return total + Math.max(0, companyTotalToPay - paid);
                      }, 0)
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">De Încasat</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredPayments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Plăți</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Modal */}
      {selectedPayment && (
        <DeletePaymentModal
          payment={selectedPayment}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}