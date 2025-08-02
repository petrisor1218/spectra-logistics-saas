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
    const allCompanies = await storage.getAllCompanies();
    return allCompanies.find(company => company.isMainCompany);
  }

  /**
   * Create or update the main company
   */
  static async saveMainCompany(storage: DatabaseStorage, companyData: any): Promise<Company> {
    // Clean the data to remove frontend-only fields
    const cleanData = {
      name: companyData.name,
      commissionRate: companyData.commissionRate || "0.0000",
      cif: companyData.cif || null,
      tradeRegisterNumber: companyData.tradeRegisterNumber || null,
      address: companyData.address || null,
      location: companyData.location || null,
      county: companyData.county || null,
      country: companyData.country || "Romania",
      contact: companyData.contact || null,
      isMainCompany: true
    };

    // If updating existing company
    if (companyData.id && typeof companyData.id === 'number') {
      // First, ensure no other company is marked as main
      const allCompanies = await storage.getAllCompanies();
      for (const company of allCompanies) {
        if (company.id !== companyData.id && company.isMainCompany) {
          await storage.updateCompany(company.id, { ...company, isMainCompany: false });
        }
      }
      
      // Update the main company
      const updated = await storage.updateCompany(companyData.id, cleanData);
      return updated;
    }
    
    // Creating new main company - first ensure no other company is marked as main
    const allCompanies = await storage.getAllCompanies();
    for (const company of allCompanies) {
      if (company.isMainCompany) {
        await storage.updateCompany(company.id, { ...company, isMainCompany: false });
      }
    }
    
    // Create new main company
    const created = await storage.addCompany(cleanData);
    return created;
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