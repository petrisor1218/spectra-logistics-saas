import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, Truck, Shield, Zap } from "lucide-react";

export default function TenantLogin() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Eroare la autentificare");
      }

      // Redirecționează către dashboard-ul tenantului
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare neașteptată");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Truck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Autentificare
          </h1>
          <p className="text-gray-600">
            Accesează platforma de logistică
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Conectare la cont</CardTitle>
            <CardDescription>
              Introdu credențialele pentru a accesa platforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="admin@companie.ro"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Parolă</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Parola ta"
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Se conectează..." : "Conectare"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setLocation("/forgot-password")}
                  className="text-sm"
                >
                  Ai uitat parola?
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="bg-green-100 p-2 rounded-full">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
            <span>Bază de date dedicată și securizată</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="bg-blue-100 p-2 rounded-full">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <span>Gestionare completă logistică</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="bg-purple-100 p-2 rounded-full">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <span>Rapoarte și analize în timp real</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Nu ai cont?{" "}
            <Button
              variant="link"
              onClick={() => setLocation("/register")}
              className="p-0 h-auto text-sm"
            >
              Înregistrează-ți compania
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}