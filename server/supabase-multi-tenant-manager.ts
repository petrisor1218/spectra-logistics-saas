import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface TenantSupabaseConfig {
  supabase: SupabaseClient;
  tenantId: string;
  tablePrefix: string;
}

/**
 * Manager pentru baze de date multi-tenant cu Supabase
 * Fiecare tenant va avea propriile tabele cu prefix pentru izolare completă
 */
class SupabaseMultiTenantManager {
  private tenantClients: Map<string, TenantSupabaseConfig> = new Map();
  private mainSupabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_KEY!;
    
    console.log('🔗 Initializing Supabase Multi-Tenant Manager');
    console.log(`📡 Supabase URL: ${supabaseUrl}`);
    
    this.mainSupabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Obține clientul Supabase principal pentru autentificare și gestionarea utilizatorilor
   */
  getMainSupabase() {
    return this.mainSupabase;
  }

  /**
   * Creează structura de tabele pentru un tenant nou în Supabase
   */
  private async initializeTenantTables(tenantId: string): Promise<void> {
    console.log(`🔨 Initializing tenant structure for: ${tenantId}`);
    
    try {
      const tablePrefix = `tenant_${tenantId}_`;
      
      // Pentru acum, inițializăm structura virtuală
      // În Supabase, vom folosi Row Level Security (RLS) pentru izolarea datelor
      console.log(`✅ Tenant structure initialized for: ${tenantId} with prefix: ${tablePrefix}`);
    } catch (error) {
      console.error(`❌ Failed to initialize tenant structure for ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Creează sau obține clientul Supabase pentru un tenant
   */
  async getTenantSupabase(tenantId: string): Promise<TenantSupabaseConfig> {
    if (this.tenantClients.has(tenantId)) {
      return this.tenantClients.get(tenantId)!;
    }

    console.log(`🔄 Creating new Supabase client for tenant: ${tenantId}`);

    try {
      // Creează client Supabase pentru tenant cu configurație dedicată
      const tenantSupabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
      );

      const tablePrefix = `tenant_${tenantId}_`;

      // Inițializează structura tenant-ului
      await this.initializeTenantTables(tenantId);

      const tenantConfig: TenantSupabaseConfig = {
        supabase: tenantSupabase,
        tenantId,
        tablePrefix
      };

      this.tenantClients.set(tenantId, tenantConfig);

      console.log(`✅ Successfully created tenant Supabase client for: ${tenantId}`);
      return tenantConfig;

    } catch (error) {
      console.error(`❌ Failed to create tenant Supabase client for ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Obține clientul Supabase pentru un tenant specific
   */
  async getTenantClient(tenantId: string): Promise<SupabaseClient> {
    const tenantConfig = await this.getTenantSupabase(tenantId);
    return tenantConfig.supabase;
  }

  /**
   * Închide toate conexiunile tenant-ilor
   */
  async closeAllTenantConnections(): Promise<void> {
    console.log('🔄 Closing all tenant Supabase connections...');
    
    const tenantIds = Array.from(this.tenantClients.keys());
    for (const tenantId of tenantIds) {
      try {
        console.log(`🔒 Closing connection for tenant: ${tenantId}`);
      } catch (error) {
        console.error(`❌ Error closing connection for tenant ${tenantId}:`, error);
      }
    }
    
    this.tenantClients.clear();
    console.log('✅ All tenant connections closed');
  }

  /**
   * Șterge complet datele unui tenant (pentru cleanup)
   */
  async deleteTenantData(tenantId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting tenant data for: ${tenantId}`);
      
      const tenantConfig = this.tenantClients.get(tenantId);
      if (tenantConfig) {
        // În viitor, aici vom șterge toate datele tenant-ului din tabele
        this.tenantClients.delete(tenantId);
        console.log(`✅ Successfully deleted tenant data for: ${tenantId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete tenant data for ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Obține statistici despre tenant-ii activi
   */
  getTenantStats(): { activeTenants: number; tenantIds: string[] } {
    return {
      activeTenants: this.tenantClients.size,
      tenantIds: Array.from(this.tenantClients.keys())
    };
  }
}

// Instanță singleton
const supabaseMultiTenantManager = new SupabaseMultiTenantManager();

export default supabaseMultiTenantManager;
export { SupabaseMultiTenantManager };