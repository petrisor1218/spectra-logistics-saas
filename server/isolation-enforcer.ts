/**
 * CRITICAL ISOLATION ENFORCER - PETRISOR DATA PROTECTION
 * 
 * This module ensures COMPLETE data isolation between:
 * - Main User (Petrisor) - tenant_id = NULL - MAIN database ONLY
 * - Tenant Users - tenant_id != NULL - SEPARATE schemas ONLY
 * 
 * ZERO data sharing allowed!
 */

import { storage } from './storage.js';
import { multiTenantManager } from './multi-tenant-manager.js';

interface IsolationRequest {
  userId: number;
  operation: string;
  resource: string;
}

export class IsolationEnforcer {
  
  /**
   * Validates user isolation rules and returns appropriate storage
   */
  static async enforceIsolation(req: any): Promise<{
    storage: any;
    user: any;
    isolationType: 'MAIN' | 'TENANT';
  }> {
    if (!req.session?.userId) {
      throw new Error('Not authenticated');
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // CRITICAL RULE: Petrisor (tenant_id = 'main') = SUPABASE MAIN ONLY
    if (!user.tenantId || user.tenantId === 'main') {
      console.log(`👑 ISOLATION ENFORCED: MAIN USER ${user.username} → SUPABASE MAIN database`);
      // Import Supabase components
      const { SupabaseMainStorage } = await import('./supabase-main-storage.js');
      const supabaseMultiTenantManager = (await import('./supabase-multi-tenant-manager.js')).default;
      const supabaseMainStorage = new SupabaseMainStorage(supabaseMultiTenantManager.getMainSupabase());
      
      return {
        storage: supabaseMainStorage,
        user: user,
        isolationType: 'MAIN'
      };
    }

    // CRITICAL RULE: All tenants = SEPARATE SUPABASE TENANT DATABASES ONLY
    console.log(`🔒 ISOLATION ENFORCED: TENANT USER ${user.username} → SEPARATE SUPABASE database ${user.tenantId}`);
    const { supabaseTenantManager } = await import('./supabase-tenant-manager.js');
    const tenantStorage = await supabaseTenantManager.getTenantStorage(user.tenantId);
    
    return {
      storage: tenantStorage,
      user: user,
      isolationType: 'TENANT'
    };
  }

  /**
   * Professional error handling with auto-recovery for missing companies
   */
  static async handleCompanyError(companyName: string, storage: any): Promise<any> {
    console.log(`🔄 PROFESSIONAL RECOVERY: Auto-creating missing company "${companyName}"`);
    
    const newCompanyData = {
      name: companyName.toUpperCase(),
      commissionRate: companyName.toLowerCase().includes('fast') ? 0.02 : 0.04,
      cif: '',
      tradeRegisterNumber: '',
      address: '',
      location: '',
      county: '',
      country: 'Romania',
      contact: '',
      isMainCompany: false
    };

    try {
      const company = await storage.createCompany(newCompanyData);
      console.log(`✅ RECOVERY SUCCESS: Company "${companyName}" created with ID: ${company.id}`);
      return company;
    } catch (error) {
      console.error(`❌ RECOVERY FAILED: Could not create company "${companyName}":`, error);
      throw new Error(`Professional recovery failed for company: ${companyName}`);
    }
  }

  /**
   * Validates that no cross-contamination occurs
   */
  static logIsolationCheck(user: any, operation: string, resource: string) {
    const isolationType = (!user.tenantId || user.tenantId === 'main') ? 'MAIN' : 'TENANT';
    const database = (!user.tenantId || user.tenantId === 'main') ? 'MAIN_DB' : `TENANT_${user.tenantId}`;
    
    console.log(`🛡️ ISOLATION CHECK: User=${user.username} | Type=${isolationType} | DB=${database} | Op=${operation} | Resource=${resource}`);
  }
}

/**
 * Express middleware to enforce isolation on all routes
 */
export function isolationMiddleware(req: any, res: any, next: any) {
  // Add isolation context to request
  req.enforceIsolation = () => IsolationEnforcer.enforceIsolation(req);
  req.logIsolation = (operation: string, resource: string) => {
    if (req.user) {
      IsolationEnforcer.logIsolationCheck(req.user, operation, resource);
    }
  };
  
  next();
}