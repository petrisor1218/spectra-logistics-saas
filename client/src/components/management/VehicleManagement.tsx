import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Vehicle {
  id: number;
  vehicleId: string;
  companyId: number;
  vehicleName?: string;
  isActive: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: number;
  name: string;
  commissionRate: string;
}

export function VehicleManagement() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    companyId: '',
    vehicleName: '',
    isActive: 'true',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/vehicles'],
  });

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/companies'],
  });

  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (vehicleData: any) => {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData)
      });
      if (!response.ok) throw new Error('Failed to create vehicle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setIsCreating(false);
      resetForm();
      toast({ title: "Vehicul creat cu succes!" });
    },
    onError: () => {
      toast({ title: "Eroare la crearea vehiculului", variant: "destructive" });
    }
  });

  // Update vehicle mutation
  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update vehicle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setEditingId(null);
      resetForm();
      toast({ title: "Vehicul actualizat cu succes!" });
    },
    onError: () => {
      toast({ title: "Eroare la actualizarea vehiculului", variant: "destructive" });
    }
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete vehicle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({ title: "Vehicul șters cu succes!" });
    },
    onError: () => {
      toast({ title: "Eroare la ștergerea vehiculului", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      companyId: '',
      vehicleName: '',
      isActive: 'true',
      notes: ''
    });
  };

  const handleEdit = (vehicle: Vehicle) => {
    console.log('🔧 Editing vehicle:', vehicle);
    setEditingId(vehicle.id);
    setFormData({
      vehicleId: vehicle.vehicleId,
      companyId: vehicle.companyId.toString(),
      vehicleName: vehicle.vehicleName || '',
      isActive: vehicle.isActive,
      notes: vehicle.notes || ''
    });
    console.log('📝 Form data set:', {
      vehicleId: vehicle.vehicleId,
      companyId: vehicle.companyId.toString(),
      vehicleName: vehicle.vehicleName || '',
      isActive: vehicle.isActive,
      notes: vehicle.notes || ''
    });
  };

  const handleSave = () => {
    if (!formData.vehicleId || !formData.companyId) {
      toast({ title: "Completează toate câmpurile obligatorii", variant: "destructive" });
      return;
    }

    const saveData = {
      ...formData,
      companyId: parseInt(formData.companyId)
    };

    if (editingId) {
      updateVehicleMutation.mutate({ id: editingId, ...saveData });
    } else {
      createVehicleMutation.mutate(saveData);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const getCompanyName = (companyId: number) => {
    const company = (companies as Company[]).find((c: Company) => c.id === companyId);
    return company?.name || 'N/A';
  };

  if (vehiclesLoading || companiesLoading) {
    return <div className="flex items-center justify-center p-8">Se încarcă...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Management Vehicule</h2>
        </div>
        <Button 
          onClick={() => setIsCreating(true)} 
          disabled={isCreating}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adaugă Vehicul
        </Button>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <strong>PRIORITATE MAPARE:</strong> Maparea pe vehicule are prioritate față de maparea pe șoferi. 
        Vehiculele sunt verificate întâi în procesarea datelor.
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Adaugă Vehicul Nou' : 'Editează Vehicul'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleId">ID Vehicul (obligatoriu)*</Label>
                <Input
                  id="vehicleId"
                  placeholder="ex: OTHR-TR94FST"
                  value={formData.vehicleId}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="companyId">Companie (obligatoriu)*</Label>
                <Select value={formData.companyId} onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează compania" />
                  </SelectTrigger>
                  <SelectContent>
                    {(companies as Company[]).map((company: Company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicleName">Nume Vehicul</Label>
                <Input
                  id="vehicleName"
                  placeholder="ex: Camion Transport Fast"
                  value={formData.vehicleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="isActive">Status</Label>
                <Select value={formData.isActive} onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activ</SelectItem>
                    <SelectItem value="false">Inactiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notițe</Label>
              <Textarea
                id="notes"
                placeholder="Informații adiționale despre vehicul..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={createVehicleMutation.isPending || updateVehicleMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Salvează
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Anulează
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(vehicles as Vehicle[]).map((vehicle: Vehicle) => (
          <Card key={vehicle.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-mono">{vehicle.vehicleId}</CardTitle>
                <Badge variant={vehicle.isActive === 'true' ? 'default' : 'secondary'}>
                  {vehicle.isActive === 'true' ? 'Activ' : 'Inactiv'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-sm text-gray-500">Companie:</div>
                <div className="font-medium">{getCompanyName(vehicle.companyId)}</div>
              </div>
              {vehicle.vehicleName && (
                <div>
                  <div className="text-sm text-gray-500">Nume:</div>
                  <div>{vehicle.vehicleName}</div>
                </div>
              )}
              {vehicle.notes && (
                <div>
                  <div className="text-sm text-gray-500">Notițe:</div>
                  <div className="text-sm">{vehicle.notes}</div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(vehicle)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Editează
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
                  disabled={deleteVehicleMutation.isPending}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Șterge
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(vehicles as Vehicle[]).length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nu există vehicule înregistrate încă.</p>
            <Button onClick={() => setIsCreating(true)} className="mt-4">
              Adaugă primul vehicul
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}