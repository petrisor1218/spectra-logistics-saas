import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, Clock, Crown, Star, Shield } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from "@/lib/queryClient";

// Temporar pentru dezvoltare - înlocuiește cu secretul real când este setat
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_demo';
const stripePromise = stripePublicKey !== 'pk_test_demo' ? loadStripe(stripePublicKey) : null;

const planDetails = {
  basic: {
    name: 'Plan Basic',
    price: 29,
    description: 'Perfect pentru transportatori mici',
    trialDays: 3,
    features: [
      'Până la 50 de comenzi/lună',
      'Tracking plăți de bază',
      'Calculatoare comisioane',
      'Rapoarte săptămânale',
      'Suport email'
    ]
  },
  professional: {
    name: 'Plan Professional',
    price: 79,
    description: 'Ideal pentru companii de transport',
    trialDays: 3,
    popular: true,
    features: [
      'Comenzi nelimitate',
      'Tracking avansat plăți',
      'Gestionare companii multiple',
      'Bilanțuri automate',
      'Rapoarte avansate',
      'Export PDF profesional',
      'Integrări API',
      'Suport prioritar'
    ]
  }
};

function SubscribeForm({ planId }: { planId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const plan = planDetails[planId as keyof typeof planDetails];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !plan) {
      return;
    }

    setIsLoading(true);

    try {
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
      }
    } catch (err) {
      toast({
        title: "Eroare",
        description: "A apărut o problemă la procesarea abonamentului",
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
          <CardTitle>Finalizează abonamentul</CardTitle>
          <p className="text-gray-300">
            Vei fi facturat după perioada de probă de {plan.trialDays} zile
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                asChild
              >
                <Link href="/pricing">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Înapoi
                </Link>
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
                  `Începe perioada de probă (${plan.trialDays} zile gratuite)`
                )}
              </Button>
            </div>
          </form>
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

    // Create subscription setup intent
    apiRequest("POST", "/api/create-subscription", { 
      planId,
      trialDays: planDetails[planId as keyof typeof planDetails].trialDays 
    })
      .then((response) => response.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Error creating subscription:', error);
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

  if (!clientSecret || !planId || !(planId in planDetails)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-red-400 mb-4">Plan invalid sau eroare la încărcarea datelor</p>
          <Link href="/pricing">
            <Button variant="outline">
              Înapoi la preturi
            </Button>
          </Link>
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

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <SubscribeForm planId={planId} />
        </Elements>
      </div>
    </div>
  );
}