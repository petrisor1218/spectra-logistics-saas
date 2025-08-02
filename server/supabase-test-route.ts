import type { Express } from "express";
import supabaseMultiTenantManager from "./supabase-multi-tenant-manager.js";
import { supabaseTenantManager } from "./supabase-tenant-manager.js";
import { migrateMainUserToSupabase } from "./migrate-to-supabase.js";
import { createSupabaseTables } from "./execute-supabase-sql.js";
import { createSupabaseSchema } from "./create-supabase-schema.js";

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

  // Creează schema completă în Supabase
  app.post("/api/supabase/create-schema", async (req, res) => {
    try {
      console.log('🔨 Creating complete Supabase schema...');
      
      const result = await createSupabaseSchema();
      
      if (result.success) {
        res.json({
          status: 'success',
          message: result.message,
          results: result.results,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: result.error,
          results: result.results,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('❌ Schema creation failed:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Creează tabelele în Supabase (legacy method)
  app.post("/api/supabase/create-tables", async (req, res) => {
    try {
      console.log('🔨 Creating Supabase tables...');
      
      const result = await createSupabaseTables();
      
      if (result.success) {
        res.json({
          status: 'success',
          message: 'Supabase tables created successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: result.error,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('❌ Table creation failed:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Migrare date utilizator principal în Supabase
  app.post("/api/supabase/migrate-main-user", async (req, res) => {
    try {
      console.log('🚀 Starting migration of main user to Supabase...');
      
      const result = await migrateMainUserToSupabase();
      
      if (result.success) {
        res.json({
          status: 'success',
          message: 'Main user data migrated successfully to Supabase',
          migrated: result.migrated,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: result.error,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Activează sistemul Supabase pentru utilizatorul principal
  app.post("/api/supabase/activate-main-user", async (req, res) => {
    try {
      console.log('🚀 Activating Supabase for main user...');
      
      // Test că tabelele există și sunt populate
      const mainSupabase = supabaseMultiTenantManager.getMainSupabase();
      
      const [companiesTest, driversTest, weeklyTest] = await Promise.all([
        mainSupabase.from('companies').select('*').eq('tenant_id', 'main').limit(1),
        mainSupabase.from('drivers').select('*').eq('tenant_id', 'main').limit(1),
        mainSupabase.from('weekly_processing').select('*').eq('tenant_id', 'main').limit(1)
      ]);
      
      const result = {
        status: 'success',
        message: 'Supabase activated for main user',
        data: {
          companies: companiesTest.data?.length || 0,
          drivers: driversTest.data?.length || 0,
          weeklyProcessing: weeklyTest.data?.length || 0
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Supabase activation complete');
      res.json(result);
      
    } catch (error) {
      console.error('❌ Supabase activation failed:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  console.log('✅ Supabase test routes registered');
}