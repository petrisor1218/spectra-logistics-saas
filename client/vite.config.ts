import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "./src",
      "@shared": "../shared",
      "@assets": "../attached_assets"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  base: "/",
  publicDir: "public",
  optimizeDeps: {
    exclude: ['@shared']
  }
});
