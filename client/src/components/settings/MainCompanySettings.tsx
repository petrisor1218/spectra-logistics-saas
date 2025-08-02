import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, Edit2 } from "lucide-react";

interface MainCompany {
  id?: number;
  name: string;
  cif: string;
  tradeRegisterNumber: string;
  address: string;
  location: string;
  county: string;
  country: string;
  contact: string;
  isMainCompany?: boolean;
}

export function MainCompanySettings() {
  const [mainCompany, setMainCompany] = useState<MainCompany>({
    name: "",
    cif: "",
    tradeRegisterNumber: "",
    address: "",
    location: "",
    county: "",
    country: "Romania",
    contact: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMainCompany();
  }, []);

  const loadMainCompany = async () => {
    try {
      const response = await fetch('/api/main-company');
      if (response.ok) {
        const data = await response.json();
        if (data && data.name) {
          setMainCompany({
            id: data.id,
            name: data.name,
            cif: data.cif || "",
            tradeRegisterNumber: data.tradeRegisterNumber || "",
            address: data.address || "",
            location: data.location || "",
            county: data.county || "",
            country: data.country || "Romania",
            contact: data.contact || "",
            isMainCompany: data.isMainCompany
          });
        } else {
          // No main company exists, enable editing mode
          setIsEditing(true);
        }
      }
    } catch (error) {
      console.error('Error loading main company:', error);
      setIsEditing(true); // Enable editing if load fails
    }
  };

  const handleSave = async () => {
    if (!mainCompany.name.trim()) {
      toast({
        title: "Eroare",
        description: "Numele companiei este obligatoriu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const method = mainCompany.id ? 'PUT' : 'POST';
      
      // Clean the data - remove timestamp fields and any undefined values
      const cleanData = {
        name: mainCompany.name,
        cif: mainCompany.cif || "",
        tradeRegisterNumber: mainCompany.tradeRegisterNumber || "",
        address: mainCompany.address || "",
        location: mainCompany.location || "",
        county: mainCompany.county || "",
        country: mainCompany.country || "Romania",
        contact: mainCompany.contact || "",
        isMainCompany: true,
        ...(mainCompany.id && { id: mainCompany.id })
      };

      const response = await fetch('/api/main-company', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setMainCompany(updatedCompany);
        setIsEditing(false);
        toast({
          title: "Succes",
          description: mainCompany.id ? "Compania a fost actualizată" : "Compania principală a fost configurată",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error saving main company:', errorData);
        throw new Error(errorData.details || 'Failed to save company');
      }
    } catch (error: any) {
      console.error('Error saving main company:', error);
      toast({
        title: "Eroare",
        description: error.message || "Eroare la salvarea companiei",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadMainCompany(); // Reload original data
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <CardTitle>Compania Principală</CardTitle>
        {!isEditing && mainCompany.id && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="ml-auto"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Editează
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {!mainCompany.id && !isEditing ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Configurează Compania Principală</h3>
            <p className="text-muted-foreground mb-4">
              Adaugă detaliile companiei tale pentru a personaliza sistemul
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              Configurează Compania
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Numele Companiei *</Label>
                <Input
                  id="name"
                  value={mainCompany.name}
                  onChange={(e) => setMainCompany(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: AZ LOGISTIC SRL"
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="cif">CIF</Label>
                <Input
                  id="cif"
                  value={mainCompany.cif}
                  onChange={(e) => setMainCompany(prev => ({ ...prev, cif: e.target.value }))}
                  placeholder="Ex: RO12345678"
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="tradeRegister">Nr. Registrul Comerțului</Label>
                <Input
                  id="tradeRegister"
                  value={mainCompany.tradeRegisterNumber}
                  onChange={(e) => setMainCompany(prev => ({ ...prev, tradeRegisterNumber: e.target.value }))}
                  placeholder="Ex: J40/12345/2020"
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="location">Localitate</Label>
                <Input
                  id="location"
                  value={mainCompany.location}
                  onChange={(e) => setMainCompany(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: București"
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Adresa</Label>
                <Textarea
                  id="address"
                  value={mainCompany.address}
                  onChange={(e) => setMainCompany(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Adresa completă a companiei"
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="county">Județ</Label>
                <Input
                  id="county"
                  value={mainCompany.county}
                  onChange={(e) => setMainCompany(prev => ({ ...prev, county: e.target.value }))}
                  placeholder="Ex: Ilfov"
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="country">Țara</Label>
                <Input
                  id="country"
                  value={mainCompany.country}
                  onChange={(e) => setMainCompany(prev => ({ ...prev, country: e.target.value }))}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Textarea
                  id="contact"
                  value={mainCompany.contact}
                  onChange={(e) => setMainCompany(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="Telefon, email, persoană de contact"
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}
        
        {isEditing && (
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Se salvează..." : "Salvează"}
            </Button>
            {mainCompany.id && (
              <Button variant="outline" onClick={handleCancel}>
                Anulează
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}