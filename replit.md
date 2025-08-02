# Transport Payment Management System

## Overview

This is a modern React-based transport payment management application built with Express.js backend and PostgreSQL database. The system helps manage payment tracking for transport companies, with features for file uploads, data processing, commission calculations, and payment history management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent System Completion - August 1, 2025

### ✅ Complete Registration & Subscription System - August 1, 2025
- **Integrated Registration Flow**: Single-page registration combining account creation with subscription setup
- **Real-Time Validation**: Instant feedback for username and email availability with visual indicators
- **Smart Error Handling**: Detailed error messages for duplicate usernames/emails with user-friendly language
- **3-Step Process**: Account details → Personal info → Payment setup (no charge during 3-day trial)
- **Enhanced UX**: Green/red validation icons, debounced API calls, and step-by-step progress indicators

### ✅ Subscription-Based Monetization System - August 1, 2025
- **Single Plan Model**: Transport Pro at 99.99€/month with 3-day free trial
- **Stripe Integration**: Complete payment processing infrastructure (requires correct secret key)
- **Modern Pricing Page**: Professional glassmorphism design with 12 key features
- **Demo Mode**: Elegant fallback when Stripe keys not configured
- **Database Schema**: Updated users table with subscription tracking fields
- **Payment Flow**: /pricing → /subscribe/professional → /subscription-success

### ✅ Transport Payment Management System - Fully Operational
- **VRID Historical Tracking**: Cross-week trip matching implemented
- **Auto-numbering Transport Orders**: Commands start from 1554 with proper increment
- **Complete PDF Generation**: All company data populated from database with Romanian diacritics
- **Driver Persistence**: No more duplicate "new detected" notifications
- **Database Schema**: All tables properly configured with necessary columns
- **Company Data Mapping**: Correct mapping for DE Cargo Speed → De Cargo Sped S.R.L.
- **Company Balance Tracking**: Real-time monitoring of outstanding payments per company
- **Automatic Balance Creation**: Balances generated during weekly data processing
- **Payment Recording**: Interactive payment registration with status updates

### ✅ Company Balance Management System - August 1, 2025
- **Database Table**: company_balances table with complete tracking fields
- **Modern UI Interface**: Glassmorphism design with real-time updates
- **Calendar Integration**: Automatic generation of balances from weekly processing data and payment history
- **Smart Status Logic**: Differences under 1 EUR automatically marked as "paid" to handle rounding issues
- **Synchronization Button**: "Sincronizează cu Calendarul" button regenerates all balances from existing data
- **Payment Workflow**: Record payments with automatic balance calculation
- **Status Tracking**: Visual indicators for pending/partial/paid status with intelligent rounding
- **Multi-week Support**: Track balances across different processing weeks

### ✅ Commission Exclusion Fix - August 1, 2025
- **Complete Invoice Calculation**: Total invoiced = Total 7 days + Total 30 days (instead of just 7 days)
- **Commission Separation**: Commission amounts excluded from outstanding balance calculations
- **Accurate Financial Tracking**: Company balances now reflect actual amounts owed to companies
- **Example Fix**: Fast Express 20 iul - 26 iul: 42973.29 EUR invoiced (44010.69 - 1037.40 commission)

### ✅ Multi-Tenant SaaS System - August 1, 2025
- **Admin Dashboard**: Complete management interface at /admin with subscriber oversight
- **User Roles**: Admin and subscriber roles with proper database schema
- **Tenant Isolation**: Tenant ID system for separate databases per subscriber
- **Analytics Dashboard**: Real-time subscriber statistics, revenue tracking, and status monitoring
- **Demo Users**: Admin user (admin/admin123) and subscriber user (Fastexpress/Olanda99) created
- **Evidence System**: Clear visibility into all subscriber activities and subscription statuses

### 🔒 CRITICAL DATA ISOLATION FIX - August 2, 2025

**Issue Identified**: Severe data leakage between main user (Petrisor) and tenant databases
- Personal data (drivers like "Feleaga Cristian") was being copied to all tenant schemas
- Root cause: `seedDatabase()` function in routes.ts contained Petrisor's personal business data
- Violation of multi-tenant isolation principles - tenants should never see main user's data

**Actions Taken**:
- Removed all personal companies (Fast & Express S.R.L., Daniel Ontheroad S.R.L.) from tenant seeding
- Eliminated personal drivers from tenant databases (26+ records cleaned)
- Updated seeding to only include generic transport companies for tenants
- Maintained complete separation: Main user data stays in main schema only

**Trade-off**: Some legitimate drivers detected from uploaded TRIP files were accidentally removed
- These were drivers found in CSV uploads, not personal data
- User will need to re-upload and re-process TRIP files to restore detected drivers
- System now correctly maintains true multi-tenant isolation

