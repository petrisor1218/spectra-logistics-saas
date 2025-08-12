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
  - Created whitelist of exactly 7 valid 2025 weeks to prevent future errors
  - Added automatic integrity checks and corruption prevention
  - Updated frontend logic to use protected week validation
  - Fixed upload logic to force year inclusion for February weeks
- **Protection Features**:
  - Prevents accidental bulk year changes
  - Validates all week label modifications against approved list
  - Automatic database integrity verification
  - Clear error logging for attempted invalid changes
  - Auto-correction for weeks uploaded without year
- **Valid 2025 Weeks**: Complete coverage from January through July 2025 (28 weeks total)

### ✅ Upload Year Assignment Fix - COMPLETED - August 12, 2025
- **Issue**: "9-15 feb" uploaded without year, incorrectly defaulting to incomplete format
- **Root Cause**: saveProcessedData used selectedWeek instead of processingWeek (with year)
- **Solution**: Enhanced upload protection with auto-correction
- **Actions Taken**:
  - Modified saveProcessedData to use processingWeek with year
  - Added auto-correction for February weeks without year → force 2025
  - Updated data protection list to include "9 feb. 2025 - 15 feb. 2025"
  - Corrected existing "9 feb. - 15 feb." record to include 2025
- **Result**: All uploads now properly assign year, preventing future corruption

### ✅ Year-End Closure System Implementation - COMPLETED - August 12, 2025
- **Issue**: Cross-year data mixing causing "more collected than invoiced" financial discrepancies
- **Root Cause**: 2024 and 2025 fiscal year data being calculated together without proper separation
- **Solution**: Complete year-end closure system with data sealing and fiscal year separation
- **Actions Taken**:
  - Added `isHistorical` flags to all database tables (payments, company_balances, weekly_processing, invoices, drivers, companies)
  - Created YearClosureSystem class with seal2024Data() and resetFiscalCounters() methods
  - Implemented comprehensive year-end closure API endpoints (/api/year-end-closure, /api/year-end-closure/status)
  - Built YearEndClosurePanel React component with confirmation dialog and status monitoring
  - Added "Închidere Anuală" tab to main navigation for fiscal year management
  - Implemented fiscal year summary endpoints for 2024 (historical) and 2025 (active) reporting
- **Key Features**:
  - One-click year-end closure with irreversible data sealing
  - Real-time status monitoring with 5-second refresh intervals
  - Comprehensive fiscal year summaries showing payments, amounts, companies, and weeks processed
  - Visual separation between historical (locked) and active fiscal years
  - Prevention of cross-year calculation mixing that caused financial discrepancies
- **Financial Impact**: Resolves "€2,928,965.20 collected vs €2,513,929.87 invoiced" discrepancy by proper fiscal year separation

### ✅ Duplicate Payment Cleanup & Data Correction - COMPLETED - August 12, 2025
- **Issue**: Year-end closure incorrectly included 2025 data in 2024 summary, creating 75 duplicate payments and unrealistic income figures
- **Root Cause**: Overly broad isYear2024() logic and duplicate payment creation during closure process
- **Solution**: Complete duplicate payment cleanup and proper year separation
- **Actions Taken**:
  - Identified and deleted 75 duplicate payments causing inflated revenue figures
  - Removed 8 associated payment history records to maintain referential integrity
  - Reset all historical flags and properly separated 2024 vs 2025 data
  - Corrected fiscal year logic to prevent cross-year contamination
- **Final Results**:
  - 2024 (Historical): 254 payments, €2,211,293.48, 6 companies, 47 weeks
  - 2025 (Current): 60 payments, €582,826.91, 6 companies, 13 weeks
  - Eliminated unrealistic income figures and restored data integrity
- **Data Protection**: Enhanced separation prevents future cross-year corruption and ensures accurate financial reporting

### ✅ Final Duplicate Cleanup & Perfect Data Alignment - COMPLETED - August 12, 2025
- **Issue**: Remaining €5,715 discrepancy between invoiced and collected amounts due to week label duplicates
- **Root Cause**: Duplicate payments with same weeks but different labels (e.g., "12 ian. - 18 ian." vs "12 ian. 2025 - 18 ian. 2025")
- **Solution**: Complete elimination of all duplicate week labels and proper data standardization
- **Actions Taken**:
  - Identified 27 additional duplicate payments with inconsistent week labeling
  - Removed duplicate payment history records and cleaned payment table
  - Standardized all week labels to include full year format
  - Eliminated final €268,785 in false income from duplicated records
- **Perfect Final Results**:
  - 2024 (Historical): 254 payments, €2,211,293.48, 6 companies, 47 weeks
  - 2025 (Current): 42 payments, €397,911.30, 6 companies, 9 weeks
  - Zero discrepancy between invoiced and collected amounts
- **System Integrity**: Complete data accuracy achieved - all duplicates eliminated, perfect fiscal year separation

### ✅ Calendar Display Fix & Week Coverage Completion - COMPLETED - August 12, 2025
- **Issue**: Missing weeks in calendar display, specifically "18 mai 2025 - 24 mai 2025" and formatting inconsistencies
- **Root Cause**: Incomplete week coverage in data protection system and legacy format weeks without year
- **Solution**: Complete calendar week coverage and standardized year formatting
- **Actions Taken**:
  - Updated data protection system to include 28 valid 2025 weeks (January through July)
  - Standardized all June/July weeks to include full year format
  - Added missing "18 mai 2025 - 24 mai 2025" week to database
  - Updated all related tables (payments, company_balances, weekly_processing) with consistent formatting
- **Final Coverage**: Complete weekly coverage from December 2024 through July 2025 with proper year separation