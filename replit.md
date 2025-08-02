# Transport Payment Management System

## Overview

This is a modern React-based transport payment management application with an Express.js backend and PostgreSQL database. The system tracks payments for transport companies, offering features for file uploads, data processing, commission calculations, and payment history management. It aims to provide a robust, multi-tenant SaaS solution for transport companies, ensuring complete data isolation for each subscriber. The business vision is to offer a scalable and efficient tool for financial management in the transport sector, with a subscription-based monetization model.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architectural Decisions
- **Multi-Tenant SaaS**: Implemented with complete database isolation, where each subscriber gets a dedicated PostgreSQL schema (`tenant_[id]`). There is zero data sharing between tenants.
- **Data Isolation**: Achieved through `IsolationEnforcer` middleware and dynamic connection management, preventing any cross-database access. The main user (Petrisor) operates on the original database, while new subscribers have completely isolated environments.
- **Micro-interactions & UX**: Emphasizes modern UI/UX with glassmorphism design, responsive layouts, animated status cards, and dark/light mode support.

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter.
- **Styling**: Tailwind CSS with shadcn/ui components.
- **State Management**: React hooks with TanStack Query.
- **Animations**: Framer Motion.
- **File Processing**: XLSX library for Excel/CSV.

### Backend Architecture
- **Framework**: Express.js with TypeScript (ES Modules).
- **ORM**: Drizzle ORM for PostgreSQL.
- **Database**: PostgreSQL (Neon serverless).
- **Session Management**: connect-pg-simple for PostgreSQL session storage.
- **API Endpoints**: Structured for multi-tenant management, including migration and activation.

### Key Features and Implementations
- **Registration & Subscription System**: Single-page flow with real-time validation, Stripe integration for a single "Transport Pro" plan (99.99€/month with a 3-day trial), and a modern pricing page.
- **Transport Payment Management**: Handles VRID historical tracking, auto-numbering transport orders, complete PDF generation with company data and diacritics, and real-time company balance tracking.
- **Company Balance Management**: `company_balances` table, modern UI, calendar integration for balance generation, smart status logic (differences under 1 EUR marked as "paid"), and a synchronization feature.
- **Commission Exclusion**: Ensures commission amounts are correctly excluded from outstanding balance calculations for accurate financial tracking.
- **Admin Dashboard**: Comprehensive `/admin` interface for subscriber oversight, user roles, tenant isolation, and analytics.
- **Smart Company Matching**: Uses fuzzy logic with fallbacks for robust company identification.
- **Calendar Cleanup**: Logic implemented to prevent duplicate entries and ensure a clean calendar interface.

## External Dependencies

### Databases
- **PostgreSQL**: Primary database for all data, including tenant-specific schemas.
- **Neon Database**: Serverless PostgreSQL for database hosting.

### Payment Gateway
- **Stripe**: For subscription-based monetization and payment processing.

### Frontend Libraries
- **React ecosystem**: React, React DOM.
- **UI Components**: Radix UI primitives, shadcn/ui.
- **Styling**: Tailwind CSS, class-variance-authority, clsx.
- **Animation**: Framer Motion, embla-carousel.
- **Data Fetching**: TanStack React Query.
- **File Processing**: XLSX, date-fns.
- **Form Handling**: React Hook Form, hookform/resolvers.

### Backend Libraries
- **Express.js**: Server framework.
- **Drizzle ORM**: Database operations.
- **connect-pg-simple**: PostgreSQL session management.
- **tsx**: TypeScript execution.
- **esbuild**: Server bundling.

### Deployment & Tools
- **Vite**: Frontend build tooling and development server.
- **PostCSS**: For Tailwind CSS processing.
- **ESLint**: Code linting.
- **Railway**: Target deployment platform, with configurations for production builds, health checks, and static serving.
- **Supabase**: Used for migration and isolation implementation, with `SupabaseMultiTenantManager`, `SupabaseMainStorage`, and `SupabaseTenantManager` components.