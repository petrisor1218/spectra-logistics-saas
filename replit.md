# Transport Payment Management System

## Overview

This is a modern React-based transport payment management application with an Express.js backend and PostgreSQL database. The system enables transport companies to manage payment tracking, including features for file uploads, data processing, commission calculations, and payment history management. It also incorporates a multi-tenant SaaS architecture for scalable subscriber management and a robust subscription-based monetization system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- Modern glassmorphism design.
- Responsive layout with mobile support.
- Animated status cards and progress bars.
- Professional dashboard interface.
- Dark/light theme toggle.
- Enhanced UX for registration with real-time validation, smart error handling, and step-by-step progress indicators.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, Tailwind CSS with shadcn/ui components, React hooks with TanStack Query for server state, Framer Motion for animations, custom theme provider, and XLSX for Excel file handling.
- **Backend**: Express.js with TypeScript, ES Modules, hot reloading with Vite integration, PostgreSQL database with Drizzle ORM, and Connect-pg-simple for session management.
- **Database**: PostgreSQL (Neon serverless), Drizzle ORM, Zod schemas for validation, automated seeding, and proper foreign key relationships.
- **Multi-Tenancy**: **COMPLETE DATA ISOLATION ACHIEVED** through separate PostgreSQL schemas for each subscriber, managed by an `IsolationEnforcer` middleware and `TenantStorageFixed` adapter. Each tenant gets a dedicated schema with explicit SQL queries (e.g., `tenant_1754291118685_qi17iipyv.companies`). Registration creates schemas automatically. Zero data leakage confirmed - tenants see 0 records while main database remains separate.
- **Core Features**:
    - **File Upload System**: Supports CSV and Excel for TRIP, 7-day, and 30-day invoices with drag-and-drop.
    - **Driver-Company Mapping**: Hardcoded mapping with company-specific commission rates (e.g., 2% for Fast Express, 4% for others).
    - **Payment Processing**: Weekly cycles (Sunday to Saturday) with calendar-based week selection, commission calculations, and payment tracking.
    - **Company Balance Management**: `company_balances` table with a modern UI, calendar integration, smart status logic (differences under 1 EUR marked as paid), and a synchronization feature.
    - **Subscription System**: Single plan ("Transport Pro" at 99.99€/month with 3-day free trial) integrated with Stripe for payment processing.
    - **Admin Dashboard**: Comprehensive management interface at `/admin` for subscriber oversight, user roles (Admin/Subscriber), tenant isolation, and analytics.

## External Dependencies

- **Frontend Libraries**: React, React DOM, Radix UI primitives, shadcn/ui, Tailwind CSS, class-variance-authority, clsx, Framer Motion, embla-carousel, TanStack React Query, XLSX, date-fns, React Hook Form, hookform/resolvers.
- **Backend Libraries**: Express.js, Drizzle ORM, Neon Database (serverless PostgreSQL), connect-pg-simple, tsx, esbuild.
- **Payment Gateway**: Stripe.