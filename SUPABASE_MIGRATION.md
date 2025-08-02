# Supabase Migration Guide

## Overview
This guide explains how to migrate the Transport Pro application from PostgreSQL to Supabase for complete multi-tenant isolation.

## Migration Steps

### 1. Create Tables in Supabase Dashboard
1. Go to your Supabase project: https://ucjhuwooyetfhvgddxzk.supabase.co
2. Navigate to SQL Editor
3. Copy and execute the contents of `server/create-supabase-tables.sql`

### 2. Migrate Main User Data
Execute the migration API to transfer Petrisor's data:
```bash
curl -X POST http://localhost:5000/api/supabase/migrate-main-user
```

### 3. Update Storage Configuration
The system is ready to switch from DatabaseStorage to SupabaseMainStorage for the main user.

## Benefits of Supabase Migration

### Complete Data Isolation
- **Main User**: Uses main Supabase database with `tenant_id = 'main'`
- **Subscribers**: Each gets separate database with `tenant_id = 'unique_id'`
- **Zero Cross-Access**: No shared data between main user and subscribers

### Scalability
- **Cloud Native**: Supabase handles scaling automatically
- **Performance**: Built-in connection pooling and optimization
- **Reliability**: Managed database service with backups

### Multi-Tenant Architecture
- **SupabaseMainStorage**: For main user (Petrisor)
- **SupabaseStorage**: For tenant users with prefix isolation
- **SupabaseTenantManager**: Manages multiple tenant connections

## Database Schema

### Tables Created
- `users` - User accounts and authentication
- `companies` - Transport companies
- `drivers` - Company drivers
- `weekly_processing` - Weekly payment processing
- `payments` - Payment records
- `company_balances` - Outstanding balances
- `transport_orders` - Transport order tracking
- `historical_trips` - Trip history
- `payment_history` - Payment history
- `order_sequences` - Order numbering

### Indexing
All tables include proper indexing on:
- `tenant_id` for isolation
- Foreign keys for relationships
- Common query fields for performance

## Migration Verification

### Test Endpoints
- `GET /api/supabase/test` - Test connectivity
- `POST /api/supabase/test-tenant` - Test tenant creation
- `GET /api/supabase/stats` - System statistics
- `POST /api/supabase/migrate-main-user` - Execute migration

### Data Validation
After migration, verify:
1. All companies migrated correctly
2. All drivers with proper company references
3. Weekly processing records intact
4. Payment history preserved
5. Company balances calculated correctly

## Post-Migration Steps

### 1. Update Application Configuration
Switch storage implementation to use Supabase for main user.

### 2. Test Application Functionality
- Login as main user (Petrisor)
- Verify all features work with Supabase data
- Test file uploads and processing
- Confirm payment tracking works

### 3. Deploy to Production
System is ready for Railway deployment with Supabase backend.

## Rollback Plan
If issues occur:
1. Original PostgreSQL data remains intact
2. Can revert to DatabaseStorage implementation
3. Supabase data can be cleared if needed

The migration provides a clean path to modern, scalable architecture while maintaining all existing functionality.