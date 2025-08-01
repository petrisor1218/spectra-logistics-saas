import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  subscriptionStatus: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
}

interface SubscriptionNotificationProps {
  user: User | null;
}

export function SubscriptionNotification({ user }: SubscriptionNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeInfo, setTimeInfo] = useState<{
    type: 'trial' | 'subscription' | 'expired';
    daysRemaining: number;
    message: string;
    icon: any;
    bgColor: string;
    textColor: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    const calculateTimeInfo = () => {
      const now = new Date();
      
      // Check trial status
      if (user.subscriptionStatus === 'trialing' && user.trialEndsAt) {
        const trialEnd = new Date(user.trialEndsAt);
        const diffTime = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          setTimeInfo({
            type: 'trial',
            daysRemaining: diffDays,
            message: `Perioada de probă se termină în ${diffDays} ${diffDays === 1 ? 'zi' : 'zile'}`,
            icon: Clock,
            bgColor: 'bg-blue-500/20',
            textColor: 'text-blue-400'
          });
          return;
        }
      }
      
      // Check active subscription
      if (user.subscriptionStatus === 'active' && user.subscriptionEndsAt) {
        const subscriptionEnd = new Date(user.subscriptionEndsAt);
        const diffTime = subscriptionEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          setTimeInfo({
            type: 'subscription',
            daysRemaining: diffDays,
            message: `Următoarea facturare în ${diffDays} ${diffDays === 1 ? 'zi' : 'zile'}`,
            icon: Calendar,
            bgColor: 'bg-green-500/20',
            textColor: 'text-green-400'
          });
          return;
        }
      }
      
      // Expired or inactive
      if (user.subscriptionStatus === 'canceled' || user.subscriptionStatus === 'inactive') {
        setTimeInfo({
          type: 'expired',
          daysRemaining: 0,
          message: 'Abonamentul a expirat. Reactivează pentru a continua.',
          icon: AlertTriangle,
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-400'
        });
      }
    };

    calculateTimeInfo();
    
    // Update every hour
    const interval = setInterval(calculateTimeInfo, 3600000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || !timeInfo || !isVisible) return null;

  const IconComponent = timeInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        className={`fixed top-4 right-4 z-50 ${timeInfo.bgColor} backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl max-w-sm`}
      >
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg ${timeInfo.bgColor} ${timeInfo.textColor}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <div className={`font-medium ${timeInfo.textColor} mb-1`}>
              {timeInfo.type === 'trial' && 'Perioada de Probă'}
              {timeInfo.type === 'subscription' && 'Abonament Activ'}
              {timeInfo.type === 'expired' && 'Abonament Expirat'}
            </div>
            <div className="text-white/80 text-sm">
              {timeInfo.message}
            </div>
            
            {timeInfo.type === 'trial' && timeInfo.daysRemaining <= 2 && (
              <motion.div 
                className="mt-2 text-xs text-yellow-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Activează abonamentul pentru continuitate
              </motion.div>
            )}
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/60 hover:text-white/80 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress bar for trial */}
        {timeInfo.type === 'trial' && (
          <div className="mt-3">
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.max(0, (timeInfo.daysRemaining / 3) * 100)}%` 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-2 rounded-full ${
                  timeInfo.daysRemaining > 1 ? 'bg-blue-400' : 'bg-yellow-400'
                }`}
              />
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Început probă</span>
              <span>Sfârșit probă</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}