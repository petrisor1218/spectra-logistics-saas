import supabaseMultiTenantManager from './supabase-multi-tenant-manager.js';
import { SupabaseStorage } from './supabase-storage.js';

/**
 * Enhanced multi-tenant manager cu suport Supabase
 * Oferă izolare completă prin database-uri separate
 */
class SupabaseTenantManager {
  private tenantStorages: Map<string, SupabaseStorage> = new Map();

  /**
   * Obține storage-ul pentru un tenant folosind Supabase
   */
  async getTenantStorage(tenantId: string): Promise<SupabaseStorage> {
    // Verifică dacă storage-ul există deja în cache
    if (this.tenantStorages.has(tenantId)) {
      return this.tenantStorages.get(tenantId)!;
    }

    console.log(`🔄 Creating Supabase storage for tenant: ${tenantId}`);

    try {
      // Obține clientul Supabase pentru tenant
      const tenantClient = await supabaseMultiTenantManager.getTenantClient(tenantId);
      
      // Creează storage-ul Supabase pentru tenant
      const tenantStorage = new SupabaseStorage(tenantClient, tenantId);
      
      // Adaugă în cache
      this.tenantStorages.set(tenantId, tenantStorage);
      
      console.log(`✅ Supabase storage created for tenant: ${tenantId}`);
      return tenantStorage;
      
    } catch (error) {
      console.error(`❌ Failed to create Supabase storage for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Închide toate conexiunile tenant-ilor
   */
  async closeAllTenantConnections(): Promise<void> {
    console.log('🔄 Closing all Supabase tenant storages...');
    
    // Închide storage-urile
    this.tenantStorages.clear();
    
    // Închide conexiunile Supabase
    await supabaseMultiTenantManager.closeAllTenantConnections();
    
    console.log('✅ All Supabase tenant connections closed');
  }

  /**
   * Obține statistici despre tenant-ii activi
   */
  getTenantStats(): { activeTenants: number; tenantIds: string[] } {
    return {
      activeTenants: this.tenantStorages.size,
      tenantIds: Array.from(this.tenantStorages.keys())
    };
  }

  /**
   * Șterge complet datele unui tenant
   */
  async deleteTenantData(tenantId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting Supabase tenant data for: ${tenantId}`);
      
      // Elimină din cache
      this.tenantStorages.delete(tenantId);
      
      // Șterge datele din Supabase
      await supabaseMultiTenantManager.deleteTenantData(tenantId);
      
      console.log(`✅ Successfully deleted Supabase tenant data for: ${tenantId}`);
    } catch (error) {
      console.error(`❌ Failed to delete Supabase tenant data for ${tenantId}:`, error);
      throw error;
    }
  }
}

// Instanță singleton
const supabaseTenantManager = new SupabaseTenantManager();

export { supabaseTenantManager, SupabaseTenantManager };