import { motion } from "framer-motion";
import { Truck, Bell, LogOut, User, Shield } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsDropdown } from "@/components/ui/notifications-dropdown";

export function NavigationHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isLoggingOut } = useAuth();

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
              <h1 className="text-xl font-bold gradient-text">Transport Payment System</h1>
              <p className="text-gray-400 text-sm">Professional Dashboard</p>
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
            
            {/* Admin Dashboard Button - Only for admins */}
            {user?.role === 'admin' && (
              <Button
                onClick={() => {
                  console.log('Navigating to admin dashboard...');
                  window.location.href = '/admin';
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}

            {/* User Info */}
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
              <User size={16} />
              <span>{user?.username}</span>
            </div>

            {/* Notifications */}
            <NotificationsDropdown user={user || null} />

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
