import type { Express } from "express";
import { multiTenantManager } from './multi-tenant-manager.js';
import { companies, drivers } from "@shared/schema";
import { storage } from "./storage";

/**
 * Middleware pentru verificarea accesului tenant
 */
export function requireTenantAccess(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Obține baza de date pentru utilizatorul curent (tenant sau principal)
 */
export async function getUserDatabase(userId: number) {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Pentru utilizatorii cu tenantId, folosește baza de date separată
  if (user.tenantId) {
    const tenantDb = await multiTenantManager.getTenantDatabase(user.tenantId);
    return { db: tenantDb, user, isTenant: true };
  }

  // Pentru utilizatorii legacy (precum Petrisor), folosește baza principală
  return { db: storage, user, isTenant: false };
}

/**
 * Înregistrează rutele pentru funcționalitatea multi-tenant
 */
export function registerTenantRoutes(app: Express) {
  
  // Rută pentru informații despre tenant
  app.get('/api/tenant/info', requireTenantAccess, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const tenantInfo: any = {
        tenantId: user.tenantId,
        hasSeparateDatabase: !!user.tenantId,
        isMainUser: user.username === 'petrisor' || user.email === 'petrisor@fastexpress.ro',
        username: user.username,
        role: user.role
      };

      // Dacă utilizatorul are tenant, obține statistici
      if (user.tenantId) {
        const stats = multiTenantManager.getSystemStats();
        tenantInfo.systemStats = {
          totalTenants: stats.totalTenants,
          maxTenants: stats.maxTenants,
          tenantPosition: stats.tenantIds.indexOf(user.tenantId) + 1
        };
      }

      res.json(tenantInfo);
    } catch (error) {
      console.error('Error getting tenant info:', error);
      res.status(500).json({ error: 'Failed to get tenant information' });
    }
  });

  // Rută pentru statistici sistemului multi-tenant (admin only)
  app.get('/api/admin/tenant-stats', requireTenantAccess, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const stats = multiTenantManager.getSystemStats();
      const databasesInfo = multiTenantManager.getTenantDatabasesInfo();

      res.json({
        ...stats,
        databases: databasesInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting tenant stats:', error);
      res.status(500).json({ error: 'Failed to get tenant statistics' });
    }
  });

  // Rută pentru ștergerea unui tenant (admin only)
  app.delete('/api/admin/tenant/:tenantId', requireTenantAccess, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { tenantId } = req.params;
      
      // Verifică dacă tenant-ul există
      if (!multiTenantManager.hasTenantDatabase(tenantId)) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Șterge baza de date a tenant-ului
      await multiTenantManager.deleteTenantDatabase(tenantId);

      // Opțional: Șterge și utilizatorul din baza principală
      // await storage.deleteUserByTenantId(tenantId);

      res.json({ 
        message: `Tenant ${tenantId} deleted successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      res.status(500).json({ error: 'Failed to delete tenant' });
    }
  });

  console.log('✅ Tenant routes registered successfully');
}

/**
 * Helper pentru accesarea datelor cu izolare tenant
 */
export async function getTenantData<T>(userId: number, queryFn: (db: any) => Promise<T>): Promise<T> {
  const { db, user, isTenant } = await getUserDatabase(userId);
  
  if (isTenant) {
    // Pentru tenant, execută query pe baza de date separată
    console.log(`🔒 Tenant ${user.tenantId}: Accessing separate database`);
    return await queryFn(db);
  } else {
    // Pentru utilizatori legacy, folosește storage-ul principal
    console.log(`👑 Legacy user ${user.username}: Accessing main database`);
    return await queryFn(db);
  }
}