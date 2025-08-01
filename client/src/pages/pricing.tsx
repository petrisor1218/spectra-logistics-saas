import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Truck, TrendingUp, Shield, Clock } from 'lucide-react';
import { Link } from 'wouter';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  period: string;
  icon: React.ComponentType<any>;
  features: string[];
  popular?: boolean;
  cta: string;
  trialDays?: number;
}

const plans: PricingPlan[] = [
  {
    id: 'professional',
    name: 'Transport Pro',
    description: 'Soluția completă pentru managementul transporturilor',
    price: 99.99,
    period: 'lună',
    icon: Crown,
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
    ],
    popular: true,
    cta: 'Începe perioada de probă',
    trialDays: 3
  }
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Top Navigation */}
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="outline" 
          className="border-white/30 text-white hover:bg-white/10"
          asChild
        >
          <Link href="/login">
            Login
          </Link>
        </Button>
      </div>
      
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
            <Star className="w-4 h-4 mr-1" />
            Perioada de probă gratuită
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-6">
            Planuri de <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Preturi</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transformă-ți operațiunile de transport cu cel mai avansat sistem de management. 
            Perioada de probă gratuită, fără obligații.
          </p>
        </motion.div>

        {/* Pricing Card */}
        <div className="flex justify-center max-w-2xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative w-full max-w-lg"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 text-base font-medium">
                    <Star className="w-5 h-5 mr-2" />
                    Soluția recomandată
                  </Badge>
                </div>
                
                <Card className="h-full bg-white/10 backdrop-blur-lg border-white/20 text-white transition-all duration-300 hover:scale-105 hover:bg-white/15 ring-2 ring-blue-500/50">
                  <CardHeader className="text-center pb-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500">
                      <Icon className="w-10 h-10" />
                    </div>
                    
                    <CardTitle className="text-3xl font-bold mb-3">{plan.name}</CardTitle>
                    <p className="text-gray-300 mb-8 text-lg">{plan.description}</p>
                    
                    <div className="space-y-2">
                      {plan.originalPrice && (
                        <div className="text-gray-400 line-through text-lg">
                          {plan.originalPrice}€/{plan.period}
                        </div>
                      )}
                      <div className="text-5xl font-bold">
                        {plan.price}€
                        <span className="text-xl text-gray-300">/{plan.period}</span>
                      </div>
                      {plan.trialDays && (
                        <Badge variant="outline" className="border-green-500/50 text-green-300">
                          <Clock className="w-3 h-3 mr-1" />
                          {plan.trialDays} zile gratuite
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-200">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full py-8 text-xl font-medium transition-all duration-300 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-blue-500/25"
                      asChild
                    >
                      <Link href={`/subscribe/${plan.id}`}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Features Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-12">
            De ce să alegi Transport Pro?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: 'Automatizare Completă',
                description: 'Calculează automat comisioanele și gestionează plățile'
              },
              {
                icon: TrendingUp,
                title: 'Creștere Eficiență',
                description: 'Reduce timpul de procesare cu până la 80%'
              },
              {
                icon: Shield,
                title: 'Date Sigure',
                description: 'Backup automat și conformitate GDPR'
              },
              {
                icon: Clock,
                title: 'Suport 24/7',
                description: 'Echipa noastră te ajută oricând ai nevoie'
              }
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card key={idx} className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-gray-300 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center"
        >
          <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-lg border-blue-500/30 max-w-4xl mx-auto">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Gata să revolutionezi transporturile?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Alătură-te la sute de companii care și-au optimizat operațiunile cu sistemul nostru.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 text-lg"
                  asChild
                >
                  <Link href="/register">
                    Începe perioada de probă
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
                  asChild
                >
                  <Link href="/login">
                    Am deja cont - Login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}