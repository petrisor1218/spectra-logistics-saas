import { companies, type Company, type InsertCompany } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import type { DatabaseStorage } from "./storage.js";

/**
 * Extension methods for company management
 */
export class CompanyManagementExtensions {
  
  /**
   * Get the main company for the current tenant
   */
  static async getMainCompany(storage: DatabaseStorage): Promise<Company | undefined> {
    const db = storage.getDb();
    const results = await db.select().from(companies).where(eq(companies.isMainCompany, true)).limit(1);
    return results[0];
  }

  /**
   * Create or update the main company
   */
  static async saveMainCompany(storage: DatabaseStorage, companyData: InsertCompany): Promise<Company> {
    const db = storage.getDb();
    
    // First, ensure no other company is marked as main
    await db.update(companies).set({ isMainCompany: false });
    
    // If updating existing company (id should be a number)
    if (companyData.id && typeof companyData.id === 'number') {
      const updated = await db.update(companies)
        .set({ 
          ...companyData, 
          isMainCompany: true 
        })
        .where(eq(companies.id, companyData.id))
        .returning();
      return updated[0];
    }
    
    // Creating new main company
    const created = await db.insert(companies)
      .values({ 
        ...companyData, 
        isMainCompany: true,
        commissionRate: companyData.commissionRate || "0.0000" // Default commission rate
      })
      .returning();
    
    return created[0];
  }

  /**
   * Initialize main company for new tenant
   */
  static async initializeMainCompany(storage: DatabaseStorage, companyName: string, userEmail?: string): Promise<Company> {
    const existingMain = await this.getMainCompany(storage);
    if (existingMain) {
      return existingMain;
    }

    const companyData: InsertCompany = {
      name: companyName,
      commissionRate: "0.0000", // No commission for main company
      country: "Romania",
      isMainCompany: true,
      contact: userEmail || ""
    };

    return await this.saveMainCompany(storage, companyData);
  }
}