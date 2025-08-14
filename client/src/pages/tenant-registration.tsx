import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle, AlertCircle, Truck, Shield, Zap, CreditCard } from "lucide-react";

export default function TenantRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
    adminUser: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.subdomain || !formData.contactEmail || 
        !formData.companyName || !formData.adminUser.email || 
        !formData.adminUser.firstName || !formData.adminUser.lastName || 
        !formData.adminUser.password) {
      setError("Toate câmpurile obligatorii trebuie completate");
      return false;
    }

    if (formData.adminUser.password !== formData.adminUser.confirmPassword) {
      setError("Parolele nu se potrivesc");
      return false;
    }

    if (formData.adminUser.password.length < 8) {
      setError("Parola trebuie să aibă cel puțin 8 caractere");
      return false;
    }

    if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      setError("Subdomain-ul poate conține doar litere mici, cifre și cratime");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/tenants/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          subdomain: formData.subdomain,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          companyName: formData.companyName,
          adminUser: {
            email: formData.adminUser.email,
            firstName: formData.adminUser.firstName,
            lastName: formData.adminUser.lastName,
            password: formData.adminUser.password,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Eroare la înregistrare");
      }

      setSuccess("Contul a fost creat cu succes! Vei fi redirecționat către platformă.");
      
      // Redirecționează către subdomain-ul tenantului după 2 secunde
      setTimeout(() => {
        window.location.href = `https://${formData.subdomain}.${window.location.hostname}`;
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare neașteptată");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Truck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Înregistrează-ți compania
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Obține accesul la platforma completă de logistică cu baza de date dedicată
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">3 zile trial gratuit</h3>
              <p className="text-sm text-gray-600">Testează toate funcționalitățile fără costuri</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Bază de date separată</h3>
              <p className="text-sm text-gray-600">Datele tale sunt complet izolate și securizate</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Preț promotional</h3>
              <p className="text-sm text-gray-600">€99.99/lună pentru primele 3 luni</p>
            </CardContent>
          </Card>
        </div>

        {/* Registration Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Înregistrare companie
            </CardTitle>
            <CardDescription>
              Completează informațiile pentru a crea contul companiei tale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informații companie</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nume companie *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Ex: Transport Express SRL"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subdomain">Subdomain *</Label>
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => handleInputChange("subdomain", e.target.value.toLowerCase())}
                      placeholder="ex: transport-express"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Va fi: {formData.subdomain}.{window.location.hostname}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Email contact *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                      placeholder="contact@companie.ro"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPhone">Telefon contact</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                      placeholder="+40 123 456 789"
                    />
                  </div>
                </div>
              </div>

              {/* Admin User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cont administrator</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prenume *</Label>
                    <Input
                      id="firstName"
                      value={formData.adminUser.firstName}
                      onChange={(e) => handleInputChange("adminUser.firstName", e.target.value)}
                      placeholder="Ion"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Nume *</Label>
                    <Input
                      id="lastName"
                      value={formData.adminUser.lastName}
                      onChange={(e) => handleInputChange("adminUser.lastName", e.target.value)}
                      placeholder="Popescu"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="adminEmail">Email administrator *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminUser.email}
                    onChange={(e) => handleInputChange("adminUser.email", e.target.value)}
                    placeholder="admin@companie.ro"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Parolă *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.adminUser.password}
                      onChange={(e) => handleInputChange("adminUser.password", e.target.value)}
                      placeholder="Minim 8 caractere"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirmă parola *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.adminUser.confirmPassword}
                      onChange={(e) => handleInputChange("adminUser.confirmPassword", e.target.value)}
                      placeholder="Repetă parola"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Se creează contul..." : "Creează contul companiei"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Prin înregistrare, ești de acord cu{" "}
                <a href="/terms" className="text-blue-600 hover:underline">
                  termenii și condițiile
                </a>{" "}
                și{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  politica de confidențialitate
                </a>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Pricing Info */}
        <div className="mt-12 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Prețuri transparente</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✓ 3 zile trial gratuit</p>
                <p>✓ €99.99/lună pentru primele 3 luni</p>
                <p>✓ €149.99/lună după perioada promotională</p>
                <p>✓ Toate funcționalitățile incluse</p>
                <p>✓ Bază de date dedicată</p>
                <p>✓ Suport tehnic inclus</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}