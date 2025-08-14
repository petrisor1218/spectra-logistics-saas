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
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority']
        }
      }
    }
  },
  base: "/",
  publicDir: "public",
  optimizeDeps: {
    exclude: ['@shared'],
    include: ['react', 'react-dom', 'clsx', 'tailwind-merge']
  },
  define: {
    global: 'globalThis'
  }
});
