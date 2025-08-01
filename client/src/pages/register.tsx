import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Eye, EyeOff, Check, ArrowRight, CreditCard, User, Building, Mail, Lock, X } from 'lucide-react';
import { Link } from 'wouter';

// Stripe setup
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface RegistrationForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  firstName: string;
  lastName: string;
}

interface UsernameCheckResult {
  available: boolean;
  message?: string;
}

interface EmailCheckResult {
  available: boolean;
  message?: string;
}

const RegistrationForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheckResult | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameTimeout, setUsernameTimeout] = useState<NodeJS.Timeout | null>(null);
  const [emailCheck, setEmailCheck] = useState<EmailCheckResult | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailTimeout, setEmailTimeout] = useState<NodeJS.Timeout | null>(null);
  const [reservationToken, setReservationToken] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<RegistrationForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    firstName: '',
    lastName: ''
  });

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim() || username.length < 3) {
      setUsernameCheck(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const result = await response.json();
      setUsernameCheck(result);
    } catch (error) {
      setUsernameCheck({ available: false, message: 'Eroare la verificare' });
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email.trim() || !email.includes('@')) {
      setEmailCheck(null);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      setEmailCheck(result);
    } catch (error) {
      setEmailCheck({ available: false, message: 'Eroare la verificare' });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.username.trim()) {
      toast({
        title: "Câmp obligatoriu",
        description: "Te rog introdu numele de utilizator",
        variant: "destructive"
      });
      return false;
    }
    if (usernameCheck && !usernameCheck.available) {
      toast({
        title: "Nume de utilizator indisponibil",
        description: "Te rog alege un alt nume de utilizator",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "Email invalid",
        description: "Te rog introdu o adresă de email validă",
        variant: "destructive"
      });
      return false;
    }
    if (emailCheck && !emailCheck.available) {
      toast({
        title: "Email indisponibil",
        description: "Această adresă de email este deja înregistrată",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      toast({
        title: "Parolă prea scurtă",
        description: "Parola trebuie să aibă cel puțin 6 caractere",
        variant: "destructive"
      });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Parolele nu coincid",
        description: "Te rog verifică parola introdusă",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Câmpuri obligatorii",
        description: "Te rog completează numele și prenumele",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.companyName.trim()) {
      toast({
        title: "Compania este obligatorie",
        description: "Te rog introdu numele companiei tale",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 1 && validateStep1()) {
      // Reserve the username when moving to step 2
      try {
        setIsProcessing(true);
        const response = await fetch('/api/auth/reserve-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: formData.username.trim(), 
            email: formData.email.trim() 
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to reserve username');
        }

        const result = await response.json();
        setReservationToken(result.token);
        
        toast({
          title: "Username rezervat",
          description: "Contul tău este acum protejat pentru următorii 10 minute.",
          variant: "default",
        });

        setStep(2);
      } catch (error: any) {
        toast({
          title: "Eroare la rezervare",
          description: error.message.includes('already taken') 
            ? `Numele "${formData.username}" sau emailul "${formData.email}" au fost luate între timp. Te rog reîncarcă pagina și încearcă din nou.`
            : "Te rog încearcă din nou.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Final validation before submission - check both username and email one more time
      const [usernameCheckResult, emailCheckResult] = await Promise.all([
        fetch('/api/auth/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formData.username.trim() })
        }).then(res => res.json()),
        fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email.trim() })
        }).then(res => res.json())
      ]);

      if (!usernameCheckResult.available) {
        toast({
          title: "Nume de utilizator indisponibil",
          description: `Numele "${formData.username}" este deja folosit. Te rog alege un alt nume de utilizator.`,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (!emailCheckResult.available) {
        toast({
          title: "Email indisponibil", 
          description: `Adresa "${formData.email}" este deja înregistrată. Te rog folosește o altă adresă de email.`,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Create the user account
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          role: 'subscriber',
          subscriptionStatus: 'trialing'
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      // Then, confirm the payment setup for trial
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription-success`,
        },
      });

      if (error) {
        toast({
          title: "Eroare la procesarea plății",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cont creat cu succes!",
          description: "Bun venit la Transport Pro! Perioada ta de probă a început.",
        });
        onSuccess();
      }
    } catch (error: any) {
      let errorMessage = "A apărut o eroare. Te rog încearcă din nou.";
      
      if (error.message.includes('Username already exists')) {
        errorMessage = `Numele de utilizator "${formData.username}" este deja folosit. Te rog alege un alt nume.`;
      } else if (error.message.includes('Email already exists')) {
        errorMessage = `Adresa de email "${formData.email}" este deja înregistrată. Te rog folosește o altă adresă.`;
      } else if (error.message.includes('User validation failed')) {
        errorMessage = "Datele introduse nu sunt valide. Te rog verifică toate câmpurile.";
      }
      
      toast({
        title: "Eroare la înregistrare",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20 text-white">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold mb-2">
          Înregistrare Transport Pro
        </CardTitle>
        <div className="flex justify-center items-center space-x-2 text-sm text-gray-300">
          <div className={`flex items-center space-x-1 ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-blue-500' : 'bg-gray-600'}`}>
              {step > 1 ? <Check className="w-3 h-3" /> : '1'}
            </div>
            <span>Cont</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500" />
          <div className={`flex items-center space-x-1 ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-blue-500' : 'bg-gray-600'}`}>
              {step > 2 ? <Check className="w-3 h-3" /> : '2'}
            </div>
            <span>Detalii</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500" />
          <div className={`flex items-center space-x-1 ${step >= 3 ? 'text-blue-400' : 'text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-blue-500' : 'bg-gray-600'}`}>
              3
            </div>
            <span>Plată</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Account Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nume utilizator
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, username: value});
                      
                      // Clear existing timeout
                      if (usernameTimeout) {
                        clearTimeout(usernameTimeout);
                      }
                      
                      // Reset check status for immediate feedback
                      setUsernameCheck(null);
                      
                      // Set new timeout for debounced check
                      const newTimeout = setTimeout(() => checkUsernameAvailability(value), 800);
                      setUsernameTimeout(newTimeout);
                    }}
                    className={`bg-gray-800 border-gray-600 text-white pr-10 ${
                      usernameCheck 
                        ? usernameCheck.available 
                          ? 'border-green-500' 
                          : 'border-red-500'
                        : ''
                    }`}
                    placeholder="username"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isCheckingUsername && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {!isCheckingUsername && usernameCheck && (
                      usernameCheck.available ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )
                    )}
                  </div>
                </div>
                {usernameCheck && !usernameCheck.available && (
                  <p className="text-xs text-red-400 mt-1">{usernameCheck.message}</p>
                )}
                {usernameCheck && usernameCheck.available && (
                  <p className="text-xs text-green-400 mt-1">Nume de utilizator disponibil</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, email: value});
                      
                      // Clear existing timeout
                      if (emailTimeout) {
                        clearTimeout(emailTimeout);
                      }
                      
                      // Reset check status for immediate feedback
                      setEmailCheck(null);
                      
                      // Set new timeout for debounced check
                      const newTimeout = setTimeout(() => checkEmailAvailability(value), 800);
                      setEmailTimeout(newTimeout);
                    }}
                    className={`bg-gray-800 border-gray-600 text-white pr-10 ${
                      emailCheck 
                        ? emailCheck.available 
                          ? 'border-green-500' 
                          : 'border-red-500'
                        : ''
                    }`}
                    placeholder="nume@companie.ro"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isCheckingEmail && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {!isCheckingEmail && emailCheck && (
                      emailCheck.available ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )
                    )}
                  </div>
                </div>
                {emailCheck && !emailCheck.available && (
                  <p className="text-xs text-red-400 mt-1">{emailCheck.message}</p>
                )}
                {emailCheck && emailCheck.available && (
                  <p className="text-xs text-green-400 mt-1">Email disponibil</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Parolă
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white pr-10"
                    placeholder="Minim 6 caractere"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmă parola</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white pr-10"
                    placeholder="Repetă parola"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Personal & Company Info */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nume</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ion"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Prenume</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Popescu"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyName" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Compania
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Fast Express S.R.L."
                />
              </div>

              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                <h4 className="font-semibold mb-2 text-blue-300">Transport Pro - €99.99/lună</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✓ 3 zile perioadă de probă gratuită</li>
                  <li>✓ Procesare nelimitată de comenzi</li>
                  <li>✓ Gestiunea plăților și comisioanelor</li>
                  <li>✓ Rapoarte și analize detaliate</li>
                  <li>✓ Suport prioritar</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                <CreditCard className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h4 className="font-semibold text-green-300">Perioada de probă de 3 zile</h4>
                <p className="text-sm text-gray-300 mt-1">
                  Nu vei fi taxat acum. Abonamentul începe după perioada de probă.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  <strong>€99.99/lună</strong> după perioada de probă
                </p>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg">
                <PaymentElement />
              </div>

              <p className="text-xs text-gray-400 text-center">
                Prin continuare, accepți termenii și condițiile Transport Pro.
              </p>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Înapoi
              </Button>
            )}
            
            <div className="ml-auto">
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    (step === 1 && (!usernameCheck || !usernameCheck.available || !emailCheck || !emailCheck.available)) ||
                    (step === 2 && (!formData.firstName.trim() || !formData.lastName.trim() || !formData.companyName.trim()))
                  }
                >
                  Continuă
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!stripe || isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {isProcessing ? 'Se verifică și se procesează...' : 'Finalizează înregistrarea'}
                </Button>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-gray-400">
            Ai deja cont?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Conectează-te aici
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Register() {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Create setup intent for trial subscription
    fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'transport-pro', trialDays: 3 })
    })
    .then(res => res.json())
    .then(data => {
      setClientSecret(data.clientSecret);
      setIsLoading(false);
    })
    .catch(error => {
      console.error('Error creating subscription setup:', error);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20 text-white">
          <CardContent className="text-center p-6">
            <h3 className="text-lg font-semibold mb-2">Configurare în progres</h3>
            <p className="text-gray-300">Sistemul de plăți se configurează. Te rog încearcă din nou în câteva momente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <RegistrationForm onSuccess={() => window.location.href = '/subscription-success'} />
      </Elements>
    </div>
  );
}