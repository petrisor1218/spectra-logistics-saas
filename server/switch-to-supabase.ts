/**
 * Switch pentru activarea sistemului Supabase pentru utilizatorul principal
 * Înlocuiește DatabaseStorage cu SupabaseMainStorage
 */
import { SupabaseMainStorage } from './supabase-main-storage.js';
import supabaseMultiTenantManager from './supabase-multi-tenant-manager.js';

// Flag pentru activarea Supabase
export const USE_SUPABASE = true;

// Instanță Supabase storage pentru utilizatorul principal
export const supabaseMainStorage = new SupabaseMainStorage(
  supabaseMultiTenantManager.getMainSupabase()
);

export function getMainStorage() {
  if (USE_SUPABASE) {
    console.log('🚀 Using Supabase storage for main user');
    return supabaseMainStorage;
  } else {
    console.log('📦 Using PostgreSQL storage for main user');
    // Return original storage
    return null; // Will be replaced with import
  }
}