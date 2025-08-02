# Transport Pro - Multi-Tenant Logistics Management Platform

A comprehensive SaaS application for managing transport logistics with complete data isolation, built with React + Node.js + PostgreSQL.

## 🚀 Railway Deployment

This application is fully configured for Railway deployment with:

- **Frontend**: React + TypeScript with Vite build system
- **Backend**: Node.js + Express with multi-tenant architecture  
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe integration for subscriptions
- **Isolation**: Complete database schema separation per tenant

### Quick Deploy to Railway

1. **Connect Repository**:
   ```bash
   # Fork or clone this repository to your GitHub account
   https://github.com/petrisor1218/Amazontripsplit
   ```

2. **Create New Project** in Railway Dashboard
   - Connect your GitHub account
   - Select this repository
   - Railway will auto-detect the Node.js app

3. **Configure Environment Variables**:
   ```env
   DATABASE_URL=postgresql://...  # Railway provides this
   NODE_ENV=production
   PORT=3000
   
   # Add your Stripe keys
   STRIPE_SECRET_KEY=sk_live_...
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   
   # Generate random session secret
   SESSION_SECRET=your_random_string_here
   ```

4. **Deploy**: Railway automatically builds and deploys!

### Build Process

Railway uses the configured build process:
1. `vite build` - Builds React frontend to `/dist/public`
2. `esbuild server/index.ts` - Bundles Node.js backend to `/dist`
3. Serves frontend static files + API from single Express server

### Features

- ✅ **Multi-tenant SaaS** with complete database isolation
- ✅ **Stripe subscriptions** with 3-day free trial
- ✅ **Transport management** with auto-numbering orders
- ✅ **Commission calculations** (2% Fast Express, 4% others)
- ✅ **PDF generation** with Romanian diacritics
- ✅ **Real-time payment tracking** with smart rounding
- ✅ **Admin dashboard** with tenant management
- ✅ **Glassmorphism UI** with dark/light themes

### Architecture

```
/client/               # React frontend source
/server/               # Node.js backend source  
/shared/               # Shared TypeScript types
/dist/public/          # Built frontend (production)
/dist/index.js         # Built backend (production)
```

### Database Schema

Each tenant gets a separate PostgreSQL schema:
- **Main user**: Uses original database schema
- **Tenants**: Each gets `tenant_[id]` schema with isolated data
- **Zero data sharing**: Complete isolation enforced

### Health Checks

- Endpoint: `/api/health`
- Returns: Server status, timestamp, environment
- Used by Railway for deployment health monitoring

## Development

```bash
npm install
npm run dev     # Development server with HMR
npm run build   # Production build
npm run start   # Production server
```

### Local Development Setup

1. Clone repository
2. Set up PostgreSQL database
3. Copy `.env.example` to `.env` and configure
4. Run `npm install`
5. Run `npm run db:push` to set up database
6. Run `npm run dev` for development

## Support

For deployment issues or questions, contact support through the application admin dashboard.