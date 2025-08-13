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
    - Single-tenant operation (multi-tenant system explicitly eliminated).
    - Automated processing for "Pending Mapping" resolution after driver addition.
    - Company balance payment system with persistence and status updates (pending → partial → paid).
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
- **Driver-Company Mapping**: Manages driver assignments to companies with company-specific commission rates.
- **Payment Processing**: Weekly cycles (Sunday-Saturday), calendar-based week selection, commission calculations, and payment tracking.
- **Company Balance Management**: Tracks outstanding payments per company, automatic balance creation during weekly processing, interactive payment recording with status updates, and multi-week support. Commissions are accurately excluded from outstanding balance calculations.
- **Driver Activity Tracking**: Comprehensive monthly analysis of driver work time vs home time with detailed analytics dashboard, including activity rate percentage calculation and visualization.
- **SaaS Monetization**: Single plan model with Stripe integration, modern pricing page, and subscription tracking.
- **Admin Dashboard**: Management interface for subscriber oversight, user roles, and analytics.
- **Data Protection System**: Strict validation and integrity checks, including whitelisting valid weeks and year-end closure with data sealing and fiscal year separation to prevent cross-year data mixing.
- **Amazon Placeholder Tracking**: Automated system to track and match small amount placeholder invoices (e.g., €0.01) with subsequent real amounts.

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