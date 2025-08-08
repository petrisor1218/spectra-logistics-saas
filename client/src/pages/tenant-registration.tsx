import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building, UserPlus, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function TenantRegistration() {
  const [formData, setFormData] = useState({
    tenantName: "",
    tenantDescription: "",
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    adminUsername: "",
    adminPassword: "",
    adminEmail: ""
  });
  
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Registration mutation
  const registrationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/register-tenant', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (result) => {
      setRegistrationSuccess(result);
      toast({
        title: "🎉 Înregistrare reușită!",
        description: `Tenant-ul "${result.tenant.name}" a fost creat cu succes!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Eroare la înregistrare",
        description: error.message || "Nu s-a putut înregistra tenant-ul. Încercați din nou.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantName || !formData.adminUsername || !formData.adminPassword) {
      toast({
        title: "❌ Date incomplete",
        description: "Numele tenant-ului, username-ul admin și parola sunt obligatorii.",
        variant: "destructive",
      });
      return;
    }

    registrationMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              
              <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
                🎉 Înregistrare Reușită!
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg space-y-3">
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    🏢 Tenant creat:
                  </p>
                  <p className="text-green-700 dark:text-green-400">
                    <strong>#{registrationSuccess.tenant.id}</strong> - {registrationSuccess.tenant.name}
                  </p>
                  {registrationSuccess.tenant.companyName && (
                    <p className="text-green-600 dark:text-green-500 text-sm">
                      📋 {registrationSuccess.tenant.companyName}
                    </p>
                  )}
                </div>
                
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    👤 Admin utilizator:
                  </p>
                  <p className="text-green-700 dark:text-green-400">
                    <strong>{registrationSuccess.admin.username}</strong>
                  </p>
                  {registrationSuccess.admin.email && (
                    <p className="text-green-600 dark:text-green-500 text-sm">
                      ✉️ {registrationSuccess.admin.email}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  🔑 Pașii următori:
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>1. Conectează-te cu credențialele de admin</li>
                  <li>2. Configurează companiile și șoferii</li>
                  <li>3. Începe să procesezi datele săptămânale</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setLocation('/tenant-login')}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Login Acum
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/')}
                  className="flex-1"
                >
                  Acasă
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            
            <CardTitle className="text-3xl font-bold gradient-text">
              🏢 Înregistrare Tenant Nou
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Creează-ți propriul tenant și primul utilizator admin
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tenant Information Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Informații Tenant
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenantName">Nume Tenant *</Label>
                    <Input
                      id="tenantName"
                      value={formData.tenantName}
                      onChange={(e) => handleInputChange('tenantName', e.target.value)}
                      placeholder="ex: Transport Express SRL"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="companyName">Nume Companie</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="ex: SC Transport Express SRL"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactEmail">Email Contact</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="contact@transport.ro"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPhone">Telefon Contact</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="+40123456789"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="tenantDescription">Descriere (opțională)</Label>
                  <Textarea
                    id="tenantDescription"
                    value={formData.tenantDescription}
                    onChange={(e) => handleInputChange('tenantDescription', e.target.value)}
                    placeholder="Descrierea activității companiei..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Admin User Section */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-green-800 dark:text-green-300 flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Primul Utilizator Admin
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminUsername">Username Admin *</Label>
                    <Input
                      id="adminUsername"
                      value={formData.adminUsername}
                      onChange={(e) => handleInputChange('adminUsername', e.target.value)}
                      placeholder="admin sau numele dvs."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="adminPassword">Parola Admin *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                      placeholder="Parolă sigură..."
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="adminEmail">Email Admin</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      placeholder="admin@transport.ro"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={registrationMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3"
              >
                {registrationMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Se înregistrează tenant-ul...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Creează Tenant & Admin
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </Button>
            </form>

            {/* Info Section */}
            <div className="border-t pt-4 space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>ℹ️ Ce se întâmplă după înregistrare:</strong>
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-500 mt-2 space-y-1">
                  <li>✓ Se creează tenant-ul cu ID unic</li>
                  <li>✓ Se creează primul utilizator admin cu credențialele specificate</li>
                  <li>✓ Se inițializează sistemul de numerotare pentru comenzi</li>
                  <li>✓ Tenantul va avea acces doar la propriile date</li>
                </ul>
              </div>
              
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Înapoi la pagina principală
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}