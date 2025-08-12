# Transport Payment Management System

## Overview

This React-based transport payment management application, with an Express.js backend and PostgreSQL database, is designed to manage payment tracking for transport companies. Its core purpose is to streamline payment processes through features like file uploads, automated data processing, commission calculations, and comprehensive payment history management. The system aims to provide complete financial oversight and efficient administration for transport businesses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks with TanStack Query
- **Animations**: Framer Motion
- **Theme**: Dark/Light mode support
- **File Processing**: XLSX library for Excel file handling
- **UI/UX Decisions**: Modern glassmorphism design, responsive layout, animated status cards, professional dashboard interface.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Module System**: ES Modules
- **Development**: Hot reloading with Vite integration
- **Storage**: PostgreSQL database with Drizzle ORM
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Core Functionality**:
    - Multi-tenant system is explicitly *eliminated* for simplified single-tenant operation.
    - Automated processing after driver addition to resolve "Pending Mapping".
    - Company balance payment system with proper persistence and status updates (pending → partial → paid).
    - Email system for transport orders and reports.

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL
- **Database**: Neon Database (serverless PostgreSQL)
- **Schema**: Comprehensive schema covering users, companies, drivers, weekly processing data, payments, and payment history.
- **Validation**: Zod schemas for type-safe data validation.
- **Seeding**: Automated database seeding.
- **Relations**: Proper foreign key relationships.

### Key Features and System Design
- **File Upload System**: Supports CSV and Excel for trip data, 7-day, and 30-day invoices with drag-and-drop.
- **Driver-Company Mapping**: Manages driver assignments to companies with company-specific commission rates (e.g., 2% for Fast Express, 4% for others).
- **Payment Processing**: Weekly cycles (Sunday-Saturday), calendar-based week selection, commission calculations, and payment tracking.
- **Company Balance Management**: Tracks outstanding payments per company, automatic balance creation during weekly processing, interactive payment recording with status updates, and multi-week support.
- **Commission Exclusion**: Commissions are accurately excluded from outstanding balance calculations.
- **SaaS Monetization**: Single plan model with Stripe integration, modern pricing page, and subscription tracking.
- **Admin Dashboard**: Management interface for subscriber oversight, user roles, and analytics.

## External Dependencies

### Frontend Libraries
- React ecosystem (React, React DOM)
- UI Components (Radix UI primitives, shadcn/ui)
- Styling (Tailwind CSS)
- Animation (Framer Motion, embla-carousel)
- Data fetching (TanStack React Query)
- File processing (XLSX, date-fns)
- Form handling (React Hook Form, hookform/resolvers)

### Backend Libraries
- Express.js
- Drizzle ORM
- Neon Database (PostgreSQL)
- Connect-pg-simple (for session management)

### Services/APIs
- Brevo SMTP Service (for email delivery)
- Stripe (for payment processing and subscriptions)

## Recent System Corrections and Updates

### ✅ Company Data Unification - FULLY RESOLVED - August 11, 2025
- **Issue**: Duplicate company entries "Stef Trans" and "Stef Trans S.R.L." causing data fragmentation
- **Solution**: Complete data migration and unification under "Stef Trans S.R.L." as official company name
- **Actions Taken**:
  - Migrated 28 payment records from "Stef Trans" to "Stef Trans S.R.L."
  - Migrated 1 company balance record to unified name
  - Updated 1 weekly processing JSON data structure
  - Updated static code mappings in useTransportData.tsx
- **Result**: All Stef Trans data now unified under single official company name "Stef Trans S.R.L."
- **Data Verification**: 59 total payments, 29 company balances, €404,532.75 total payments processed

### ✅ Enhanced Driver Matching & Invoice Validation - COMPLETED - August 11, 2025
- **Issue**: New drivers not automatically recognized, need for comprehensive invoice validation
- **Solution**: Advanced name matching system and detailed totals verification
- **Actions Taken**:
  - Enhanced generateNameVariants function for better driver name matching (139 → 257 variants)
  - Implemented automatic reprocessing after adding new drivers
  - Added comprehensive invoice total validation with detailed breakdowns
  - Created alert system for discrepancies between invoice totals and processed amounts
  - Added debugging data storage for advanced troubleshooting
- **Features**: 
  - Automatic detection when invoice totals don't match processed sums
  - Detailed alerts showing differences for 7-day and 30-day invoices separately
  - Practical recommendations for resolving discrepancies
  - Complete elimination of "Unmatched" categories through improved matching

### ✅ Data Protection System Implementation - COMPLETED - August 12, 2025
- **Issue**: Risk of accidental data corruption when handling year transitions
- **Solution**: Comprehensive data protection system with strict validation
- **Actions Taken**:
  - Implemented DataProtectionSystem class with validation rules
  - Created whitelist of exactly 6 valid 2025 weeks to prevent future errors
  - Added automatic integrity checks and corruption prevention
  - Updated frontend logic to use protected week validation
- **Protection Features**:
  - Prevents accidental bulk year changes
  - Validates all week label modifications against approved list
  - Automatic database integrity verification
  - Clear error logging for attempted invalid changes
- **Valid 2025 Weeks**: 4 January weeks + 1 cross-year + 1 specific February week only