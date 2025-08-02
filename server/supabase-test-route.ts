import type { Express } from "express";
import supabaseMultiTenantManager from "./supabase-multi-tenant-manager.js";
import { supabaseTenantManager } from "./supabase-tenant-manager.js";

/**
 * Rute de test pentru sistemul Supabase multi-tenant
 */
export function registerSupabaseTestRoutes(app: Express) {
  
  // Test conectivitate Supabase
  app.get("/api/supabase/test", async (req, res) => {
    try {
      console.log('🧪 Testing Supabase multi-tenant system...');
      
      const mainSupabase = supabaseMultiTenantManager.getMainSupabase();
      
      // Test basic connection
      const { data, error } = await mainSupabase
        .from('users')
        .select('*')
        .limit(1);
      
      const result = {
        status: 'success',
        connection: 'working',
        supabaseUrl: process.env.SUPABASE_URL,
        error: error?.message || null,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Supabase test completed');
      res.json(result);
      
    } catch (error) {
      console.error('❌ Supabase test failed:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test crearea unui tenant Supabase
  app.post("/api/supabase/test-tenant", async (req, res) => {
    try {
      const { tenantId } = req.body;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId required' });
      }
      
      console.log(`🧪 Testing tenant creation: ${tenantId}`);
      
      // Creează tenant storage
      const tenantStorage = await supabaseTenantManager.getTenantStorage(tenantId);
      
      // Test stats
      const stats = await tenantStorage.getTenantStats();
      
      const result = {
        status: 'success',
        tenantId,
        stats,
        message: `Tenant ${tenantId} created successfully in Supabase`,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Tenant ${tenantId} test completed`);
      res.json(result);
      
    } catch (error) {
      console.error('❌ Tenant test failed:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Statistici tenant-i Supabase
  app.get("/api/supabase/stats", async (req, res) => {
    try {
      const managerStats = supabaseTenantManager.getTenantStats();
      const supabaseStats = supabaseMultiTenantManager.getTenantStats();
      
      const result = {
        status: 'success',
        supabase: supabaseStats,
        manager: managerStats,
        timestamp: new Date().toISOString()
      };
      
      res.json(result);
      
    } catch (error) {
      console.error('❌ Stats failed:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('✅ Supabase test routes registered');
}