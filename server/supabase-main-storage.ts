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
      
      if (data) {
        // Map Supabase response to Drizzle schema
        return {
          ...data,
          password: data.password_hash, // Map password_hash to password
          tenantId: data.tenant_id // Map tenant_id to tenantId
        } as User;
      }
      
      return undefined;
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
      
      if (data) {
        // Map Supabase response to Drizzle schema
        return {
          ...data,
          password: data.password_hash, // Map password_hash to password
          tenantId: data.tenant_id // Map tenant_id to tenantId
        } as User;
      }
      
      return undefined;
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
      // Map Drizzle schema field names to Supabase schema field names
      const supabaseUser = {
        username: user.username,
        password_hash: user.password, // Map password to password_hash
        email: user.email,
        role: user.role,
        tenant_id: user.tenantId, // Map tenantId to tenant_id
        subscription_status: user.subscriptionStatus,
        subscription_plan: 'transport_pro',
        subscription_start_date: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('users')
        .insert(supabaseUser)
        .select()
        .single();

      if (error) throw error;
      
      // Map Supabase response back to Drizzle schema
      return {
        ...data,
        password: data.password_hash, // Map password_hash back to password
        tenantId: data.tenant_id // Map tenant_id back to tenantId
      } as User;
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
      // Map camelCase fields to Supabase snake_case schema
      const companyData = {
        name: company.name,
        commission_rate: parseFloat(company.commissionRate || '0.04'), // Correct field name for Supabase
        cif: company.cif,
        trade_registry: company.tradeRegisterNumber,
        address: company.address,
        tenant_id: 'main'
      };

      const { data, error } = await this.supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;
      
      // Map response back to camelCase for consistency
      return {
        id: data.id,
        name: data.name,
        commissionRate: data.commission_rate?.toString() || '0.04',
        cif: data.cif,
        tradeRegisterNumber: data.trade_registry,
        address: data.address,
        location: data.location,
        county: data.county,
        country: data.country || 'Romania',
        contact: data.contact,
        isMainCompany: data.is_main_company || false,
        createdAt: new Date(data.created_at)
      } as Company;
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
  async getCompanyBalances(): Promise<CompanyBalance[]> {
    try {
      const { data, error } = await this.supabase
        .from('company_balances')
        .select(`
          id,
          company_id,
          week_label,
          total_invoiced,
          total_paid,
          outstanding_balance,
          status,
          tenant_id,
          created_at,
          updated_at
        `)
        .eq('tenant_id', 'main')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map Supabase response to Drizzle schema
      const mappedData = (data || []).map(item => ({
        id: item.id,
        companyName: `Company_${item.company_id}`, // Temporary mapping since we don't have company_name in Supabase
        weekLabel: item.week_label,
        totalInvoiced: parseFloat(item.total_invoiced),
        amountPaid: parseFloat(item.total_paid), // Map total_paid to amountPaid
        outstandingBalance: parseFloat(item.outstanding_balance),
        status: item.status,
        paymentDate: null,
        notes: '',
        createdAt: new Date(item.created_at)
      }));
      
      return mappedData as CompanyBalance[];
    } catch (error) {
      console.error(`❌ Error fetching company balances:`, error);
      return [];
    }
  }

  async createCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance> {
    try {
      // Map Drizzle schema to Supabase schema
      const balanceData = {
        week_label: balance.weekLabel,
        total_invoiced: balance.totalInvoiced,
        total_paid: balance.amountPaid, // Map amountPaid to total_paid
        outstanding_balance: balance.outstandingBalance,
        status: balance.status,
        tenant_id: 'main'
      };

      const { data, error } = await this.supabase
        .from('company_balances')
        .insert(balanceData)
        .select()
        .single();

      if (error) throw error;
      
      // Map response back to Drizzle schema
      return {
        id: data.id,
        companyName: `Company_${data.company_id}`,
        weekLabel: data.week_label,
        totalInvoiced: parseFloat(data.total_invoiced),
        amountPaid: parseFloat(data.total_paid),
        outstandingBalance: parseFloat(data.outstanding_balance),
        status: data.status,
        paymentDate: null,
        notes: '',
        createdAt: new Date(data.created_at)
      } as CompanyBalance;
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
  async getTransportOrders(): Promise<TransportOrder[]> {
    try {
      const { data, error } = await this.supabase
        .from('transport_orders')
        .select('*')
        .eq('tenant_id', 'main')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching transport orders:`, error);
      return [];
    }
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