import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, AlertTriangle, CheckCircle, Bell } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
}

interface NotificationsDropdownProps {
  user: User | null;
}

export function NotificationsDropdown({ user }: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const generateNotifications = () => {
      const now = new Date();
      const newNotifications = [];
      
      // Verifică perioada de probă
      if (user.subscriptionStatus === 'trialing' && user.trialEndsAt) {
        const trialEnd = new Date(user.trialEndsAt);
        const diffTime = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          newNotifications.push({
            id: 'trial',
            type: 'trial',
            title: 'Perioada de Probă',
            message: `Perioada de probă se termină în ${diffDays} ${diffDays === 1 ? 'zi' : 'zile'}`,
            daysRemaining: diffDays,
            icon: Clock,
            color: diffDays <= 2 ? 'text-yellow-400' : 'text-blue-400',
            bgColor: diffDays <= 2 ? 'bg-yellow-500/20' : 'bg-blue-500/20',
            priority: diffDays <= 2 ? 'high' : 'medium'
          });
        }
      }
      
      // Verifică abonamentul activ
      if (user.subscriptionStatus === 'active' && user.subscriptionEndsAt) {
        const subscriptionEnd = new Date(user.subscriptionEndsAt);
        const diffTime = subscriptionEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays <= 7) {
          newNotifications.push({
            id: 'billing',
            type: 'billing',
            title: 'Facturare Apropiată',
            message: `Următoarea facturare în ${diffDays} ${diffDays === 1 ? 'zi' : 'zile'}`,
            daysRemaining: diffDays,
            icon: Calendar,
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            priority: 'low'
          });
        }
      }
      
      // Abonament expirat
      if (user.subscriptionStatus === 'canceled' || user.subscriptionStatus === 'inactive') {
        newNotifications.push({
          id: 'expired',
          type: 'expired',
          title: 'Abonament Expirat',
          message: 'Abonamentul a expirat. Reactivează pentru a continua.',
          daysRemaining: 0,
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          priority: 'high'
        });
      }

      setNotifications(newNotifications);
      setHasNotifications(newNotifications.length > 0);
    };

    generateNotifications();
    
    // Actualizează la fiecare oră
    const interval = setInterval(generateNotifications, 3600000);
    return () => clearInterval(interval);
  }, [user]);

  // Închide dropdown când se dă click în afara lui
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 glass-effect rounded-xl flex items-center justify-center hover-glow relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell size={18} className="text-white" />
        {hasNotifications && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 glass-effect border border-white/10 rounded-xl shadow-xl z-50"
          >
            <div className="p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notificări</span>
              </h3>

              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2 opacity-50" />
                  <p className="text-white/60">Nu ai notificări noi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => {
                    const IconComponent = notification.icon;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${notification.bgColor} border border-white/10 rounded-lg p-3`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${notification.bgColor} ${notification.color}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1">
                            <div className={`font-medium ${notification.color} text-sm`}>
                              {notification.title}
                            </div>
                            <div className="text-white/80 text-xs mt-1">
                              {notification.message}
                            </div>
                            
                            {notification.type === 'trial' && notification.daysRemaining <= 2 && (
                              <motion.div 
                                className="mt-2 text-xs text-yellow-400"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                Activează abonamentul pentru continuitate
                              </motion.div>
                            )}

                            {/* Bară de progres pentru perioada de probă */}
                            {notification.type === 'trial' && (
                              <div className="mt-2">
                                <div className="w-full bg-white/10 rounded-full h-1.5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ 
                                      width: `${Math.max(0, (notification.daysRemaining / 3) * 100)}%` 
                                    }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-1.5 rounded-full ${
                                      notification.daysRemaining > 1 ? 'bg-blue-400' : 'bg-yellow-400'
                                    }`}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-white/40 mt-1">
                                  <span>Început</span>
                                  <span>Sfârșit</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Link către pagina de abonament */}
              {notifications.some(n => n.type === 'trial' || n.type === 'expired') && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      window.location.href = '/pricing';
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                  >
                    Gestionează Abonamentul
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}