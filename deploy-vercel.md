# 🚀 Deploy Instant pe Vercel - Spectra Logistics SaaS

## ⚡ Deploy în 2 minute!

### 1. Instalează Vercel CLI
```bash
npm install -g vercel
```

### 2. Login la Vercel
```bash
vercel login
```

### 3. Deploy Instant
```bash
vercel
```

### 4. Urmează instrucțiunile:
- **Project name**: `spectra-logistics-saas`
- **Directory**: `.` (current directory)
- **Override settings**: `No`

## 🔧 Configurarea Variabilelor de Mediu

După primul deploy, configurează variabilele de mediu în Vercel Dashboard:

### 1. Accesează Vercel Dashboard
```bash
vercel dashboard
```

### 2. Adaugă Environment Variables
În secțiunea **Settings > Environment Variables**:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/spectra_main
SECONDARY_DATABASE_URL=postgresql://user:password@host:5432/spectra_admin

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PROMOTIONAL_PRICE_ID=price_...
STRIPE_REGULAR_PRICE_ID=price_...

# Session Configuration
SESSION_SECRET=your-super-secret-session-key

# Domain Configuration
MAIN_DOMAIN=yourdomain.com
ADMIN_SUBDOMAIN=admin.yourdomain.com
```

### 3. Redeploy cu variabilele noi
```bash
vercel --prod
```

## 🌐 Configurarea DNS pentru Subdomain-uri

### 1. Adaugă domeniul personalizat în Vercel
```bash
vercel domains add yourdomain.com
```

### 2. Configurează DNS Records
În provider-ul tău DNS, adaugă:

```
# Wildcard pentru tenantii
*.yourdomain.com     CNAME   cname.vercel-dns.com

# Admin subdomain
admin.yourdomain.com CNAME   cname.vercel-dns.com

# Main domain
yourdomain.com       CNAME   cname.vercel-dns.com
```

## 📊 Monitorizarea Deploy-ului

### 1. Verifică statusul
```bash
vercel ls
```

### 2. Vezi logs în timp real
```bash
vercel logs
```

### 3. Monitorizează performanța
```bash
vercel analytics
```

## 🔄 Workflow de Deploy

### Development
```bash
# Deploy la preview
vercel

# Deploy la staging
vercel --target staging
```

### Production
```bash
# Deploy la producție
vercel --prod

# Deploy cu confirmare
vercel --prod --confirm
```

## 🚀 Optimizări pentru Vercel

### 1. Edge Functions
Pentru funcții cu latence mică, creează în `api/`:

```typescript
// api/health.ts
export default function handler(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### 2. Static Assets
Optimizează imagini și fișiere statice:

```bash
# Optimizează imagini
vercel build

# Serve static assets
vercel --static
```

### 3. Caching
Configurează cache-ul în `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=0"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🔍 Debugging

### 1. Local Development
```bash
# Pornește local cu Vercel
vercel dev

# Pornește cu debug
DEBUG=* vercel dev
```

### 2. Logs și Monitoring
```bash
# Vezi logs
vercel logs

# Monitorizează funcții
vercel functions list

# Testează funcții
vercel functions invoke api/health
```

### 3. Performance
```bash
# Analizează bundle-ul
vercel build --analyze

# Testează performanța
vercel speed-insights
```

## 🛡️ Securitate

### 1. Environment Variables
- Niciodată nu commita chei secrete în Git
- Folosește Vercel Environment Variables
- Rotatează cheile periodic

### 2. CORS Configuration
```typescript
// server/index.ts
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://admin.yourdomain.com',
    'https://*.yourdomain.com'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  next();
});
```

### 3. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

## 📈 Scaling

### 1. Auto-scaling
Vercel scalează automat, dar poți optimiza:

```json
{
  "functions": {
    "server/index.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Database Connection Pooling
```typescript
// server/db-secondary.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. Caching Strategy
```typescript
// Cache pentru tenant data
const tenantCache = new Map();

export const getTenantWithCache = async (subdomain: string) => {
  if (tenantCache.has(subdomain)) {
    return tenantCache.get(subdomain);
  }
  
  const tenant = await getTenantBySubdomain(subdomain);
  tenantCache.set(subdomain, tenant);
  
  return tenant;
};
```

## 🎯 URLs după Deploy

### Main Domain
- **Landing Page**: `https://yourdomain.com`
- **Înregistrare**: `https://yourdomain.com/register`
- **Login**: `https://yourdomain.com/login`

### Admin Dashboard
- **Admin**: `https://admin.yourdomain.com`
- **Tenant Management**: `https://admin.yourdomain.com/admin`

### Tenant Subdomains
- **Tenant 1**: `https://tenant1.yourdomain.com`
- **Tenant 2**: `https://tenant2.yourdomain.com`
- **Test Tenant**: `https://test-transport.yourdomain.com`

## 🚀 Comenzi Rapide

```bash
# Deploy instant
vercel

# Deploy la producție
vercel --prod

# Vezi status
vercel ls

# Vezi logs
vercel logs

# Local development
vercel dev

# Pull environment variables
vercel env pull .env.local

# Deploy cu preview
vercel --target preview
```

## 🎉 Gata!

Platforma ta SaaS multi-tenant este acum live pe Vercel cu:
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ SSL automat
- ✅ Monitoring integrat
- ✅ Deploy instant
- ✅ Preview deployments
- ✅ Rollback automat

**URL-ul tău live**: `https://your-project.vercel.app`

---

**Spectra Logistics** - Deploy instant, scale global! 🚛✨
