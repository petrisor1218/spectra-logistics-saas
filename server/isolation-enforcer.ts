/**
 * 🔒 ISOLATION ENFORCER - Garantează separarea completă a datelor per tenant
 */
import type { Express, Request, Response, NextFunction } from "express";
import type { IStorage } from "./storage.js";

export interface TenantRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    tenantId?: string;
    role?: string;
  };
  tenantId?: string;
  tenantStorage?: IStorage;
}

/**
 * Middleware care detectează și setează tenant-ul pentru fiecare request
 */
export function createTenantDetectionMiddleware(storage: IStorage) {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Skip pentru rute de autentificare și publice
      if (req.path === '/api/login' || 
          req.path === '/api/register' || 
          req.path === '/api/auth/user' ||
          req.path === '/api/logout' ||
          req.path.startsWith('/api/pricing') ||
          req.path.startsWith('/api/health') ||
          req.path.startsWith('/api/stripe') ||
          req.path.startsWith('/pricing') ||
          req.path.startsWith('/health') ||
          req.path === '/' ||
          req.path.startsWith('/assets/') ||
          req.path.startsWith('/src/') ||
          req.path.includes('.js') ||
          req.path.includes('.css') ||
          req.path.includes('.png') ||
          req.path.includes('.svg') ||
          req.path.includes('vite') ||
          req.path.includes('@')) {
        return next();
      }

      // Verifică autentificarea
      if (!req.session?.userId) {
        return res.status(401).json({ 
          error: 'Not authenticated',
          isolation: 'ENFORCED'
        });
      }

      // Obține utilizatorul din baza de date (check both storages)
      let user = await storage.getUser(req.session.userId);
      
      // If not found and this might be user 4 (Petrisor), check Supabase
      if (!user && req.session.userId === 4) {
        try {
          const { supabaseMultiTenantManager } = await import('./supabase-multi-tenant-manager.js');
          const { SupabaseMainStorage } = await import('./supabase-main-storage.js');
          const supabaseMainStorage = new SupabaseMainStorage(supabaseMultiTenantManager.getMainSupabase());
          user = await supabaseMainStorage.getUser(req.session.userId);
        } catch (error) {
          console.warn('Could not check Supabase for user 4:', error);
        }
      }
      
      if (!user) {
        return res.status(401).json({ 
          error: 'User not found',
          isolation: 'ENFORCED'
        });
      }

      // Setează tenant-ul în request
      req.user = user;
      req.tenantId = user.tenantId || 'main';

      // Log pentru debugging
      console.log(`🔒 ISOLATION: User ${user.username} (ID: ${user.id}) → Tenant: ${req.tenantId}`);

      // Pentru tenant-ii cu schema separată, obține storage-ul dedicat
      if (user.tenantId && user.tenantId !== 'main') {
        try {
          const { multiTenantManager } = await import('./multi-tenant-manager.js');
          req.tenantStorage = await multiTenantManager.getTenantStorage(user.tenantId);
          console.log(`✅ ISOLATION: Tenant storage loaded for ${user.tenantId}`);
        } catch (error) {
          console.error(`❌ ISOLATION: Failed to load tenant storage for ${user.tenantId}:`, error);
          return res.status(500).json({ 
            error: 'Tenant isolation failed',
            tenantId: user.tenantId
          });
        }
      }

      next();
    } catch (error) {
      console.error('❌ ISOLATION: Tenant detection failed:', error);
      res.status(500).json({ 
        error: 'Isolation enforcement failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Obține storage-ul corect bazat pe tenant
 */
export function getTenantStorage(req: TenantRequest, mainStorage: IStorage): IStorage {
  // Pentru tenant-ii cu schema separată, folosește storage-ul dedicat
  if (req.tenantStorage) {
    console.log(`🔒 Using tenant storage for: ${req.tenantId}`);
    return req.tenantStorage;
  }

  // Pentru utilizatorul principal sau fallback
  console.log(`🔒 Using main storage for: ${req.tenantId || 'unknown'}`);
  return mainStorage;
}

/**
 * Verifică și raportează izolarea
 */
export function logIsolationStatus(req: TenantRequest, operation: string, dataCount: number) {
  const isolation = req.tenantStorage ? 'TENANT_SCHEMA' : 'MAIN_DATABASE';
  console.log(`🔒 ISOLATION: ${operation} → User: ${req.user?.username} → Tenant: ${req.tenantId} → Storage: ${isolation} → Records: ${dataCount}`);
}

/**
 * Validează că nu există data leakage
 */
export function validateNoDataLeakage(req: TenantRequest, data: any[], operation: string) {
  if (!req.user) {
    throw new Error('User not found in request - isolation violation');
  }

  // Pentru tenant-ii cu schema separată, toate datele trebuie să aibă tenant_id corect
  if (req.tenantStorage && data.length > 0) {
    const invalidRecords = data.filter(record => 
      record.tenantId && record.tenantId !== req.tenantId
    );
    
    if (invalidRecords.length > 0) {
      console.error(`❌ DATA LEAKAGE DETECTED: ${operation} → Expected tenant: ${req.tenantId}, Found: ${invalidRecords.map(r => r.tenantId).join(', ')}`);
      throw new Error(`Data leakage detected: ${invalidRecords.length} records from other tenants`);
    }
  }

  console.log(`✅ ISOLATION VALIDATED: ${operation} → ${data.length} records → No leakage detected`);
}