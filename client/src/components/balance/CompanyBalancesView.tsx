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

// Helper function to fix Romanian diacritics for PDF generation
const fixRomanianText = (text: string): string => {
  return text
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a') 
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/Ă/g, 'A')
    .replace(/Â/g, 'A')
    .replace(/Î/g, 'I')
    .replace(/Ș/g, 'S')
    .replace(/Ț/g, 'T');
};
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, TrendingUp, TrendingDown, AlertCircle, CheckCircle, DollarSign, RefreshCw, Trash2, AlertTriangle, FileText } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from "framer-motion";
import type { CompanyBalance } from "@shared/schema";

interface PaymentModalProps {
  balance: CompanyBalance;
  isOpen: boolean;
  onClose: () => void;
}

interface DeletePaymentModalProps {
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
      // Invalidate all relevant queries to update StatusCards and other components
      queryClient.invalidateQueries({ queryKey: ['/api/company-balances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-processing'] });
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
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">✓ Plătit complet</Badge>;
    case 'partial':
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">⚡ Plată parțială</Badge>;
    default:
      return <Badge variant="destructive">⏳ Neplătit</Badge>;
  }
}

function DeletePaymentModal({ balance, isOpen, onClose }: DeletePaymentModalProps) {
  const [deleteAmount, setDeleteAmount] = useState("");
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch(`/api/company-balances/payment/${encodeURIComponent(balance.companyName)}/${encodeURIComponent(balance.weekLabel)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentAmount: amount
        })
      });
      if (!response.ok) {
        throw new Error('Failed to delete payment');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Plată ștearsă",
        description: data.message || `Plată de ${formatCurrency(parseFloat(deleteAmount))} ștearsă cu succes.`,
      });
      // Invalidate all relevant queries to update StatusCards and other components
      queryClient.invalidateQueries({ queryKey: ['/api/company-balances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-processing'] });
      onClose();
      setDeleteAmount("");
    },
    onError: (error) => {
      toast({
        title: "Eroare la ștergerea plății",
        description: "Nu s-a putut șterge plata. Încercați din nou.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(deleteAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Sumă invalidă",
        description: "Introduceți o sumă validă.",
        variant: "destructive",
      });
      return;
    }
    
    const currentPaid = parseFloat(balance.totalPaid || '0');
    if (amount > currentPaid) {
      toast({
        title: "Sumă prea mare",
        description: `Nu puteți șterge mai mult de ${formatCurrency(currentPaid)} (suma plătită).`,
        variant: "destructive",
      });
      return;
    }
    
    deleteMutation.mutate(amount);
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
            Corectați o plată greșită pentru <strong>{balance.companyName}</strong> în săptămâna <strong>{balance.weekLabel}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deleteAmount" className="text-right">
                Suma de șters
              </Label>
              <Input
                id="deleteAmount"
                type="number"
                step="0.01"
                min="0"
                max={parseFloat(balance.totalPaid || '0')}
                value={deleteAmount}
                onChange={(e) => setDeleteAmount(e.target.value)}
                className="col-span-3"
                placeholder="0.00"
                required
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Suma plătită total: {formatCurrency(parseFloat(balance.totalPaid || '0'))}
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="text-sm text-orange-700 dark:text-orange-300">
                💡 <strong>Ce se întâmplă:</strong>
                <br />• Suma plătită va scădea cu valoarea introdusă
                <br />• Balanța restantă va crește corespunzător  
                <br />• Statusul se va actualiza automat (Neplătit/Parțial/Complet)
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Anulare
            </Button>
            <Button type="submit" variant="destructive" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Se șterge..." : "Șterge plata"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CompanyBalancesView() {
  const [selectedBalance, setSelectedBalance] = useState<CompanyBalance | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { toast } = useToast();

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

  // Parse Romanian date format "DD mmm. - DD mmm." to comparable date
  const parseRomanianWeekDate = (weekLabel: string): Date => {
    // Extract start date from "DD mmm. - DD mmm." format
    const startDateStr = weekLabel.split(' - ')[0];
    const monthMap: Record<string, number> = {
      'ian': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mai': 4, 'iun': 5,
      'iul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'noi': 10, 'dec': 11
    };
    
    const parts = startDateStr.split(' ');
    const day = parseInt(parts[0]);
    const monthStr = parts[1].replace('.', '');
    const month = monthMap[monthStr] ?? 0;
    const year = 2025; // Assuming current year
    
    return new Date(year, month, day);
  };

  // Group balances by company and sort each company's balances chronologically (most recent first)
  const balancesByCompany = (balances as CompanyBalance[]).reduce((acc: Record<string, CompanyBalance[]>, balance: CompanyBalance) => {
    if (!acc[balance.companyName]) {
      acc[balance.companyName] = [];
    }
    acc[balance.companyName].push(balance);
    return acc;
  }, {});

  // Sort balances within each company by date (newest first - inverse chronological)
  Object.keys(balancesByCompany).forEach(companyName => {
    balancesByCompany[companyName].sort((a, b) => {
      const dateA = parseRomanianWeekDate(a.weekLabel);
      const dateB = parseRomanianWeekDate(b.weekLabel);
      return dateB.getTime() - dateA.getTime(); // Newest first (inverse chronological)
    });
  });

  // Calculate totals
  const totalOutstanding = (balances as CompanyBalance[]).reduce((sum: number, balance: CompanyBalance) => 
    sum + parseFloat(balance.outstandingBalance || '0'), 0);
  const totalInvoiced = (balances as CompanyBalance[]).reduce((sum: number, balance: CompanyBalance) => 
    sum + parseFloat(balance.totalInvoiced || '0'), 0);
  const totalPaid = (balances as CompanyBalance[]).reduce((sum: number, balance: CompanyBalance) => 
    sum + parseFloat(balance.totalPaid || '0'), 0);

  const generateBalances = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/company-balances/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to generate balances');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all relevant queries after balance regeneration
      queryClient.invalidateQueries({ queryKey: ['/api/company-balances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-processing'] });
      toast({
        title: "Succes",
        description: "Bilanțurile au fost regenerate din datele calendarul și plăților",
      });
    },
    onError: () => {
      toast({
        title: "Eroare",
        description: "Nu s-au putut genera bilanțurile",
        variant: "destructive",
      });
    },
  });

  const handlePaymentClick = (balance: CompanyBalance) => {
    setSelectedBalance(balance);
    setIsPaymentModalOpen(true);
  };

  const handleDeleteClick = (balance: CompanyBalance) => {
    setSelectedBalance(balance);
    setIsDeleteModalOpen(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    
    // Logo și antet
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('SISTEMA TRANSPORT', 20, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(fixRomanianText('Bilanțuri Companii - Situația Restanțelor'), 20, 35);
    
    doc.setFontSize(10);
    doc.text(`Generat: ${new Date().toLocaleDateString('ro-RO')} ${new Date().toLocaleTimeString('ro-RO')}`, 20, 45);
    
    // Linie separatoare
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 50, 190, 50);
    
    let yPosition = 65;
    
    // Sumar general
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('SUMAR GENERAL', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total facturat: ${formatCurrency(totalInvoiced)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Total încasat: ${formatCurrency(totalPaid)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`De încasat: ${formatCurrency(totalOutstanding)}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Companii cu restanțe: ${Object.entries(balancesByCompany).filter(([_, balances]) => balances.some(b => parseFloat(b.outstandingBalance || '0') > 0)).length}`, 20, yPosition);
    yPosition += 15;
    
    // Sumar pe companii - doar cele cu restanțe
    const companiesWithOutstanding = Object.entries(balancesByCompany)
      .map(([companyName, companyBalances]) => {
        const companyTotalOutstanding = companyBalances.reduce((sum, balance) => 
          sum + parseFloat(balance.outstandingBalance || '0'), 0);
        const companyTotalInvoiced = companyBalances.reduce((sum, balance) => 
          sum + parseFloat(balance.totalInvoiced || '0'), 0);
        const companyTotalPaid = companyBalances.reduce((sum, balance) => 
          sum + parseFloat(balance.totalPaid || '0'), 0);
        
        return {
          companyName,
          totalOutstanding: companyTotalOutstanding,
          totalInvoiced: companyTotalInvoiced,
          totalPaid: companyTotalPaid,
          weeksCount: companyBalances.length
        };
      })
      .filter(company => company.totalOutstanding > 0)
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    
    if (companiesWithOutstanding.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('COMPANII CU RESTANȚE', 20, yPosition);
      yPosition += 10;
      
      const companyData = companiesWithOutstanding.map(company => [
        company.companyName,
        company.weeksCount.toString(),
        formatCurrency(company.totalInvoiced),
        formatCurrency(company.totalPaid),
        formatCurrency(company.totalOutstanding)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Companie', 'Săpt.', 'Total Facturat', 'Total Plătit', 'De Încasat']],
        body: companyData,
        theme: 'striped',
        headStyles: { fillColor: [220, 53, 69], textColor: 255 },
        styles: { fontSize: 9, halign: 'left' },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold', textColor: [220, 53, 69] }
        }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }
    
    // Verificare dacă avem loc pentru următoarea secțiune
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 25;
    }
    
    // Detaliul complet - toate bilanțurile
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('DETALIU COMPLET - TOATE BILANȚURILE', 20, yPosition);
    yPosition += 10;
    
    // Creăm datele pentru tabelul detaliat
    const detailData: string[][] = [];
    Object.entries(balancesByCompany).forEach(([companyName, companyBalances]) => {
      companyBalances.forEach(balance => {
        const status = balance.paymentStatus === 'paid' ? '✓ Plătit' : 
                      balance.paymentStatus === 'partial' ? '⚡ Parțial' : '⏳ Neplătit';
        
        detailData.push([
          companyName,
          balance.weekLabel,
          formatCurrency(parseFloat(balance.totalInvoiced || '0')),
          formatCurrency(parseFloat(balance.totalPaid || '0')),
          formatCurrency(parseFloat(balance.outstandingBalance || '0')),
          status
        ]);
      });
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Companie', 'Săptămâna', 'Facturat', 'Plătit', 'Restant', 'Status']],
      body: detailData,
      theme: 'striped',
      headStyles: { 
        fillColor: [52, 152, 219], 
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 8, 
        halign: 'left',
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 22 }
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
      // Colorare condițională pentru rânduri
      didParseCell: function (data) {
        if (data.column.index === 4) { // Coloana "Restant"
          const amount = parseFloat(data.cell.text[0].replace(/[^\d.-]/g, ''));
          if (amount > 0) {
            data.cell.styles.textColor = [220, 53, 69]; // Roșu pentru restanțe
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [40, 167, 69]; // Verde pentru zero
          }
        }
      }
    });
    
    // Footer pe fiecare pagină
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linie footer
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 20, 190, pageHeight - 20);
      
      // Text footer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(fixRomanianText('Sistema Transport - Bilanțuri Companii'), 20, pageHeight - 12);
      doc.text(`Pagina ${i} din ${pageCount}`, 190 - 30, pageHeight - 12);
    }
    
    // Salvare PDF
    doc.save(fixRomanianText(`bilante_companii_${new Date().toISOString().split('T')[0]}.pdf`));
    
    toast({
      title: "PDF generat cu succes",
      description: `Bilanțurile companiilor au fost salvate ca PDF (${Object.keys(balancesByCompany).length} companii incluse)`,
    });
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

      {/* Header with Generate Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bilanțuri pe Companii</h3>
        <div className="flex gap-2">
          <Button
            onClick={generatePDF}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="sm"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={() => generateBalances.mutate()}
            disabled={generateBalances.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            {generateBalances.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generez...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizează cu Calendarul
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Company Balances */}
      <div className="space-y-4">
        
        {Object.entries(balancesByCompany).map(([companyName, companyBalances]: [string, CompanyBalance[]], index) => {
          // Calculate total outstanding for this company
          const companyTotalOutstanding = companyBalances.reduce((sum, balance) => 
            sum + parseFloat(balance.outstandingBalance || '0'), 0);
          
          // Create unique key using company name and first balance ID or week label
          const uniqueKey = companyBalances.length > 0 
            ? `${companyName}-${companyBalances[0].id || companyBalances[0].weekLabel}-${index}`
            : `${companyName}-${index}`;
          
          return (
          <motion.div
            key={uniqueKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {companyName}
                    </CardTitle>
                    <CardDescription>
                      {companyBalances.length} săptămână{companyBalances.length !== 1 ? 'i' : ''}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Total de încasat</div>
                    <div className={`text-lg font-bold ${
                      companyTotalOutstanding > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency(companyTotalOutstanding)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyBalances.map((balance) => (
                    <div key={`${balance.companyName}-${balance.weekLabel}`} 
                         className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(balance.paymentStatus || 'pending')}
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
                          {getStatusBadge(balance.paymentStatus || 'pending')}
                        </div>
                        <div className="flex gap-2">
                          {parseFloat(balance.outstandingBalance || '0') > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePaymentClick(balance)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Înregistrează plată
                            </Button>
                          )}
                          {parseFloat(balance.totalPaid || '0') > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(balance)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Șterge plată
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          );
        })}

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
        <>
          <PaymentModal
            balance={selectedBalance}
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedBalance(null);
            }}
          />
          <DeletePaymentModal
            balance={selectedBalance}
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedBalance(null);
            }}
          />
        </>
      )}
    </div>
  );
}