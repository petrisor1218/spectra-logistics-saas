# Multi-stage build pentru optimizare
FROM node:18-alpine AS base

# Instalează dependențele necesare
RUN apk add --no-cache libc6-compat

# Setează directorul de lucru
WORKDIR /app

# Copiază fișierele de configurare
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./
COPY drizzle-secondary.config.ts ./

# Instalează dependențele
RUN npm ci --only=production

# Stage pentru build
FROM base AS builder

# Instalează toate dependențele (inclusiv devDependencies)
RUN npm ci

# Copiază codul sursă
COPY . .

# Build pentru producție
RUN npm run build

# Stage pentru producție
FROM node:18-alpine AS runner

WORKDIR /app

# Creează utilizatorul non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiază fișierele necesare
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copiază scripturile și configurațiile
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server

# Schimbă proprietarul
RUN chown -R nextjs:nodejs /app

# Schimbă la utilizatorul non-root
USER nextjs

# Expune portul
EXPOSE 5000

# Setează variabilele de mediu
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Comanda de pornire
CMD ["node", "dist/index.js"]
