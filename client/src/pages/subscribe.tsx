import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, ArrowRight, Clock, Crown, Star, Shield, Building } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Link } from 'wouter';
import { apiRequest } from "@/lib/queryClient";

// Folosește doar cheia PUBLICĂ în frontend - NICIODATĂ cheia secretă!
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_demo';
console.log('Frontend Stripe key starts with:', stripePublicKey.substring(0, 7));

// Verifică că este cheia publică corectă și creează stripePromise
const stripePromise = (() => {
  if (stripePublicKey.startsWith('sk_')) {
    console.error('⚠️ SECURITY ERROR: Secret key found in frontend! Using demo mode.');
    return null;
  } else if (stripePublicKey !== 'pk_test_demo') {
    return loadStripe(stripePublicKey);
  }
  return null;
})();

const planDetails = {
  professional: {
    name: 'Transport Pro',
    price: 99.99,
    description: 'Soluția completă pentru managementul transporturilor',
    trialDays: 3,
    popular: true,
    features: [
      'Comenzi nelimitate',
      'Tracking complet plăți și comisioane',
      'Gestionare companii multiple',
      'Bilanțuri automate și rapoarte avansate',
      'Export PDF profesional cu logo',
      'Calculatoare comisioane avansate',
      'Istoric complet tranzacții',
      'Dashboard analitică în timp real',
      'Backup automat și securitate',
      'Suport prioritar 24/7',
      'Actualizări gratuite',
      'Conformitate GDPR'
    ]
  }
};

