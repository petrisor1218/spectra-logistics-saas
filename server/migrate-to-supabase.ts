/**
 * Script pentru migrarea datelor utilizatorului principal în Supabase
 * Mută toate datele lui Petrisor din PostgreSQL în Supabase pentru arhitectură uniformă
 */
import { storage } from './storage.js';
import supabaseMultiTenantManager from './supabase-multi-tenant-manager.js';

export async function migrateMainUserToSupabase() {
  console.log('🚀 Starting migration of main user data to Supabase...');
  
  try {
    const mainSupabase = supabaseMultiTenantManager.getMainSupabase();
    
    // 1. Migrez companiile
    console.log('📦 Migrating companies...');
    const companies = await storage.getAllCompanies();
    console.log(`Found ${companies.length} companies to migrate`);
    
    for (const company of companies) {
      try {
        const { data, error } = await mainSupabase
          .from('companies')
          .upsert({
            id: company.id,
            name: company.name,
            cif: company.cif,
            address: company.address,
            commission_rate: company.commissionRate,
            created_at: company.createdAt,
            tenant_id: 'main' // Utilizatorul principal
          });
        
        if (error) {
          console.error(`❌ Error migrating company ${company.name}:`, error);
        } else {
          console.log(`✅ Migrated company: ${company.name}`);
        }
      } catch (err) {
        console.error(`❌ Failed to migrate company ${company.name}:`, err);
      }
    }
    
    // 2. Migrez driverii
    console.log('🚛 Migrating drivers...');
    const drivers = await storage.getAllDrivers();
    console.log(`Found ${drivers.length} drivers to migrate`);
    
    for (const driver of drivers) {
      try {
        const { data, error } = await mainSupabase
          .from('drivers')
          .upsert({
            id: driver.id,
            name: driver.name,
            company_id: driver.companyId,
            vrid: driver.vrid,
            email: driver.email,
            created_at: driver.createdAt,
            tenant_id: 'main'
          });
        
        if (error) {
          console.error(`❌ Error migrating driver ${driver.name}:`, error);
        } else {
          console.log(`✅ Migrated driver: ${driver.name}`);
        }
      } catch (err) {
        console.error(`❌ Failed to migrate driver ${driver.name}:`, err);
      }
    }
    
    // 3. Migrez procesările săptămânale
    console.log('📅 Migrating weekly processing...');
    const weeklyProcessing = await storage.getAllWeeklyProcessing();
    console.log(`Found ${weeklyProcessing.length} weekly processing records to migrate`);
    
    for (const record of weeklyProcessing) {
      try {
        const { data, error } = await mainSupabase
          .from('weekly_processing')
          .upsert({
            id: record.id,
            week_label: record.weekLabel,
            processing_date: record.processingDate,
            total_amount: record.totalAmount,
            total_trips: record.totalTrips,
            status: record.status,
            created_at: record.createdAt,
            tenant_id: 'main'
          });
        
        if (error) {
          console.error(`❌ Error migrating weekly processing ${record.weekLabel}:`, error);
        } else {
          console.log(`✅ Migrated weekly processing: ${record.weekLabel}`);
        }
      } catch (err) {
        console.error(`❌ Failed to migrate weekly processing ${record.weekLabel}:`, err);
      }
    }
    
    // 4. Migrez plățile
    console.log('💰 Migrating payments...');
    const payments = await storage.getAllPayments();
    console.log(`Found ${payments.length} payments to migrate`);
    
    for (const payment of payments) {
      try {
        const { data, error } = await mainSupabase
          .from('payments')
          .upsert({
            id: payment.id,
            company_id: payment.companyId,
            week_label: payment.weekLabel,
            amount: payment.amount,
            commission: payment.commission,
            status: payment.status,
            created_at: payment.createdAt,
            tenant_id: 'main'
          });
        
        if (error) {
          console.error(`❌ Error migrating payment for week ${payment.weekLabel}:`, error);
        } else {
          console.log(`✅ Migrated payment for week: ${payment.weekLabel}`);
        }
      } catch (err) {
        console.error(`❌ Failed to migrate payment for week ${payment.weekLabel}:`, err);
      }
    }
    
    // 5. Migrez soldurile companiilor
    console.log('📊 Migrating company balances...');
    const balances = await storage.getCompanyBalances();
    console.log(`Found ${balances.length} company balances to migrate`);
    
    for (const balance of balances) {
      try {
        const { data, error } = await mainSupabase
          .from('company_balances')
          .upsert({
            id: balance.id,
            company_id: balance.companyId,
            week_label: balance.weekLabel,
            total_invoiced: balance.totalInvoiced,
            total_paid: balance.totalPaid,
            outstanding_balance: balance.outstandingBalance,
            status: balance.status,
            created_at: balance.createdAt,
            updated_at: balance.updatedAt,
            tenant_id: 'main'
          });
        
        if (error) {
          console.error(`❌ Error migrating balance for ${balance.weekLabel}:`, error);
        } else {
          console.log(`✅ Migrated balance for: ${balance.weekLabel}`);
        }
      } catch (err) {
        console.error(`❌ Failed to migrate balance for ${balance.weekLabel}:`, err);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Migration Summary:');
    console.log(`   - Companies: ${companies.length}`);
    console.log(`   - Drivers: ${drivers.length}`);
    console.log(`   - Weekly Processing: ${weeklyProcessing.length}`);
    console.log(`   - Payments: ${payments.length}`);
    console.log(`   - Company Balances: ${balances.length}`);
    
    return {
      success: true,
      migrated: {
        companies: companies.length,
        drivers: drivers.length,
        weeklyProcessing: weeklyProcessing.length,
        payments: payments.length,
        balances: balances.length
      }
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}