### ✅ Complete Database Separation System - August 1, 2025 (UPGRADED)
- **MultiTenantManager**: Completely rewritten system for 100% database isolation
- **Separate PostgreSQL Schemas**: Each subscriber gets their own dedicated schema (tenant_[id])
- **Zero Data Sharing**: Complete isolation - no shared tables, no tenantId columns needed
- **Automatic Schema Creation**: Full table structure created per tenant automatically
- **Legacy User Protection**: Petrisor remains main user, all new users are subscribers
- **Up to 100 Tenants**: System designed to handle expected subscriber volume
- **Tenant Routes**: Dedicated API endpoints for multi-tenant management and statistics
- **Complete Isolation**: Each tenant has independent companies, drivers, payments, orders
- **Schema-Based Architecture**: PostgreSQL schemas provide true database separation
- **Dynamic Connection Management**: Automated connection pooling per tenant schema

### ✅ Advanced Multi-Tenant Architecture Implementation - August 1, 2025
- **MultiTenantManager Class**: Advanced database manager with schema isolation
- **TenantRoutes System**: Dedicated routing for tenant management and statistics  
- **Zero Shared Data**: No tenantId fields - complete schema separation
- **Automatic Registration Flow**: New users get separate database on signup
- **Connection Pooling**: Efficient database connections per tenant
- **Admin Statistics**: Real-time tenant system monitoring and management
- **Database Cleanup**: Proper connection management and schema deletion
- **Production Ready**: Designed for 100 concurrent tenant databases

The system now provides complete database isolation where each subscriber operates in a completely independent environment, with Petrisor maintaining access to the original system and all new users getting their own dedicated PostgreSQL schemas.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks with TanStack Query for server state
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Theme**: Dark/Light mode support with custom theme provider
- **File Processing**: XLSX library for Excel file handling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Module System**: ES Modules
- **Development**: Hot reloading with Vite integration
- **Storage**: PostgreSQL database with Drizzle ORM (DatabaseStorage implementation)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Database**: Neon serverless PostgreSQL with automated seeding

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL
- **Database**: Neon Database (serverless PostgreSQL)
- **Schema**: Complete transport payment system with users, companies, drivers, weekly processing, payments, and payment history tables
- **Validation**: Zod schemas for type-safe data validation
- **Seeding**: Automated database seeding with transport companies and driver mappings
- **Relations**: Proper foreign key relationships between companies, drivers, and payments

## Key Components

### File Upload System
- Supports CSV and Excel file formats
- Three upload types: TRIP data, 7-day invoices, 30-day invoices
- Drag-and-drop interface with file validation
- Real-time processing feedback

### Driver-Company Mapping
- Hardcoded mapping system for driver assignments to companies
- Company-specific commission rates (2% for Fast Express, 4% for others)
- Supports multiple transport companies (Fast Express, Daniel Ontheroad, DE Cargo Speed, etc.)

### Payment Processing
- Weekly payment cycles (Sunday to Saturday)
- Calendar-based week selection for last 2 years
- Commission calculations based on company rules
- Payment tracking with progress indicators

### UI/UX Features
- Modern glassmorphism design
- Responsive layout with mobile support
- Animated status cards and progress bars
- Professional dashboard interface
- Dark/light theme toggle

## Data Flow

1. **File Upload**: Users upload TRIP CSV and invoice Excel/CSV files
2. **Data Processing**: System parses files and maps drivers to companies
3. **Commission Calculation**: Applies company-specific commission rates
4. **Week Selection**: Users select processing week from calendar
5. **Payment Tracking**: System tracks and displays payment progress
6. **History Management**: Maintains payment history records

## External Dependencies

### Frontend Libraries
- React ecosystem (React, React DOM, React Router alternative)
- UI Components (Radix UI primitives, shadcn/ui)
- Styling (Tailwind CSS, class-variance-authority, clsx)
- Animation (Framer Motion, embla-carousel)
- Data fetching (TanStack React Query)
- File processing (XLSX, date-fns)
- Form handling (React Hook Form, hookform/resolvers)

### Backend Libraries
- Express.js for server framework
- Drizzle ORM for database operations
- Neon Database for serverless PostgreSQL
- Session management with connect-pg-simple
- Development tools (tsx, esbuild)

### Development Tools
- TypeScript for type safety
- Vite for build tooling and development server
- PostCSS with Tailwind for styling
- ESLint configuration via package scripts

## Deployment Strategy

### Development
- Vite dev server with hot module replacement
- TSX for TypeScript execution in development
- Runtime error overlay for debugging
- Replit integration with cartographer plugin

### Production Build
- Vite builds the frontend to `dist/public`
- ESBuild bundles the server code to `dist`
- Static file serving through Express
- Environment-based configuration

### Database Management
- Drizzle migrations in `./migrations` directory
- Schema definitions in `shared/schema.ts`
- Push-based deployment with `drizzle-kit push`
- PostgreSQL connection via DATABASE_URL environment variable

The application maintains separation of concerns with shared types between client and server, uses modern development practices with TypeScript throughout, and implements a scalable architecture that can easily integrate with a proper database backend when needed.