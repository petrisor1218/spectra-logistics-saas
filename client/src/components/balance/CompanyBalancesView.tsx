import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
// Temporary local formatter until the file is properly created
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, TrendingUp, TrendingDown, AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import type { CompanyBalance } from "@shared/schema";

interface PaymentModalProps {
  balance: CompanyBalance;
  isOpen: boolean;
  onClose: () => void;
}

function PaymentModal({ balance, isOpen, onClose }: PaymentModalProps) {
  const [paidAmount, setPaidAmount] = useState("");
  const { toast } = useToast();

  const paymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch("/api/company-balances/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: balance.companyName,
          weekLabel: balance.weekLabel,
          paidAmount: amount
        })
      });
      if (!response.ok) {
        throw new Error('Failed to update payment');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plată înregistrată",
        description: `Plata de ${formatCurrency(parseFloat(paidAmount))} a fost înregistrată cu succes.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/company-balances'] });
      onClose();
      setPaidAmount("");
    },
    onError: (error) => {
      toast({
        title: "Eroare la înregistrarea plății",
        description: "Nu s-a putut înregistra plata. Încercați din nou.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Sumă invalidă",
        description: "Introduceți o sumă validă.",
        variant: "destructive",
      });
      return;
    }
    paymentMutation.mutate(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Înregistrare Plată</DialogTitle>
          <DialogDescription>
            Înregistrați o plată pentru {balance.companyName} - {balance.weekLabel}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Suma plătită
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={parseFloat(balance.outstandingBalance)}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
                required
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Suma restantă: {formatCurrency(parseFloat(balance.outstandingBalance))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Anulare
            </Button>
            <Button type="submit" disabled={paymentMutation.isPending}>
              {paymentMutation.isPending ? "Se înregistrează..." : "Înregistrează plata"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'partial':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    default:
      return <TrendingDown className="h-5 w-5 text-red-500" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Plătit</Badge>;
    case 'partial':
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Parțial</Badge>;
    default:
      return <Badge variant="destructive">În așteptare</Badge>;
  }
}

export default function CompanyBalancesView() {
  const [selectedBalance, setSelectedBalance] = useState<CompanyBalance | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['/api/company-balances'],
    queryFn: async () => {
      const response = await fetch('/api/company-balances');
      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  }) as { data: CompanyBalance[], isLoading: boolean };

  // Group balances by company
  const balancesByCompany = (balances as CompanyBalance[]).reduce((acc: Record<string, CompanyBalance[]>, balance: CompanyBalance) => {
    if (!acc[balance.companyName]) {
      acc[balance.companyName] = [];
    }
    acc[balance.companyName].push(balance);
    return acc;
  }, {});

  // Calculate totals
  const totalOutstanding = (balances as CompanyBalance[]).reduce((sum: number, balance: CompanyBalance) => 
    sum + parseFloat(balance.outstandingBalance || '0'), 0);
  const totalInvoiced = (balances as CompanyBalance[]).reduce((sum: number, balance: CompanyBalance) => 
    sum + parseFloat(balance.totalInvoiced || '0'), 0);
  const totalPaid = (balances as CompanyBalance[]).reduce((sum: number, balance: CompanyBalance) => 
    sum + parseFloat(balance.totalPaid || '0'), 0);

  const handlePaymentClick = (balance: CompanyBalance) => {
    setSelectedBalance(balance);
    setIsPaymentModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturat</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(totalInvoiced)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Încasat</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(totalPaid)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">De Încasat</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(totalOutstanding)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Company Balances */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Bilanțuri pe Companii</h3>
        
        {Object.entries(balancesByCompany).map(([companyName, companyBalances]: [string, CompanyBalance[]], index) => (
          <motion.div
            key={companyName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {companyName}
                </CardTitle>
                <CardDescription>
                  {companyBalances.length} săptămână{companyBalances.length !== 1 ? 'i' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyBalances.map((balance) => (
                    <div key={`${balance.companyName}-${balance.weekLabel}`} 
                         className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(balance.paymentStatus)}
                        <div>
                          <div className="font-medium">{balance.weekLabel}</div>
                          <div className="text-sm text-muted-foreground">
                            Facturat: {formatCurrency(parseFloat(balance.totalInvoiced || '0'))} | 
                            Plătit: {formatCurrency(parseFloat(balance.totalPaid || '0'))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(parseFloat(balance.outstandingBalance || '0'))}
                          </div>
                          {getStatusBadge(balance.paymentStatus)}
                        </div>
                        {parseFloat(balance.outstandingBalance || '0') > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePaymentClick(balance)}
                            className="ml-2"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Înregistrează plată
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {Object.keys(balancesByCompany).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nu există bilanțuri înregistrate încă.
              </p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Bilanțurile se vor crea automat când procesați date săptămânale.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Modal */}
      {selectedBalance && (
        <PaymentModal
          balance={selectedBalance}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedBalance(null);
          }}
        />
      )}
    </div>
  );
}