import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  loading: boolean;
}

export function LoadingOverlay({ loading }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="glass-effect rounded-2xl p-8 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <motion.div 
              className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="text-white" size={32} />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Procesare în curs...</h3>
            <p className="text-gray-400">Vă rugăm să așteptați</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
