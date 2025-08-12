import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock, AlertTriangle, CheckCircle, Calendar, Database, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface YearEndClosureStatus {
  isComplete: boolean;
  message: string;
}

interface FiscalYearSummary {
  year: number;
  totalPayments: number;
  totalAmount: number;
  companiesCount: number;
  weeksProcessed: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export function YearEndClosurePanel() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check closure status
  const { data: closureStatus, isLoading: statusLoading } = useQuery<YearEndClosureStatus>({
    queryKey: ['/api/year-end-closure/status'],
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Get 2024 fiscal summary
  const { data: summary2024 } = useQuery<FiscalYearSummary>({
    queryKey: ['/api/fiscal-year-summary/2024'],
    enabled: closureStatus?.isComplete,
  });

  // Get 2025 fiscal summary
  const { data: summary2025 } = useQuery<FiscalYearSummary>({
    queryKey: ['/api/fiscal-year-summary/2025'],
    enabled: closureStatus?.isComplete,
  });

  // Perform year-end closure mutation
  const closureMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/year-end-closure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to perform year-end closure');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Închidere anuală completă",
        description: "Datele din 2024 au fost sigilate și contoarele pentru 2025 resetate.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/year-end-closure/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fiscal-year-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company-balances'] });
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Eroare la închiderea anuală",
        description: error.message || "Nu s-a putut efectua închiderea anuală.",
        variant: "destructive",
      });
    },
  });

  const handlePerformClosure = () => {
    closureMutation.mutate();
  };

  if (statusLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sistemul de Închidere Anuală
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Închidere An Fiscal 2024
          </CardTitle>
          <CardDescription>
            Sigilează datele din 2024 ca istoric și resetează contoarele pentru anul fiscal 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {closureStatus?.isComplete ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Închiderea anuală a fost efectuată cu succes
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Datele din 2024 sunt acum sigilate ca istoric
                  </p>
                </div>
              </div>
              
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                ✅ Sistemul fiscal funcționează corect cu separare de ani
              </Badge>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Închiderea anuală nu a fost încă efectuată
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-300">
                    Datele din 2024 și 2025 se amestecă în calculele curente
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Ce face închiderea anuală:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Sigilează toate datele din 2024 ca "istorice" și nemodificabile
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Resetează contoarele pentru anul fiscal 2025
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Separă calculele financiare între anii fiscali
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Previne confuzia cu totalurile "Mai mult încasat decât facturat"
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => setShowConfirmDialog(true)}
                className="w-full"
                size="lg"
              >
                <Lock className="h-4 w-4 mr-2" />
                Efectuează Închiderea Anuală 2024
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Fiscal Year Summaries */}
      {(summary2024 || summary2025) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {summary2024 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rezumat 2024 (Istoric)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Plăți</p>
                    <p className="text-2xl font-bold">{summary2024.totalPayments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sumă Totală</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary2024.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Companii</p>
                    <p className="text-lg font-semibold">{summary2024.companiesCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Săptămâni</p>
                    <p className="text-lg font-semibold">{summary2024.weeksProcessed}</p>
                  </div>
                </div>
                <Badge variant="outline" className="w-full justify-center">
                  🔒 Date Sigilate - Istoric
                </Badge>
              </CardContent>
            </Card>
          )}

          {summary2025 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rezumat 2025 (Activ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Plăți</p>
                    <p className="text-2xl font-bold text-green-600">{summary2025.totalPayments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sumă Totală</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary2025.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Companii</p>
                    <p className="text-lg font-semibold">{summary2025.companiesCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Săptămâni</p>
                    <p className="text-lg font-semibold">{summary2025.weeksProcessed}</p>
                  </div>
                </div>
                <Badge variant="default" className="w-full justify-center">
                  🚀 An Fiscal Activ
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmare Închidere Anuală
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <p>
                  Ești pe cale să efectuezi închiderea anuală pentru 2024. Această acțiune va:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Sigila toate datele din 2024 ca fiind "istorice" și nemodificabile</li>
                    <li>Reseta contoarele pentru anul fiscal 2025</li>
                    <li>Separa calculele financiare între anii fiscali</li>
                    <li>Rezolva problema "mai mult încasat decât facturat"</li>
                  </ul>
                </div>
                <div className="text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                  ⚠️ Această acțiune nu poate fi anulată!
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Anulează
            </Button>
            <Button 
              onClick={handlePerformClosure}
              disabled={closureMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {closureMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesez...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Confirmă Închiderea
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}