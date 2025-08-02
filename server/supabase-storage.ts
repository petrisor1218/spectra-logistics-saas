import { SupabaseClient } from '@supabase/supabase-js';
import { 
  type User, 
  type InsertUser,
  type Company,
  type InsertCompany,
  type Driver,
  type InsertDriver,
  type WeeklyProcessing,
  type InsertWeeklyProcessing,
  type Payment,
  type InsertPayment,
  type PaymentHistoryRecord,
  type InsertPaymentHistory,
  type TransportOrder,
  type InsertTransportOrder,
  type HistoricalTrip,
  type InsertHistoricalTrip,
  type OrderSequence,
  type InsertOrderSequence,
  type CompanyBalance,
  type InsertCompanyBalance
} from "@shared/schema";

/**
 * Storage implementare pentru Supabase multi-tenant
 * IZOLARE COMPLETĂ: Fiecare tenant are propriile tabele
 */
export class SupabaseStorage {
  private supabase: SupabaseClient;
  private tenantId: string;
  private tablePrefix: string;

  constructor(supabase: SupabaseClient, tenantId: string) {
    this.supabase = supabase;
    this.tenantId = tenantId;
    this.tablePrefix = `tenant_${tenantId}_`;
  }

  // ================== Company Methods ==================
  async getAllCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}companies`)
        .select('*')
        .eq('tenant_id', this.tenantId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching companies for tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}companies`)
        .select('*')
        .eq('name', name)
        .eq('tenant_id', this.tenantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error(`❌ Error fetching company ${name} for tenant ${this.tenantId}:`, error);
      return undefined;
    }
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    try {
      const companyData = {
        ...company,
        tenant_id: this.tenantId
      };

      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}companies`)
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating company for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}companies`)
        .update(company)
        .eq('id', id)
        .eq('tenant_id', this.tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error updating company ${id} for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  async deleteCompany(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(`${this.tablePrefix}companies`)
        .delete()
        .eq('id', id)
        .eq('tenant_id', this.tenantId);

      if (error) throw error;
    } catch (error) {
      console.error(`❌ Error deleting company ${id} for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  // ================== Driver Methods ==================
  async getAllDrivers(): Promise<Driver[]> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}drivers`)
        .select('*')
        .eq('tenant_id', this.tenantId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching drivers for tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  async getDriversByCompany(companyId: number): Promise<Driver[]> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}drivers`)
        .select('*')
        .eq('company_id', companyId)
        .eq('tenant_id', this.tenantId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching drivers for company ${companyId}, tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    try {
      const driverData = {
        ...driver,
        tenant_id: this.tenantId
      };

      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}drivers`)
        .insert(driverData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating driver for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  async updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}drivers`)
        .update(driver)
        .eq('id', id)
        .eq('tenant_id', this.tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error updating driver ${id} for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  async deleteDriver(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(`${this.tablePrefix}drivers`)
        .delete()
        .eq('id', id)
        .eq('tenant_id', this.tenantId);

      if (error) throw error;
    } catch (error) {
      console.error(`❌ Error deleting driver ${id} for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  // ================== Weekly Processing Methods ==================
  async getAllWeeklyProcessing(): Promise<WeeklyProcessing[]> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}weekly_processing`)
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('processing_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching weekly processing for tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  async getWeeklyProcessing(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}weekly_processing`)
        .select('*')
        .eq('week_label', weekLabel)
        .eq('tenant_id', this.tenantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error(`❌ Error fetching weekly processing ${weekLabel} for tenant ${this.tenantId}:`, error);
      return undefined;
    }
  }

  async createWeeklyProcessing(processing: InsertWeeklyProcessing): Promise<WeeklyProcessing> {
    try {
      const processingData = {
        ...processing,
        tenant_id: this.tenantId
      };

      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}weekly_processing`)
        .insert(processingData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating weekly processing for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  async updateWeeklyProcessing(weekLabel: string, data: Partial<InsertWeeklyProcessing>): Promise<WeeklyProcessing> {
    try {
      const { data: result, error } = await this.supabase
        .from(`${this.tablePrefix}weekly_processing`)
        .update(data)
        .eq('week_label', weekLabel)
        .eq('tenant_id', this.tenantId)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`❌ Error updating weekly processing ${weekLabel} for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  // ================== Payment Methods ==================
  async getPaymentsByWeek(weekLabel: string): Promise<Payment[]> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}payments`)
        .select('*')
        .eq('week_label', weekLabel)
        .eq('tenant_id', this.tenantId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching payments for week ${weekLabel}, tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      const paymentData = {
        ...payment,
        tenant_id: this.tenantId
      };

      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}payments`)
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating payment for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  // ================== Company Balance Methods ==================
  async getCompanyBalances(): Promise<CompanyBalance[]> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}company_balances`)
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching company balances for tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  async createCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance> {
    try {
      const balanceData = {
        ...balance,
        tenant_id: this.tenantId
      };

      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}company_balances`)
        .insert(balanceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating company balance for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  async updateCompanyBalance(id: number, balance: Partial<InsertCompanyBalance>): Promise<CompanyBalance> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}company_balances`)
        .update(balance)
        .eq('id', id)
        .eq('tenant_id', this.tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error updating company balance ${id} for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  // ================== Transport Order Methods ==================
  async getAllTransportOrders(): Promise<TransportOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}transport_orders`)
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('orderDate', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching transport orders for tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  async getTransportOrdersByWeek(weekLabel: string): Promise<TransportOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}transport_orders`)
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('weekLabel', weekLabel)
        .order('orderDate', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching transport orders by week for tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  async getTransportOrdersByCompany(companyName: string): Promise<TransportOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}transport_orders`)
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('companyName', companyName)
        .order('orderDate', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching transport orders by company for tenant ${this.tenantId}:`, error);
      return [];
    }
  }

  async getTransportOrders(): Promise<TransportOrder[]> {
    // Alias pentru compatibilitate
    return this.getAllTransportOrders();
  }

  async createTransportOrder(order: InsertTransportOrder): Promise<TransportOrder> {
    try {
      const orderData = {
        ...order,
        tenant_id: this.tenantId
      };

      const { data, error } = await this.supabase
        .from(`${this.tablePrefix}transport_orders`)
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating transport order for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  async deleteTransportOrder(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(`${this.tablePrefix}transport_orders`)
        .delete()
        .eq('id', id)
        .eq('tenant_id', this.tenantId);

      if (error) throw error;
    } catch (error) {
      console.error(`❌ Error deleting transport order ${id} for tenant ${this.tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Obține statistici despre tenant
   */
  async getTenantStats(): Promise<{
    companies: number;
    drivers: number;
    weeklyProcessing: number;
    payments: number;
  }> {
    try {
      const [companies, drivers, weeklyProcessing, payments] = await Promise.all([
        this.getAllCompanies(),
        this.getAllDrivers(),
        this.getAllWeeklyProcessing(),
        this.getPaymentsByWeek('')
      ]);

      return {
        companies: companies.length,
        drivers: drivers.length,
        weeklyProcessing: weeklyProcessing.length,
        payments: payments.length
      };
    } catch (error) {
      console.error(`❌ Error getting tenant stats for ${this.tenantId}:`, error);
      return { companies: 0, drivers: 0, weeklyProcessing: 0, payments: 0 };
    }
  }
}