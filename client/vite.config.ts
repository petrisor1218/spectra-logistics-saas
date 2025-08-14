import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "./src"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false
  },
  base: "/",
  publicDir: "public",
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  }
});
