import React from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, Shield } from 'lucide-react';

export const TruckHero: React.FC = () => {
  const TruckSVG = () => (
    <svg viewBox="0 0 400 200" className="w-full h-full">
      <defs>
        <linearGradient id="truckGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#374151', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#111827', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Truck Body */}
      <rect x="60" y="80" width="120" height="60" rx="8" fill="url(#truckGradient)" />
      
      {/* Truck Cabin */}
      <rect x="180" y="60" width="80" height="80" rx="8" fill="url(#truckGradient)" />
      
      {/* Windows */}
      <rect x="190" y="70" width="25" height="20" rx="3" fill="#E5F3FF" opacity="0.9" />
      <rect x="225" y="70" width="25" height="20" rx="3" fill="#E5F3FF" opacity="0.9" />
      
      {/* Front Grille */}
      <rect x="260" y="85" width="15" height="40" rx="2" fill="#1F2937" />
      <line x1="265" y1="90" x2="265" y2="120" stroke="#9CA3AF" strokeWidth="1" />
      <line x1="270" y1="90" x2="270" y2="120" stroke="#9CA3AF" strokeWidth="1" />
      
      {/* Wheels */}
      <circle cx="100" cy="155" r="20" fill="url(#wheelGradient)" />
      <circle cx="100" cy="155" r="12" fill="#000000" />
      <circle cx="220" cy="155" r="20" fill="url(#wheelGradient)" />
      <circle cx="220" cy="155" r="12" fill="#000000" />
      
      {/* Wheel Details */}
      <circle cx="100" cy="155" r="6" fill="#6B7280" />
      <circle cx="220" cy="155" r="6" fill="#6B7280" />
      
      {/* Headlights */}
      <circle cx="275" cy="95" r="8" fill="#FEF3C7" opacity="0.9" />
      <circle cx="275" cy="115" r="8" fill="#FEF3C7" opacity="0.9" />
      
      {/* Side Details */}
      <rect x="70" y="90" width="100" height="3" fill="#1D4ED8" opacity="0.7" />
      <rect x="70" y="110" width="100" height="3" fill="#1D4ED8" opacity="0.7" />
      
      {/* Exhaust */}
      <rect x="45" y="75" width="8" height="25" rx="4" fill="#374151" />
      <ellipse cx="49" cy="72" rx="4" ry="2" fill="#6B7280" />
    </svg>
  );

  const features = [
    { icon: MapPin, text: 'Transport European', color: 'text-blue-400' },
    { icon: Clock, text: 'Tracking în Timp Real', color: 'text-green-400' },
    { icon: Shield, text: 'Plăți Securizate', color: 'text-purple-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative glass-effect rounded-2xl p-8 mb-8 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4 transform rotate-12">
          <Truck size={40} />
        </div>
        <div className="absolute top-8 right-8 transform -rotate-12">
          <Truck size={32} />
        </div>
        <div className="absolute bottom-4 left-1/4 transform rotate-45">
          <Truck size={24} />
        </div>
        <div className="absolute bottom-8 right-1/3 transform -rotate-30">
          <Truck size={36} />
        </div>
      </div>

      <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Content */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent mb-4">
              Sistema Transport
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Managementul complet al plăților și comenzilor de transport. 
              Automatizare avansată pentru companiile de transport european.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                  className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                >
                  <Icon className={`${feature.color} mb-2`} size={24} />
                  <span className="text-sm text-gray-300">{feature.text}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Content - Truck Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative"
        >
          <div className="relative">
            {/* Main Truck */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-full h-32 lg:h-40"
            >
              <TruckSVG />
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={{
                y: [0, -8, 0],
                x: [0, 5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center"
            >
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            </motion.div>

            <motion.div
              animate={{
                y: [0, -6, 0],
                x: [0, -3, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-8 -left-6 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center"
            >
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </motion.div>
          </div>

          {/* Route Line */}
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1, duration: 2, ease: "easeInOut" }}
            className="absolute -bottom-4 left-0 right-0"
          >
            <svg viewBox="0 0 300 20" className="w-full h-5">
              <motion.path
                d="M 0 10 Q 75 5 150 10 T 300 10"
                stroke="url(#routeGradient)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1, duration: 2, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.6 }} />
                  <stop offset="50%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};