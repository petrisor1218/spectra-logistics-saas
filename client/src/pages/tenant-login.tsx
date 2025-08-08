import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building, LogIn, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface Tenant {
  id: number;
  name: string;
  description?: string;
  status: string;
  companyName?: string;
  subscriptionPlan: string;
}

export default function TenantLogin() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch available tenants
  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ['/api/admin/tenants'],
  });

  const activeTenants = tenants.filter(t => t.status === 'active');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTenantId || !username || !password) {
      toast({
        title: "❌ Date incomplete",
        description: "Selectați tenant-ul, username-ul și parola.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      // Store selected tenant in session storage
      sessionStorage.setItem('selectedTenantId', selectedTenantId);
      
      // Redirect to tenant-specific URL
      setLocation(`/tenant/${selectedTenantId}/dashboard`);
      
      toast({
        title: "✅ Conectare reușită!",
        description: `Bun venit în sistemul tenant-ului ${tenants.find(t => t.id.toString() === selectedTenantId)?.name}!`,
      });
      
    } catch (error) {
      toast({
        title: "❌ Eroare la conectare",
        description: "Username sau parolă incorectă.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };
    
    return variants[status as keyof typeof variants] || variants.inactive;
  };

  if (tenantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Building className="w-8 h-8 text-white" />
            </motion.div>
            
            <CardTitle className="text-2xl font-bold gradient-text">
              🏢 Login Multi-Tenant
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Selectează tenant-ul și conectează-te la sistemul tău
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Tenant Selection */}
              <div className="space-y-2">
                <Label htmlFor="tenant">Selectează Tenant *</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Alege tenant-ul tău..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span className="font-medium">#{tenant.id} {tenant.name}</span>
                            {tenant.companyName && (
                              <div className="text-xs text-gray-500">{tenant.companyName}</div>
                            )}
                          </div>
                          <Badge className={getStatusBadge(tenant.status)}>
                            {tenant.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {activeTenants.length === 0 && (
                  <p className="text-sm text-red-500">
                    ⚠️ Nu există tenanți activi disponibili
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Introduceți username-ul"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Parola *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduceți parola"
                  required
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading || !selectedTenantId || !username || !password}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Se conectează...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="w-4 h-4 mr-2" />
                    Conectează-te
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </Button>
            </form>

            {/* Info Section */}
            <div className="border-t pt-4 space-y-3">
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <p>🔒 <strong>Login securizat multi-tenant</strong></p>
                <p className="text-xs mt-1">
                  Fiecare tenant are acces doar la datele sale private
                </p>
              </div>
              
              {selectedTenantId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg"
                >
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      📋 Tenant selectat:
                    </p>
                    {(() => {
                      const tenant = tenants.find(t => t.id.toString() === selectedTenantId);
                      return tenant ? (
                        <div className="mt-1 text-blue-700 dark:text-blue-400">
                          <p><strong>#{tenant.id}</strong> - {tenant.name}</p>
                          {tenant.companyName && <p>🏢 {tenant.companyName}</p>}
                          <p>📦 Plan: {tenant.subscriptionPlan}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Back to main login */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setLocation('/login')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Înapoi la login principal
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}