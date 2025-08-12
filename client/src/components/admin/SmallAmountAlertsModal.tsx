import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, Clock, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SmallAmountAlert {
  id: number;
  vrid: string;
  companyName: string;
  invoiceType: '7-day' | '30-day';
  initialAmount: string;
  realAmount?: string;
  weekDetected: string;
  weekResolved?: string;
  status: 'pending' | 'resolved' | 'ignored';
  notes?: string;
  detectedAt: string;
  resolvedAt?: string;
}

interface SmallAmountAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmallAmountAlertsModal({ isOpen, onClose }: SmallAmountAlertsModalProps) {
  const [showResolved, setShowResolved] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingAlert, setEditingAlert] = useState<number | null>(null);
  const [resolveData, setResolveData] = useState({ realAmount: '', weekResolved: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    vrid: '',
    companyName: '',
    invoiceType: '7-day' as '7-day' | '30-day',
    initialAmount: '0.01',
    weekDetected: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch alerts
  const { data: alerts = [], isLoading } = useQuery<SmallAmountAlert[]>({
    queryKey: ['/api/small-amount-alerts'],
    enabled: isOpen
  });

  // Filter alerts based on status and show resolved preference
  const filteredAlerts = alerts.filter((alert: SmallAmountAlert) => {
    if (!showResolved && alert.status === 'resolved') return false;
    if (selectedStatus !== 'all' && alert.status !== selectedStatus) return false;
    return true;
  });

  // Create alert mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/small-amount-alerts', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/small-amount-alerts'] });
      setShowCreateForm(false);
      setNewAlert({
        vrid: '',
        companyName: '',
        invoiceType: '7-day',
        initialAmount: '0.01',
        weekDetected: '',
        notes: ''
      });
      toast({
        title: "Alertă creată",
        description: "Alerta pentru suma mică a fost adăugată cu succes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Eroare la crearea alertei",
        variant: "destructive",
      });
    },
  });

  // Resolve alert mutation
  const resolveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/small-amount-alerts/${id}/resolve`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/small-amount-alerts'] });
      setEditingAlert(null);
      setResolveData({ realAmount: '', weekResolved: '' });
      toast({
        title: "Alertă rezolvată",
        description: "Alerta a fost marcată ca rezolvată cu suma reală.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Eroare la rezolvarea alertei",
        variant: "destructive",
      });
    },
  });

  // Delete alert mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/small-amount-alerts/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/small-amount-alerts'] });
      toast({
        title: "Alertă ștearsă",
        description: "Alerta a fost ștearsă cu succes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Eroare la ștergerea alertei",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />În așteptare</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Rezolvată</Badge>;
      case 'ignored':
        return <Badge variant="outline">Ignorată</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCreateAlert = () => {
    if (!newAlert.vrid || !newAlert.companyName || !newAlert.weekDetected) {
      toast({
        title: "Eroare",
        description: "Toate câmpurile obligatorii trebuie completate.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(newAlert);
  };

  const handleResolveAlert = (alertId: number) => {
    if (!resolveData.realAmount || !resolveData.weekResolved) {
      toast({
        title: "Eroare",
        description: "Suma reală și săptămâna sunt obligatorii.",
        variant: "destructive",
      });
      return;
    }

    resolveMutation.mutate({
      id: alertId,
      data: resolveData
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Monitorizare Sume Mici (€0.01)
          </DialogTitle>
          <DialogDescription>
            Urmărește facturile inițiale cu sume mici care urmează să fie actualizate cu valori reale.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 items-center">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate alertele</SelectItem>
                  <SelectItem value="pending">În așteptare</SelectItem>
                  <SelectItem value="resolved">Rezolvate</SelectItem>
                  <SelectItem value="ignored">Ignorate</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResolved(!showResolved)}
                className="flex items-center gap-2"
              >
                {showResolved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showResolved ? 'Ascunde rezolvate' : 'Arată rezolvate'}
              </Button>
            </div>

            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adaugă alertă
            </Button>
          </div>

          {/* Create form */}
          {showCreateForm && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-3">
              <h3 className="font-medium">Adaugă alertă nouă</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vrid">VRID *</Label>
                  <Input
                    id="vrid"
                    value={newAlert.vrid}
                    onChange={(e) => setNewAlert({ ...newAlert, vrid: e.target.value })}
                    placeholder="T-114QYYSH3"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Companie *</Label>
                  <Input
                    id="companyName"
                    value={newAlert.companyName}
                    onChange={(e) => setNewAlert({ ...newAlert, companyName: e.target.value })}
                    placeholder="DE Cargo Speed"
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceType">Tip factură</Label>
                  <Select value={newAlert.invoiceType} onValueChange={(value: '7-day' | '30-day') => setNewAlert({ ...newAlert, invoiceType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7-day">7 zile</SelectItem>
                      <SelectItem value="30-day">30 zile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="initialAmount">Suma inițială</Label>
                  <Input
                    id="initialAmount"
                    type="number"
                    step="0.01"
                    value={newAlert.initialAmount}
                    onChange={(e) => setNewAlert({ ...newAlert, initialAmount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="weekDetected">Săptămână detectată *</Label>
                  <Input
                    id="weekDetected"
                    value={newAlert.weekDetected}
                    onChange={(e) => setNewAlert({ ...newAlert, weekDetected: e.target.value })}
                    placeholder="2 dec. 2024 - 8 dec. 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notițe</Label>
                  <Input
                    id="notes"
                    value={newAlert.notes}
                    onChange={(e) => setNewAlert({ ...newAlert, notes: e.target.value })}
                    placeholder="Observații opționale"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateAlert} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Se salvează...' : 'Salvează alerta'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Anulează
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                {alerts.filter((a: SmallAmountAlert) => a.status === 'pending').length}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-300">În așteptare</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                {alerts.filter((a: SmallAmountAlert) => a.status === 'resolved').length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-300">Rezolvate</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {alerts.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300">Total alerte</div>
            </div>
          </div>

          {/* Alerts list */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">Se încarcă alertele...</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nu există alerte pentru criteriile selectate.
              </div>
            ) : (
              filteredAlerts.map((alert: SmallAmountAlert) => (
                <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{alert.vrid}</span>
                        <span className="text-sm text-gray-500">({alert.companyName})</span>
                        {getStatusBadge(alert.status)}
                        <Badge variant="outline">{alert.invoiceType}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-x-4">
                        <span>Suma inițială: <strong>€{alert.initialAmount}</strong></span>
                        {alert.realAmount && (
                          <span>Suma reală: <strong>€{alert.realAmount}</strong></span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span>Detectată: {alert.weekDetected}</span>
                        {alert.weekResolved && (
                          <span>Rezolvată: {alert.weekResolved}</span>
                        )}
                      </div>
                      {alert.notes && (
                        <div className="text-sm text-gray-600 italic">{alert.notes}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {alert.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => setEditingAlert(alert.id)}
                          disabled={editingAlert === alert.id}
                        >
                          Rezolvă
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMutation.mutate(alert.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Resolve form */}
                  {editingAlert === alert.id && (
                    <div className="border-t pt-3 space-y-3">
                      <h4 className="font-medium">Rezolvă alerta</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="realAmount">Suma reală (EUR) *</Label>
                          <Input
                            id="realAmount"
                            type="number"
                            step="0.01"
                            value={resolveData.realAmount}
                            onChange={(e) => setResolveData({ ...resolveData, realAmount: e.target.value })}
                            placeholder="123.45"
                          />
                        </div>
                        <div>
                          <Label htmlFor="weekResolved">Săptămână rezolvare *</Label>
                          <Input
                            id="weekResolved"
                            value={resolveData.weekResolved}
                            onChange={(e) => setResolveData({ ...resolveData, weekResolved: e.target.value })}
                            placeholder="9 dec. 2024 - 15 dec. 2024"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={resolveMutation.isPending}
                        >
                          {resolveMutation.isPending ? 'Se salvează...' : 'Marchează ca rezolvată'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingAlert(null);
                            setResolveData({ realAmount: '', weekResolved: '' });
                          }}
                        >
                          Anulează
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}