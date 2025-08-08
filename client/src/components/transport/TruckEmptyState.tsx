import React from 'react';
import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';

interface TruckEmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const TruckEmptyState: React.FC<TruckEmptyStateProps> = ({
  icon: Icon = Truck,
  title,
  description,
  actionText,
  onAction
}) => {
  const TruckConvoy = () => (
    <div className="relative w-64 h-32 mx-auto mb-8">
      {/* Large Main Truck */}
      <motion.div
        animate={{
          x: [0, 20, 0],
          y: [0, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute left-16 top-4"
      >
        <svg viewBox="0 0 120 60" className="w-24 h-12">
          <rect x="15" y="20" width="40" height="20" rx="3" fill="#3B82F6" />
          <rect x="55" y="15" width="25" height="25" rx="3" fill="#3B82F6" />
          <circle cx="25" cy="45" r="6" fill="#374151" />
          <circle cx="65" cy="45" r="6" fill="#374151" />
          <circle cx="25" cy="45" r="3" fill="#000000" />
          <circle cx="65" cy="45" r="3" fill="#000000" />
          <rect x="82" y="25" width="5" height="10" rx="1" fill="#1F2937" />
          <circle cx="88" cy="23" r="2" fill="#FEF3C7" />
          <rect x="20" y="25" width="30" height="1" fill="#1D4ED8" opacity="0.7" />
        </svg>
      </motion.div>

      {/* Medium Truck */}
      <motion.div
        animate={{
          x: [0, -15, 0],
          y: [0, -3, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
        className="absolute left-32 top-8"
      >
        <svg viewBox="0 0 90 45" className="w-18 h-9 opacity-80">
          <rect x="10" y="15" width="30" height="15" rx="2" fill="#8B5CF6" />
          <rect x="40" y="12" width="18" height="18" rx="2" fill="#8B5CF6" />
          <circle cx="18" cy="33" r="4" fill="#374151" />
          <circle cx="48" cy="33" r="4" fill="#374151" />
          <circle cx="18" cy="33" r="2" fill="#000000" />
          <circle cx="48" cy="33" r="2" fill="#000000" />
          <rect x="60" y="18" width="3" height="6" rx="1" fill="#1F2937" />
          <circle cx="65" cy="17" r="1.5" fill="#FEF3C7" />
        </svg>
      </motion.div>

      {/* Small Truck */}
      <motion.div
        animate={{
          x: [0, 10, 0],
          y: [0, -2, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute left-4 top-12"
      >
        <svg viewBox="0 0 60 30" className="w-12 h-6 opacity-60">
          <rect x="5" y="8" width="20" height="10" rx="1" fill="#10B981" />
          <rect x="25" y="6" width="12" height="12" rx="1" fill="#10B981" />
          <circle cx="11" cy="22" r="3" fill="#374151" />
          <circle cx="31" cy="22" r="3" fill="#374151" />
          <circle cx="11" cy="22" r="1.5" fill="#000000" />
          <circle cx="31" cy="22" r="1.5" fill="#000000" />
          <rect x="39" y="10" width="2" height="4" rx="0.5" fill="#1F2937" />
          <circle cx="42" cy="9" r="1" fill="#FEF3C7" />
        </svg>
      </motion.div>

      {/* Road Lines */}
      <motion.div
        animate={{
          x: [0, 100, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-0 left-0 right-0"
      >
        <svg viewBox="0 0 200 10" className="w-full h-3">
          <line x1="0" y1="5" x2="20" y2="5" stroke="#4B5563" strokeWidth="2" strokeDasharray="10,10" />
          <line x1="40" y1="5" x2="60" y2="5" stroke="#4B5563" strokeWidth="2" strokeDasharray="10,10" />
          <line x1="80" y1="5" x2="100" y2="5" stroke="#4B5563" strokeWidth="2" strokeDasharray="10,10" />
          <line x1="120" y1="5" x2="140" y2="5" stroke="#4B5563" strokeWidth="2" strokeDasharray="10,10" />
          <line x1="160" y1="5" x2="180" y2="5" stroke="#4B5563" strokeWidth="2" strokeDasharray="10,10" />
        </svg>
      </motion.div>

      {/* Floating Icons */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
        className="absolute top-0 right-0 text-blue-400 opacity-30"
      >
        <Truck size={16} />
      </motion.div>

      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [0, -15, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute top-2 left-0 text-purple-400 opacity-20"
      >
        <Truck size={12} />
      </motion.div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-16 px-6"
    >
      <TruckConvoy />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
            <Icon size={32} className="text-blue-400" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-lg leading-relaxed max-w-md mx-auto">{description}</p>
        
        {actionText && onAction && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAction}
            className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
          >
            {actionText}
          </motion.button>
        )}
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-8 left-8"
        >
          <Truck size={24} />
        </motion.div>
        
        <motion.div
          animate={{
            rotate: [0, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-8 right-8"
        >
          <Truck size={20} />
        </motion.div>
      </div>
    </motion.div>
  );
};