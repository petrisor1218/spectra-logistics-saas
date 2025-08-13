import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield, 
  Download, 
  Clock, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  History,
  HardDrive,
  FileDown
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function Backup() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: backupHistory = [], refetch } = useQuery({
    queryKey: ['/api/backup/history'],
    queryFn: async () => {
      const response = await fetch('/api/backup/history');
      if (!response.ok) throw new Error('Failed to fetch backup history');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup Created",
        description: "Database backup was created successfully",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Function to download backup file
  const downloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/backup/download/${filename}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Backup descărcat",
        description: `Fișierul ${filename} a fost descărcat cu succes`,
      });
    } catch (error) {
      toast({
        title: "Eroare la descărcare",
        description: "Nu s-a putut descărca backup-ul",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'Invalid Date';
    return format(parsedDate, 'dd MMM yyyy, HH:mm', { locale: ro });
  };

  const latestBackup = backupHistory[0];
  const totalBackups = backupHistory.length;
  const totalSize = backupHistory.reduce((sum: number, backup: any) => {
    if (!backup.size) return sum;
    const sizeValue = parseFloat(backup.size.toString().replace(/[^\d.]/g, ''));
    return sum + (isNaN(sizeValue) ? 0 : sizeValue);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Backup & Security
            </h1>
            <p className="text-muted-foreground">Gestiunea backup-urilor automate și securitatea datelor</p>
          </div>
          <Button 
            onClick={() => createBackupMutation.mutate()}
            disabled={createBackupMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createBackupMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Creează Backup Manual
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ultimul Backup</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestBackup ? formatDate(latestBackup.timestamp) : 'Nu există'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {latestBackup ? `${latestBackup.size}` : 'Creează primul backup'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backup-uri</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBackups}</div>
                <p className="text-xs text-muted-foreground">
                  Păstrate automat ultimele 10
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spațiu Utilizat</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSize.toFixed(1)} MB</div>
                <p className="text-xs text-muted-foreground">
                  Pe toate backup-urile
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Sistem</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Activ</div>
                <p className="text-xs text-muted-foreground">
                  Backup automat zilnic la 02:00
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configurări Backup Automat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Frecvență</h4>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Zilnic la 02:00 AM</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Retenție</h4>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Ultimele 10 backup-uri</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Include</h4>
                <div className="space-y-1 text-sm">
                  <div>✓ Date utilizatori</div>
                  <div>✓ Companii și șoferi</div>
                  <div>✓ Procesări săptămânale</div>
                  <div>✓ Istoric plăți</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Istoric Backup-uri ({totalBackups})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {backupHistory.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nu există backup-uri create încă</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Folosește butonul "Creează Backup Manual" pentru primul backup
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {backupHistory.map((backup: any, index: number) => (
                  <motion.div
                    key={backup.filename}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{backup.filename}</span>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">Cel mai recent</Badge>
                          )}
                          {backup.error && (
                            <Badge variant="destructive" className="text-xs">Eroare</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(backup.createdAt || backup.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            {backup.records} înregistrări
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {backup.size}
                          </span>
                        </div>
                        {backup.error && (
                          <div className="text-sm text-red-600 mt-1">
                            {backup.error}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {backup.createdBy}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBackup(backup.filename)}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          Descarcă
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recomandări de Securitate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700 dark:text-amber-300">
            <ul className="space-y-2 text-sm">
              <li>• Backup-urile sunt create automat zilnic pentru siguranță maximă</li>
              <li>• Se păstrează ultimele 10 backup-uri pentru economisirea spațiului</li>
              <li>• Pentru securitate suplimentară, consideră exportarea backup-urilor pe drive extern</li>
              <li>• Verifică periodic că backup-urile sunt create cu succes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}