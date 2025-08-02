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
 * Storage pentru utilizatorul principal folosind Supabase
 * Înlocuiește DatabaseStorage cu implementare Supabase
 */
export class SupabaseMainStorage {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ================== User Methods ==================
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error(`❌ Error fetching user ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error(`❌ Error fetching user by username ${username}:`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error(`❌ Error fetching user by email ${email}:`, error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert(user)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating user:`, error);
      throw error;
    }
  }

  // ================== Company Methods ==================
  async getAllCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('*')
        .eq('tenant_id', 'main')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching companies:`, error);
      return [];
    }
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('*')
        .eq('name', name)
        .eq('tenant_id', 'main')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error(`❌ Error fetching company ${name}:`, error);
      return undefined;
    }
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    try {
      const companyData = {
        ...company,
        tenant_id: 'main'
      };

      const { data, error } = await this.supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating company:`, error);
      throw error;
    }
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .update(company)
        .eq('id', id)
        .eq('tenant_id', 'main')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error updating company ${id}:`, error);
      throw error;
    }
  }

  // ================== Driver Methods ==================
  async getAllDrivers(): Promise<Driver[]> {
    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .select('*')
        .eq('tenant_id', 'main')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching drivers:`, error);
      return [];
    }
  }

  async getDriversByCompany(companyId: number): Promise<Driver[]> {
    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .select('*')
        .eq('company_id', companyId)
        .eq('tenant_id', 'main')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching drivers for company ${companyId}:`, error);
      return [];
    }
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    try {
      const driverData = {
        ...driver,
        tenant_id: 'main'
      };

      const { data, error } = await this.supabase
        .from('drivers')
        .insert(driverData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating driver:`, error);
      throw error;
    }
  }

  async updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver> {
    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .update(driver)
        .eq('id', id)
        .eq('tenant_id', 'main')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error updating driver ${id}:`, error);
      throw error;
    }
  }

  async deleteDriver(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('drivers')
        .delete()
        .eq('id', id)
        .eq('tenant_id', 'main');

      if (error) throw error;
    } catch (error) {
      console.error(`❌ Error deleting driver ${id}:`, error);
      throw error;
    }
  }

  // ================== Weekly Processing Methods ==================
  async getAllWeeklyProcessing(): Promise<WeeklyProcessing[]> {
    try {
      const { data, error } = await this.supabase
        .from('weekly_processing')
        .select('*')
        .eq('tenant_id', 'main')
        .order('processing_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching weekly processing:`, error);
      return [];
    }
  }

  async getWeeklyProcessing(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('weekly_processing')
        .select('*')
        .eq('week_label', weekLabel)
        .eq('tenant_id', 'main')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      console.error(`❌ Error fetching weekly processing ${weekLabel}:`, error);
      return undefined;
    }
  }

  async createWeeklyProcessing(processing: InsertWeeklyProcessing): Promise<WeeklyProcessing> {
    try {
      const processingData = {
        ...processing,
        tenant_id: 'main'
      };

      const { data, error } = await this.supabase
        .from('weekly_processing')
        .insert(processingData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating weekly processing:`, error);
      throw error;
    }
  }

  // ================== Payment Methods ==================  
  async getAllPayments(): Promise<Payment[]> {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', 'main')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching payments:`, error);
      return [];
    }
  }

  async getPaymentsByWeek(weekLabel: string): Promise<Payment[]> {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('week_label', weekLabel)
        .eq('tenant_id', 'main');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching payments for week ${weekLabel}:`, error);
      return [];
    }
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      const paymentData = {
        ...payment,
        tenant_id: 'main'
      };

      const { data, error } = await this.supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating payment:`, error);
      throw error;
    }
  }

  // ================== Company Balance Methods ==================
  async getAllCompanyBalances(): Promise<CompanyBalance[]> {
    try {
      const { data, error } = await this.supabase
        .from('company_balances')
        .select('*')
        .eq('tenant_id', 'main')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching company balances:`, error);
      return [];
    }
  }

  async getCompanyBalances(): Promise<CompanyBalance[]> {
    // Alias pentru compatibilitate
    return this.getAllCompanyBalances();
  }

  async createCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance> {
    try {
      const balanceData = {
        ...balance,
        tenant_id: 'main'
      };

      const { data, error } = await this.supabase
        .from('company_balances')
        .insert(balanceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating company balance:`, error);
      throw error;
    }
  }

  async updateCompanyBalance(id: number, balance: Partial<InsertCompanyBalance>): Promise<CompanyBalance> {
    try {
      const { data, error } = await this.supabase
        .from('company_balances')
        .update(balance)
        .eq('id', id)
        .eq('tenant_id', 'main')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error updating company balance ${id}:`, error);
      throw error;
    }
  }

  // ================== Transport Order Methods ==================
  async getAllTransportOrders(): Promise<TransportOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from('transport_orders')
        .select('*')
        .eq('tenant_id', 'main')
        .order('order_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching transport orders:`, error);
      return [];
    }
  }

  async getTransportOrdersByWeek(weekLabel: string): Promise<TransportOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from('transport_orders')
        .select('*')
        .eq('tenant_id', 'main')
        .eq('week_label', weekLabel)
        .order('order_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching transport orders by week:`, error);
      return [];
    }
  }

  async getTransportOrdersByCompany(companyName: string): Promise<TransportOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from('transport_orders')
        .select('*')
        .eq('tenant_id', 'main')
        .eq('company_name', companyName)
        .order('order_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching transport orders by company:`, error);
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
        tenant_id: 'main'
      };

      const { data, error } = await this.supabase
        .from('transport_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`❌ Error creating transport order:`, error);
      throw error;
    }
  }
}