import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Gift, Star, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export default function SubscriptionSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Bun venit în <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Transport Pro</span>!
            </h1>
            <p className="text-xl text-gray-300">
              Abonamentul tău a fost activat cu succes
            </p>
          </div>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-green-400">
                <Gift className="w-6 h-6" />
                Perioada de probă activă
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-300">3</div>
                  <div className="text-sm text-gray-300">Zile gratuite</div>
                </div>
                <div className="bg-green-500/20 p-4 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-300">Acces complet</div>
                  <div className="text-sm text-gray-300">Toate funcțiile</div>
                </div>
                <div className="bg-purple-500/20 p-4 rounded-lg border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-300">24/7</div>
                  <div className="text-sm text-gray-300">Suport inclus</div>
                </div>
              </div>
              
              <div className="text-center text-gray-300">
                <p>Poți anula oricând în următoarele 3 zile fără să plătești nimic.</p>
                <p className="text-sm mt-2">Facturarea va începe după perioada de probă.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Ce urmează?</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                <CardContent className="p-6">
                  <Star className="w-8 h-8 text-yellow-400 mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Explorează sistemul</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Descoperă toate funcțiile avansate și vezi cum îți poate optimiza operațiunile.
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    asChild
                  >
                    <Link href="/">
                      Începe să folosești sistemul
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                <CardContent className="p-6">
                  <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Configurează contul</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Adaugă companiile și șoferii tăi pentru a începe să procesezi comenzi.
                  </p>
                  <Button 
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/10"
                    asChild
                  >
                    <Link href="/">
                      Configurează datele
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-lg border-green-500/30">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Ai întrebări? Suntem aici să te ajutăm!
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Echipa noastră de suport este disponibilă 24/7 pentru a te ghida.
                </p>
                <Button 
                  variant="outline"
                  className="border-green-500/50 text-green-300 hover:bg-green-500/10"
                >
                  Contactează suportul
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}