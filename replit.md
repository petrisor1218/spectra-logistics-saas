# Transport Payment Management System

## Overview

This is a modern React-based transport payment management application built with Express.js backend and PostgreSQL database. The system helps manage payment tracking for transport companies, with features for file uploads, data processing, commission calculations, and payment history management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent System Completion - July 31, 2025

### ✅ Transport Payment Management System - Fully Operational
- **VRID Historical Tracking**: Cross-week trip matching implemented
- **Auto-numbering Transport Orders**: Commands start from 1554 with proper increment
- **Complete PDF Generation**: All company data populated from database with Romanian diacritics
- **Driver Persistence**: No more duplicate "new detected" notifications
- **Database Schema**: All tables properly configured with necessary columns
- **Company Data Mapping**: Correct mapping for DE Cargo Speed → De Cargo Sped S.R.L.

The system now handles complete transport payment workflows from file processing to PDF generation without manual intervention.

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