function SubscribeForm({ planId }: { planId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  
  // Tenant information state
  const [tenantInfo, setTenantInfo] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    contactEmail: '',
    contactPhone: '',
    tenantName: ''
  });

  const plan = planDetails[planId as keyof typeof planDetails];

  // Handle tenant info form submission
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantInfo.companyName || !tenantInfo.contactEmail || !tenantInfo.firstName || !tenantInfo.lastName) {
      toast({
        title: "Date incomplete",
        description: "Completați toate câmpurile obligatorii.",
        variant: "destructive",
      });
      return;
    }
    
    // Set tenant name if not provided
    if (!tenantInfo.tenantName) {
      setTenantInfo(prev => ({ ...prev, tenantName: prev.companyName }));
    }
    
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !plan) {
      return;
    }

    setIsLoading(true);

    try {
      // Create subscription with tenant info
      const subscriptionResponse = await apiRequest('/api/create-subscription', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          trialDays: plan.trialDays,
          // Include tenant information
          ...tenantInfo
        }),
      });

      const subscriptionData = await subscriptionResponse.json();
      
      if (!subscriptionResponse.ok) {
        throw new Error(subscriptionData.message || 'Subscription failed');
      }

      // Now confirm the setup intent
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        clientSecret: subscriptionData.clientSecret
      });

      if (error) {
        const errorMessage = error.message || "Eroare necunoscută";
        if (errorMessage.includes("test mode") || errorMessage.includes("test card") || errorMessage.includes("declined")) {
          toast({
            title: "Card invalid pentru test",
            description: "Folosește unul dintre cardurile de test Stripe afișate mai sus",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Eroare la configurarea abonamentului",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else if (setupIntent?.status === 'succeeded') {
        toast({
          title: "Perioada de probă activată!",
          description: `${plan.trialDays} zile gratuite au început`,
          variant: "default",
        });
        // Redirecționare manuală după succes
        setTimeout(() => {
          window.location.href = '/subscription-success';
        }, 1500);
      }
    } catch (err: any) {
      console.error("Setup error:", err);
      toast({
        title: "Eroare",
        description: err?.message || "A apărut o problemă la procesarea abonamentului",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Plan invalid</p>
        <Link href="/pricing">
          <Button variant="outline" className="mt-4">
            Înapoi la preturi
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Plan Summary */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {'popular' in plan && plan.popular && <Crown className="w-6 h-6 text-yellow-400" />}
                {plan.name}
              </CardTitle>
              <p className="text-gray-300 mt-2">{plan.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{plan.price}€</div>
              <div className="text-gray-300">per lună</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-400" />
                Caracteristici incluse:
              </h4>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mb-4">
                <Clock className="w-4 h-4 mr-1" />
                {plan.trialDays} zile perioada de probă gratuită
              </Badge>
              <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-blue-300">Garanție</span>
                </div>
                <p className="text-sm text-gray-300">
                  Poți anula oricând în primele {plan.trialDays} zile fără să plătești nimic.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
        <CardHeader>
          <CardTitle>
            {step === 'info' ? 'Date de contact și companie' : 'Activează perioada de probă'}
          </CardTitle>
          <p className="text-gray-300">
            {step === 'info' 
              ? 'Completează datele pentru crearea tenant-ului'
              : '🎁 Fără plată acum - facturarea începe după ' + plan.trialDays + ' zile'
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/30 mb-6">
            <h4 className="font-medium text-blue-300 mb-2">Carduri de test Stripe</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong>Visa:</strong> 4242 4242 4242 4242</p>
              <p><strong>Mastercard:</strong> 5555 5555 5555 4444</p>
              <p><strong>CVV:</strong> orice 3 cifre (ex: 123)</p>
              <p><strong>Data:</strong> orice dată viitoare (ex: 12/26)</p>
            </div>
          </div>
          {step === 'info' ? (
            <form onSubmit={handleInfoSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" />
                Informații despre companie
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName" className="text-gray-200">Nume Companie *</Label>
                  <Input
                    id="companyName"
                    value={tenantInfo.companyName}
                    onChange={(e) => setTenantInfo(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="ex: Transport Express SRL"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="tenantName" className="text-gray-200">Nume Tenant</Label>
                  <Input
                    id="tenantName"
                    value={tenantInfo.tenantName}
                    onChange={(e) => setTenantInfo(prev => ({ ...prev, tenantName: e.target.value }))}
                    placeholder="ex: TransportExpress"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Dacă nu completezi, se va folosi numele companiei</p>
                </div>
                
                <div>
                  <Label htmlFor="firstName" className="text-gray-200">Prenume *</Label>
                  <Input
                    id="firstName"
                    value={tenantInfo.firstName}
                    onChange={(e) => setTenantInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Prenumele tău"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="text-gray-200">Nume *</Label>
                  <Input
                    id="lastName"
                    value={tenantInfo.lastName}
                    onChange={(e) => setTenantInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Numele tău"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactEmail" className="text-gray-200">Email Contact *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={tenantInfo.contactEmail}
                    onChange={(e) => setTenantInfo(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="contact@companie.ro"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactPhone" className="text-gray-200">Telefon Contact</Label>
                  <Input
                    id="contactPhone"
                    value={tenantInfo.contactPhone}
                    onChange={(e) => setTenantInfo(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+40123456789"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/pricing">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Înapoi
                  </Link>
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  Continuă la plată
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <PaymentElement 
                options={{
                  layout: "tabs"
                }}
              />
              
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                  onClick={() => setStep('info')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Înapoi la date
                </Button>
                <Button
                  type="submit"
                  disabled={!stripe || !elements || isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Se procesează...
                    </>
                  ) : (
                    `🎁 Activează ${plan.trialDays} zile gratuite`
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Subscribe() {
  const params = useParams();
  const planId = params.planId;
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!planId || !(planId in planDetails)) {
      setIsLoading(false);
      return;
    }

    // Skip Stripe setup if keys are not configured
    if (!stripePromise || stripePublicKey === 'pk_test_demo') {
      setClientSecret("demo_client_secret");
      setIsLoading(false);
      return;
    }

    // Create subscription setup intent
    apiRequest("POST", "/api/create-subscription", { 
      planId,
      trialDays: planDetails[planId as keyof typeof planDetails].trialDays 
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(`✅ Trial setup created for ${data.trialDays || 3} days - no charge during trial`);
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Error creating subscription:', error);
        // Fallback pentru demo
        setClientSecret("demo_client_secret");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [planId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Se pregătește abonamentul...</p>
        </div>
      </div>
    );
  }

  if (!planId || !(planId in planDetails)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-red-400 mb-4">Plan invalid</p>
          <Link href="/pricing">
            <Button variant="outline">
              Înapoi la preturi
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Demo mode when Stripe is not configured
  if (!stripePromise || clientSecret === "demo_client_secret") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Finalizează <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Abonamentul</span>
            </h1>
            <p className="text-xl text-gray-300">
              Demonstrație - pentru funcționarea completă sunt necesare cheile Stripe
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white mb-8">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  {planDetails[planId as keyof typeof planDetails].name}
                </CardTitle>
                <p className="text-gray-300 mt-2">{planDetails[planId as keyof typeof planDetails].description}</p>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-5xl font-bold text-blue-400">
                    {planDetails[planId as keyof typeof planDetails].price}€/lună
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <Clock className="w-4 h-4 mr-1" />
                    3 zile perioada de probă gratuită
                  </Badge>
                  <div className="bg-yellow-500/20 p-4 rounded-lg border border-yellow-500/30 mt-6">
                    <p className="text-yellow-300 font-medium mb-2">Mod demonstrație</p>
                    <p className="text-gray-300 text-sm">
                      Pentru activarea plăților sunt necesare cheile Stripe (VITE_STRIPE_PUBLIC_KEY și STRIPE_SECRET_KEY)
                    </p>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1 border-white/30 text-white hover:bg-white/10"
                      asChild
                    >
                      <Link href="/pricing">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Înapoi
                      </Link>
                    </Button>
                    <Button
                      className="flex-1 bg-blue-500/50 hover:bg-blue-500/70 cursor-not-allowed"
                      disabled
                    >
                      Necesită configurare Stripe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Finalizează <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Abonamentul</span>
          </h1>
          <p className="text-xl text-gray-300">
            Alege-ți planul și începe perioada de probă gratuită astăzi
          </p>
        </motion.div>

        {stripePromise && clientSecret && clientSecret !== "demo_client_secret" ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm planId={planId} />
          </Elements>
        ) : (
          <div className="text-center text-white">
            <p>Stripe nu este configurat</p>
          </div>
        )}
      </div>
    </div>
  );
}