import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Check, X, Loader2, CreditCard } from 'lucide-react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Link } from 'wouter';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<{ available: boolean; message: string } | null>(null);
  const [emailCheck, setEmailCheck] = useState<{ available: boolean; message: string } | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  // Debounced username check
  useEffect(() => {
    if (formData.username.length >= 3) {
      setIsCheckingUsername(true);
      const timer = setTimeout(async () => {
        try {
          const response = await fetch('/api/auth/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: formData.username })
          });
          const result = await response.json();
          setUsernameCheck(result);
        } catch (error) {
          setUsernameCheck({ available: false, message: 'Eroare la verificare' });
        } finally {
          setIsCheckingUsername(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameCheck(null);
    }
  }, [formData.username]);

  // Debounced email check
  useEffect(() => {
    if (formData.email.includes('@')) {
      setIsCheckingEmail(true);
      const timer = setTimeout(async () => {
        try {
          const response = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email })
          });
          const result = await response.json();
          setEmailCheck(result);
        } catch (error) {
          setEmailCheck({ available: false, message: 'Eroare la verificare' });
        } finally {
          setIsCheckingEmail(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setEmailCheck(null);
    }
  }, [formData.email]);

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const validateForm = () => {
    if (!formData.username || formData.username.length < 3) {
      toast({
        title: "Eroare",
        description: "Numele de utilizator trebuie să aibă cel puțin 3 caractere",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.email || !formData.email.includes('@')) {
      toast({
        title: "Eroare",
        description: "Te rog introdu o adresă de email validă",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.password || formData.password.length < 6) {
      toast({
        title: "Eroare",
        description: "Parola trebuie să aibă cel puțin 6 caractere",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Eroare",
        description: "Parolele nu se potrivesc",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.firstName || !formData.lastName || !formData.companyName) {
      toast({
        title: "Eroare",
        description: "Te rog completează toate câmpurile obligatorii",
        variant: "destructive"
      });
      return false;
    }

    if (usernameCheck && !usernameCheck.available) {
      toast({
        title: "Eroare",
        description: "Numele de utilizator nu este disponibil",
        variant: "destructive"
      });
      return false;
    }

    if (emailCheck && !emailCheck.available) {
      toast({
        title: "Eroare",
        description: "Adresa de email nu este disponibilă",
        variant: "destructive"
      });
      return false;
    }

    // VALIDARE OBLIGATORIE PENTRU CARD
    if (!stripe || !elements) {
      toast({
        title: "Eroare",
        description: "Sistemul de plată nu este disponibil. Te rog reîncarcă pagina.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Create Stripe setup intent when form is ready
  useEffect(() => {
    if (formData.username && formData.email && usernameCheck?.available && emailCheck?.available) {
      createSetupIntent();
    }
  }, [formData.username, formData.email, usernameCheck, emailCheck]);

  const createSetupIntent = async () => {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'professional', trialDays: 3 })
      });
      
      if (response.ok) {
        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      }
    } catch (error) {
      console.log('Stripe setup will be handled later');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!stripe || !elements) return;
    
    setIsSubmitting(true);

    try {
      // PRIMUL: Validez cardul înainte de orice altceva
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        toast({
          title: "Eroare",
          description: "Te rog introdu detaliile cardului pentru a continua",
          variant: "destructive",
        });
        return;
      }

      // Verific că cardul este complet și valid
      const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (cardError) {
        toast({
          title: "Card invalid",
          description: cardError.message || "Te rog verifică detaliile cardului",
          variant: "destructive",
        });
        return;
      }

      if (!paymentMethod) {
        toast({
          title: "Eroare",
          description: "Te rog completează toate detaliile cardului",
          variant: "destructive",
        });
        return;
      }

      // AL DOILEA: Creez contul doar DUPĂ ce cardul este validat
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          companyName: formData.companyName.trim(),
          role: 'subscriber',
          subscriptionStatus: 'trialing',
          paymentMethodId: paymentMethod.id // Trimit și ID-ul metodei de plată
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      // AL TREILEA: Setup subscription cu cardul validat
      if (clientSecret) {
        const { error } = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/subscription-success`,
          },
        });

        if (error) {
          toast({
            title: "Eroare la configurarea plății",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "🎉 Cont creat cu succes!",
        description: "Bun venit! Te redirecționez către pagina de login...",
        variant: "default"
      });

      // Clear form to prevent re-submission
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        companyName: ''
      });

      // Redirect immediately
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);

    } catch (error: any) {
      let errorMessage = "A apărut o eroare. Te rog încearcă din nou.";
      
      if (error.message.includes('Username already exists')) {
        errorMessage = "Numele de utilizator este deja folosit. Te rog alege altul.";
        // Clear username to allow user to try again
        setFormData(prev => ({ ...prev, username: '' }));
        setUsernameCheck(null);
      } else if (error.message.includes('Email already exists')) {
        errorMessage = "Adresa de email este deja înregistrată. Te rog folosește o altă adresă.";
        // Clear email to allow user to try again
        setFormData(prev => ({ ...prev, email: '' }));
        setEmailCheck(null);
      }
      
      toast({
        title: "Eroare la înregistrare",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto bg-white/10 backdrop-blur-lg border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">
            Înregistrare Transport Pro
          </CardTitle>
          <p className="text-gray-300">
            3 zile gratuit • €99.99/lună după trial
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <Label htmlFor="username" className="text-white">Nume utilizator *</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-300"
                  placeholder="ex: fastexpress"
                  required
                />
                {isCheckingUsername && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-400" />
                )}
                {!isCheckingUsername && usernameCheck && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameCheck.available ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {usernameCheck && (
                <p className={`text-xs mt-1 ${usernameCheck.available ? 'text-green-400' : 'text-red-400'}`}>
                  {usernameCheck.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-white">Email *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-300"
                  placeholder="ex: contact@fastexpress.ro"
                  required
                />
                {isCheckingEmail && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-400" />
                )}
                {!isCheckingEmail && emailCheck && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {emailCheck.available ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {emailCheck && (
                <p className={`text-xs mt-1 ${emailCheck.available ? 'text-green-400' : 'text-red-400'}`}>
                  {emailCheck.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-white">Parolă *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-300 pr-10"
                  placeholder="Minimum 6 caractere"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-white">Confirmă parola *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  className="bg-white/10 border-white/20 text-white placeholder-gray-300 pr-10"
                  placeholder="Reintroduceți parola"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* First Name */}
            <div>
              <Label htmlFor="firstName" className="text-white">Prenume *</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-300"
                placeholder="ex: Petrisor"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName" className="text-white">Nume de familie *</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-300"
                placeholder="ex: Popescu"
                required
              />
            </div>

            {/* Company Name */}
            <div>
              <Label htmlFor="companyName" className="text-white">Numele companiei *</Label>
              <Input
                id="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleInputChange('companyName')}
                className="bg-white/10 border-white/20 text-white placeholder-gray-300"
                placeholder="ex: Fast Express SRL"
                required
              />
            </div>

            {/* Payment Information */}
            <div className="border-t border-white/20 pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <Label className="text-white text-lg font-semibold">Detalii card (pentru trial)</Label>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                <strong>Obligatoriu:</strong> Cardul este necesar pentru verificarea identității. Nu vei fi taxat în perioada de probă de 3 zile.
              </p>
              
              <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#ffffff',
                        '::placeholder': {
                          color: '#9ca3af',
                        },
                        backgroundColor: 'transparent',
                      },
                      invalid: {
                        color: '#ef4444',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || (usernameCheck?.available === false) || (emailCheck?.available === false) || !stripe || isCheckingUsername || isCheckingEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se creează contul...
                </>
              ) : (
                'Începe perioada de probă (3 zile gratuit)'
              )}
            </Button>
            
            <p className="text-xs text-gray-400 text-center">
              Făcând click, accepți termenii și condițiile. Cardul este obligatoriu pentru verificare. Nu vei fi taxat în primul 3 zile.
            </p>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-gray-300">
                Ai deja cont?{' '}
                <Link href="/login">
                  <span className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer">
                    Conectează-te aici
                  </span>
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SimpleRegister() {
  return (
    <Elements stripe={stripePromise}>
      <RegisterForm />
    </Elements>
  );
}