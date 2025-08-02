import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, LogIn, Crown, Check, TrendingUp, Shield, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Invalidate user query to refresh authentication state
        queryClient.invalidateQueries({ queryKey: ['/api', 'auth', 'user'] });
        toast({
          title: "Autentificare reușită",
          description: "Bine ai venit!",
        });
        // Small delay to ensure query refetch completes
        setTimeout(() => setLocation('/'), 100);
      } else {
        toast({
          title: "Eroare de autentificare",
          description: data.error || "Credențiale invalide",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Eroare de conexiune",
        description: "Nu s-a putut conecta la server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Comenzi nelimitate",
    "Tracking complet plăți",
    "Export PDF profesional",
    "Dashboard analitică",
    "Backup automat",
    "Suport 24/7"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <div className="container mx-auto min-h-screen flex items-center justify-center">
        <div className="grid lg:grid-cols-2 gap-8 w-full max-w-6xl items-center">
          
          {/* Left side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto"
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl text-white">
              <CardHeader className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                  Transport Pro
                </CardTitle>
                <CardDescription className="text-gray-200">
                  Autentificare în sistemul de management transport
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium text-gray-200">
                      Utilizator
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 h-4 w-4" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Introduceți numele de utilizator"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-200">
                      Parolă
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 h-4 w-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Introduceți parola"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 transition-all duration-200 transform hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Se autentifică...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <LogIn className="h-4 w-4" />
                        <span>Autentificare</span>
                      </div>
                    )}
                  </Button>
                </form>
                <div className="mt-6 text-center space-y-2">
                  <p className="text-xs text-gray-300">
                    Sistem de management transport și plăți
                  </p>
                  <div className="pt-2 border-t border-white/20">
                    <p className="text-xs text-gray-300">
                      Nu ai cont?{' '}
                      <a 
                        href="/register" 
                        className="text-blue-300 hover:text-blue-200 font-medium underline"
                      >
                        Înregistrează-te aici
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right side - Pricing Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md mx-auto lg:max-w-none"
          >
            <Card className="backdrop-blur-lg bg-white/10 border-white/20 shadow-2xl text-white">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-yellow-400 mr-2" />
                  <CardTitle className="text-3xl font-bold text-white">
                    Transport Pro
                  </CardTitle>
                </div>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-white mb-2">99.99€</div>
                  <div className="text-lg text-gray-200">pe lună</div>
                  <div className="text-sm text-blue-300 mt-2">
                    ✨ Primele 3 zile gratuit!
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-200">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-300">Analytics</div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-green-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-300">Securitate</div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                    <div className="text-xs text-gray-300">24/7 Suport</div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3"
                    onClick={() => setLocation('/register')}
                  >
                    Începe perioada de probă gratuită
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    Fără card de credit pentru perioada de probă
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}