import React from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Route, Package } from 'lucide-react';

export const TruckBackground: React.FC = () => {
  const floatingElements = [
    { 
      icon: Truck, 
      x: '10%', 
      y: '20%', 
      delay: 0, 
      duration: 6, 
      size: 24, 
      color: 'text-blue-400/10',
      rotation: 15
    },
    { 
      icon: MapPin, 
      x: '85%', 
      y: '15%', 
      delay: 1, 
      duration: 8, 
      size: 20, 
      color: 'text-green-400/10',
      rotation: -20
    },
    { 
      icon: Truck, 
      x: '15%', 
      y: '80%', 
      delay: 2, 
      duration: 7, 
      size: 32, 
      color: 'text-purple-400/10',
      rotation: 45
    },
    { 
      icon: Route, 
      x: '90%', 
      y: '70%', 
      delay: 0.5, 
      duration: 9, 
      size: 28, 
      color: 'text-blue-400/10',
      rotation: -10
    },
    { 
      icon: Package, 
      x: '70%', 
      y: '25%', 
      delay: 3, 
      duration: 5, 
      size: 16, 
      color: 'text-orange-400/10',
      rotation: 30
    },
    { 
      icon: Truck, 
      x: '5%', 
      y: '45%', 
      delay: 1.5, 
      duration: 10, 
      size: 20, 
      color: 'text-indigo-400/10',
      rotation: -35
    },
    { 
      icon: MapPin, 
      x: '80%', 
      y: '90%', 
      delay: 4, 
      duration: 6, 
      size: 18, 
      color: 'text-teal-400/10',
      rotation: 60
    },
    { 
      icon: Truck, 
      x: '60%', 
      y: '5%', 
      delay: 2.5, 
      duration: 8, 
      size: 26, 
      color: 'text-pink-400/10',
      rotation: 0
    },
    { 
      icon: Route, 
      x: '25%', 
      y: '60%', 
      delay: 3.5, 
      duration: 7, 
      size: 22, 
      color: 'text-cyan-400/10',
      rotation: 25
    },
    { 
      icon: Package, 
      x: '95%', 
      y: '40%', 
      delay: 0.8, 
      duration: 11, 
      size: 14, 
      color: 'text-yellow-400/10',
      rotation: -45
    }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {floatingElements.map((element, index) => {
        const Icon = element.icon;
        return (
          <motion.div
            key={index}
            className={`absolute ${element.color}`}
            style={{
              left: element.x,
              top: element.y,
              transform: `rotate(${element.rotation}deg)`
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [element.rotation, element.rotation + 10, element.rotation],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: element.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: element.delay
            }}
          >
            <Icon size={element.size} />
          </motion.div>
        );
      })}
      
      {/* Animated Road Lines */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-5">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-full h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent"
            style={{ top: `${i * 6 + 10}px` }}
            animate={{
              x: [-100, window.innerWidth + 100],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.5
            }}
          />
        ))}
      </div>
      
      {/* Large Decorative Trucks */}
      <motion.div
        className="absolute top-1/4 -left-32 opacity-5"
        animate={{
          x: [-150, window.innerWidth + 150],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
          delay: 2
        }}
      >
        <svg viewBox="0 0 200 100" className="w-40 h-20 text-blue-400">
          <rect x="30" y="40" width="60" height="30" rx="4" fill="currentColor" />
          <rect x="90" y="30" width="40" height="40" rx="4" fill="currentColor" />
          <circle cx="45" cy="80" r="10" fill="currentColor" opacity="0.8" />
          <circle cx="105" cy="80" r="10" fill="currentColor" opacity="0.8" />
          <rect x="135" y="45" width="8" height="20" rx="2" fill="currentColor" opacity="0.7" />
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute top-2/3 -right-32 opacity-5"
        animate={{
          x: [window.innerWidth + 150, -150],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
          delay: 10
        }}
      >
        <svg viewBox="0 0 160 80" className="w-32 h-16 text-purple-400 transform scale-x-[-1]">
          <rect x="20" y="32" width="48" height="24" rx="3" fill="currentColor" />
          <rect x="68" y="24" width="32" height="32" rx="3" fill="currentColor" />
          <circle cx="32" cy="64" r="8" fill="currentColor" opacity="0.8" />
          <circle cx="84" cy="64" r="8" fill="currentColor" opacity="0.8" />
          <rect x="105" y="36" width="6" height="16" rx="1.5" fill="currentColor" opacity="0.7" />
        </svg>
      </motion.div>

      {/* Network Connection Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-5">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
            <stop offset="50%" style={{ stopColor: '#3B82F6', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        
        {[...Array(6)].map((_, i) => (
          <motion.line
            key={i}
            x1={`${10 + i * 15}%`}
            y1={`${20 + i * 10}%`}
            x2={`${30 + i * 15}%`}
            y2={`${40 + i * 10}%`}
            stroke="url(#connectionGradient)"
            strokeWidth="1"
            strokeDasharray="2,2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </svg>
    </div>
  );
};