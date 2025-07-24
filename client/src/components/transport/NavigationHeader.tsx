import { motion } from "framer-motion";
import { Truck, Bell } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Switch } from "@/components/ui/switch";

export function NavigationHeader() {
  const { theme, toggleTheme } = useTheme();

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
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
