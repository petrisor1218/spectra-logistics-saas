import { motion } from "framer-motion";
import { Truck, Bell, LogOut, User, Shield, BarChart3, Database, Building } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export function NavigationHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isLoggingOut } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Check if we're in tenant context
  const isTenantContext = location.includes('/tenant/');
  const tenantMatch = location.match(/\/tenant\/(\d+)/);
  const tenantId = tenantMatch ? tenantMatch[1] : null;

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-effect fixed top-0 left-0 right-0 z-50 border-b border-white/10"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center animate-float">
              <Truck className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                {isTenantContext ? `Tenant #${tenantId} Dashboard` : 'Transport Payment System'}
              </h1>
              <p className="text-gray-400 text-sm">
                {isTenantContext ? 'Multi-Tenant Environment' : 'Professional Dashboard'}
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Dark Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">🌙</span>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-sm text-gray-400">☀️</span>
            </div>
            
            {/* Analytics Button */}
            <Button
              onClick={() => setLocation('/analytics')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              size="sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>

            {/* Backup Button */}
            <Button
              onClick={() => setLocation('/backup')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              size="sm"
            >
              <Database className="w-4 h-4 mr-2" />
              Backup
            </Button>




            
            {/* Show tenant info when in tenant context */}
            {isTenantContext && (
              <>
                <div className="w-px h-6 bg-white/20"></div>
                <div className="flex items-center space-x-2 text-sm">
                  <Building className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 font-medium">Tenant #{tenantId}</span>
                </div>
                
                {/* Back to main login */}
                <Button
                  onClick={() => setLocation('/login')}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
                  size="sm"
                  variant="outline"
                >
                  ← Ieșire din tenant
                </Button>
              </>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
              <User size={16} />
              <span>{user?.username}</span>
            </div>

            {/* Notifications */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button className="w-10 h-10 glass-effect rounded-xl flex items-center justify-center hover-glow">
                <Bell size={18} />
              </button>
              <span className="notification-badge absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </motion.div>

            {/* Logout Button */}
            <Button
              onClick={logout}
              disabled={isLoggingOut}
              variant="outline"
              size="sm"
              className="glass-effect-card border-white/10 hover:border-red-500/30 text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
            >
              <LogOut size={16} className="mr-2" />
              {isLoggingOut ? 'Se deconectează...' : 'Ieșire'}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
