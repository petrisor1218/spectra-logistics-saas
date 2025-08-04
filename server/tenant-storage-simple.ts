/**
 * 🔒 TENANT STORAGE SIMPLE - Folosește Drizzle cu raw SQL pentru izolare perfectă
 */
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { IStorage } from './storage.js';
import type { 
  User, InsertUser, Company, InsertCompany, Driver, InsertDriver,
  WeeklyProcessing, InsertWeeklyProcessing, Payment, InsertPayment,
  PaymentHistoryRecord, InsertPaymentHistory, TransportOrder, InsertTransportOrder,
  HistoricalTrip, InsertHistoricalTrip, OrderSequence, InsertOrderSequence,
  CompanyBalance, InsertCompanyBalance, UsernameReservation, InsertUsernameReservation
} from '../shared/schema.js';

neonConfig.webSocketConstructor = ws;

/**
 * Storage adapter pentru tenant-i cu SQL simplu și izolare garantată
 */
export class TenantStorageSimple implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    
    // Conexiune simplă PostgreSQL
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(this.pool, { schema });
    
    console.log(`🔗 TenantStorageSimple initialized for: ${tenantId}`);
  }

  // User methods (nu sunt gestionate de tenant-i)
  async getUser(id: number): Promise<User | undefined> {
    throw new Error('Tenant storage does not manage users');
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    throw new Error('Tenant storage does not manage users');
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error('Tenant storage does not manage users');
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error('Tenant storage does not manage users');
  }

  // Username reservation methods
  async reserveUsername(username: string, email: string): Promise<string> {
    throw new Error('Tenant storage does not manage username reservations');
  }

  async validateReservation(username: string, token: string): Promise<boolean> {
    throw new Error('Tenant storage does not manage username reservations');
  }

  async releaseReservation(username: string): Promise<void> {
    throw new Error('Tenant storage does not manage username reservations');
  }

  // Company methods cu SQL direct pentru izolare perfectă
  async getAllCompanies(): Promise<Company[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.companies ORDER BY id`
    );
    
    // Extractează array-ul de rows din rezultatul SQL
    const companies = (result as any).rows || [];
    console.log(`🔍 TenantStorageSimple.getAllCompanies: ${companies.length} records from ${this.tenantId}`);
    return companies;
  }

  async getCompaniesByTenant(tenantId: string): Promise<Company[]> {
    return await this.getAllCompanies();
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.companies WHERE name = ${name} LIMIT 1`
    );
    const companies = (result as any).rows || [];
    return companies[0] as Company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    console.log(`🔍 Creating company in schema ${this.tenantId}:`, company.name);
    
    try {
      const result = await this.db.execute(
        sql`
          INSERT INTO ${sql.identifier(this.tenantId)}.companies 
          (name, commission_rate, cif, trade_register_number, address, location, county, country, contact, is_main_company, created_at)
          VALUES (
            ${company.name},
            ${company.commissionRate || '0.0400'},
            ${company.cif || null},
            ${company.tradeRegisterNumber || null},
            ${company.address || null},
            ${company.location || null},
            ${company.county || null},
            ${company.country || 'Romania'},
            ${company.contact || null},
            ${company.isMainCompany || false},
            CURRENT_TIMESTAMP
          )
          RETURNING *
        `
      );
      
      // Extractează compania din rezultatul SQL
      const companies = (result as any).rows || [];
      const newCompany = companies[0] as Company;
      
      if (!newCompany) {
        console.warn(`⚠️ Company creation returned no result for ${this.tenantId}`);
        console.warn(`SQL result:`, result);
      } else {
        console.log(`✅ Company created in ${this.tenantId}:`, newCompany.name, `(ID: ${newCompany.id})`);
      }
      return newCompany;
    } catch (error) {
      console.error(`❌ Error creating company in ${this.tenantId}:`, error);
      console.error(`Company data:`, company);
      throw error;
    }
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.companies 
        SET 
          name = COALESCE(${company.name}, name),
          commission_rate = COALESCE(${company.commissionRate}, commission_rate),
          cif = COALESCE(${company.cif}, cif),
          trade_register_number = COALESCE(${company.tradeRegisterNumber}, trade_register_number),
          address = COALESCE(${company.address}, address),
          location = COALESCE(${company.location}, location),
          county = COALESCE(${company.county}, county),
          country = COALESCE(${company.country}, country),
          contact = COALESCE(${company.contact}, contact),
          is_main_company = COALESCE(${company.isMainCompany}, is_main_company)
        WHERE id = ${id}
        RETURNING *
      `
    );
    const companies = (result as any).rows || [];
    return companies[0] as Company;
  }

  async deleteCompany(id: number): Promise<void> {
    console.log(`🗑️ Deleting company ID ${id} from schema ${this.tenantId}`);
    
    try {
      // Folosește proper Drizzle SQL template cu RETURNING pentru debugging
      const result = await this.db.execute(
        sql`DELETE FROM ${sql.identifier(this.tenantId)}.companies WHERE id = ${id} RETURNING id, name`
      );
      
      const rows = (result as any).rows || [];
      const rowCount = rows.length;
      console.log(`🔍 DELETE RESULT for company ${id}: rows.length=${rowCount}, rows=`, rows);
      console.log(`🔍 Full result object:`, JSON.stringify(result, null, 2));
      
      if (rowCount === 0) {
        console.error(`❌ CRITICAL: No rows affected when deleting company ${id} from ${this.tenantId}`);
        console.error(`❌ This means the DELETE query didn't match any records!`);
        throw new Error(`Company ${id} not found in ${this.tenantId} - DELETE had no effect`);
      } else {
        console.log(`✅ SUCCESS: Company ${id} actually deleted (${rowCount} rows affected)`);
      }
    } catch (error) {
      console.error(`❌ Error deleting company ${id} from ${this.tenantId}:`, error);
      throw error;
    }
  }

  // Driver methods cu SQL direct
  async getAllDrivers(): Promise<Driver[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.drivers ORDER BY id`
    );
    
    // Extractează array-ul de rows din rezultatul SQL
    const drivers = (result as any).rows || [];
    console.log(`🔍 TenantStorageSimple.getAllDrivers: ${drivers.length} records from ${this.tenantId}`);
    return drivers;
  }

  async getDriversByTenant(tenantId: string): Promise<Driver[]> {
    return await this.getAllDrivers();
  }

  async getDriversByCompany(companyId: number): Promise<Driver[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.drivers WHERE company_id = ${companyId}`
    );
    const drivers = (result as any).rows || [];
    return drivers;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.drivers 
        (name, company_id, name_variants, phone, email, created_at)
        VALUES (
          ${driver.name},
          ${driver.companyId || null},
          ${driver.nameVariants || null},
          ${driver.phone || null},
          ${driver.email || null},
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `
    );
    return result[0] as Driver;
  }

  async updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.drivers 
        SET 
          name = COALESCE(${driver.name}, name),
          company_id = COALESCE(${driver.companyId}, company_id),
          name_variants = COALESCE(${driver.nameVariants}, name_variants),
          phone = COALESCE(${driver.phone}, phone),
          email = COALESCE(${driver.email}, email)
        WHERE id = ${id}
        RETURNING *
      `
    );
    return result[0] as Driver;
  }

  async deleteDriver(id: number): Promise<void> {
    await this.db.execute(
      sql`DELETE FROM ${sql.identifier(this.tenantId)}.drivers WHERE id = ${id}`
    );
  }

  // Weekly processing methods cu SQL direct
  async getWeeklyProcessing(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.weekly_processing WHERE week_label = ${weekLabel} LIMIT 1`
    );
    return result[0] as WeeklyProcessing;
  }

  async getWeeklyProcessingByWeek(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    return await this.getWeeklyProcessing(weekLabel);
  }

  async getAllWeeklyProcessing(): Promise<WeeklyProcessing[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.weekly_processing ORDER BY processing_date DESC`
    );
    
    // Extractează array-ul de rows din rezultatul SQL
    const processing = (result as any).rows || [];
    console.log(`🔍 TenantStorageSimple.getAllWeeklyProcessing: ${processing.length} records from ${this.tenantId}`);
    return processing;
  }

  async createWeeklyProcessing(processing: InsertWeeklyProcessing): Promise<WeeklyProcessing> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.weekly_processing 
        (week_label, trip_data_count, invoice7_count, invoice30_count, processed_data, trip_data, invoice7_data, invoice30_data, processing_date)
        VALUES (
          ${processing.weekLabel},
          ${processing.tripDataCount || 0},
          ${processing.invoice7Count || 0},
          ${processing.invoice30Count || 0},
          ${JSON.stringify(processing.processedData)},
          ${JSON.stringify(processing.tripData)},
          ${JSON.stringify(processing.invoice7Data)},
          ${JSON.stringify(processing.invoice30Data)},
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `
    );
    return result[0] as WeeklyProcessing;
  }

  async updateWeeklyProcessing(weekLabel: string, data: Partial<InsertWeeklyProcessing>): Promise<WeeklyProcessing> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.weekly_processing 
        SET 
          trip_data_count = COALESCE(${data.tripDataCount}, trip_data_count),
          invoice7_count = COALESCE(${data.invoice7Count}, invoice7_count),
          invoice30_count = COALESCE(${data.invoice30Count}, invoice30_count),
          processed_data = COALESCE(${data.processedData ? JSON.stringify(data.processedData) : null}, processed_data),
          trip_data = COALESCE(${data.tripData ? JSON.stringify(data.tripData) : null}, trip_data),
          invoice7_data = COALESCE(${data.invoice7Data ? JSON.stringify(data.invoice7Data) : null}, invoice7_data),
          invoice30_data = COALESCE(${data.invoice30Data ? JSON.stringify(data.invoice30Data) : null}, invoice30_data)
        WHERE week_label = ${weekLabel}
        RETURNING *
      `
    );
    return result[0] as WeeklyProcessing;
  }

  // Restul metodelor implementate similar cu SQL direct și sql.identifier()

  // Payment methods
  async getPaymentsByWeek(weekLabel: string): Promise<Payment[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.payments WHERE week_label = ${weekLabel}`
    );
    return result as Payment[];
  }

  async getAllPayments(): Promise<Payment[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.payments ORDER BY id`
    );
    const payments = (result as any).rows || [];
    console.log(`🔍 TenantStorageSimple.getAllPayments: ${payments.length} records from ${this.tenantId}`);
    return payments;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.payments 
        (week_label, company_name, total_7_days, total_30_days, commission, total_invoiced, created_at)
        VALUES (
          ${payment.weekLabel},
          ${payment.companyName},
          ${payment.total7Days},
          ${payment.total30Days},
          ${payment.commission},
          ${payment.totalInvoiced},
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `
    );
    return result[0] as Payment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.payments 
        SET 
          week_label = COALESCE(${payment.weekLabel}, week_label),
          company_name = COALESCE(${payment.companyName}, company_name),
          total_7_days = COALESCE(${payment.total7Days}, total_7_days),
          total_30_days = COALESCE(${payment.total30Days}, total_30_days),
          commission = COALESCE(${payment.commission}, commission),
          total_invoiced = COALESCE(${payment.totalInvoiced}, total_invoiced)
        WHERE id = ${id}
        RETURNING *
      `
    );
    return result[0] as Payment;
  }

  async deletePayment(id: number): Promise<void> {
    await this.db.execute(
      sql`DELETE FROM ${sql.identifier(this.tenantId)}.payments WHERE id = ${id}`
    );
  }

  // Payment history methods
  async getPaymentHistory(): Promise<PaymentHistoryRecord[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.payment_history ORDER BY created_at DESC`
    );
    return result as PaymentHistoryRecord[];
  }

  async createPaymentHistory(history: InsertPaymentHistory): Promise<PaymentHistoryRecord> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.payment_history 
        (payment_id, action, previous_data, created_at)
        VALUES (
          ${history.paymentId},
          ${history.action},
          ${history.previousData ? JSON.stringify(history.previousData) : null},
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `
    );
    return result[0] as PaymentHistoryRecord;
  }

  async deletePaymentHistory(id: number): Promise<void> {
    await this.db.execute(
      sql`DELETE FROM ${sql.identifier(this.tenantId)}.payment_history WHERE id = ${id}`
    );
  }

  // Transport orders methods
  async getAllTransportOrders(): Promise<TransportOrder[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.transport_orders ORDER BY id`
    );
    
    // Extractează array-ul de rows din rezultatul SQL
    const orders = (result as any).rows || [];
    console.log(`🔍 TenantStorageSimple.getAllTransportOrders: ${orders.length} records from ${this.tenantId}`);
    return orders;
  }

  async createTransportOrder(order: InsertTransportOrder): Promise<TransportOrder> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.transport_orders 
        (order_number, company_id, week_label, total_amount, status, created_at)
        VALUES (
          ${order.orderNumber},
          ${order.companyId},
          ${order.weekLabel},
          ${order.totalAmount},
          ${order.status || 'pending'},
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `
    );
    return result[0] as TransportOrder;
  }

  async updateTransportOrder(id: number, order: Partial<InsertTransportOrder>): Promise<TransportOrder> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.transport_orders 
        SET 
          order_number = COALESCE(${order.orderNumber}, order_number),
          company_id = COALESCE(${order.companyId}, company_id),
          week_label = COALESCE(${order.weekLabel}, week_label),
          total_amount = COALESCE(${order.totalAmount}, total_amount),
          status = COALESCE(${order.status}, status)
        WHERE id = ${id}
        RETURNING *
      `
    );
    return result[0] as TransportOrder;
  }

  async deleteTransportOrder(id: number): Promise<void> {
    await this.db.execute(
      sql`DELETE FROM ${sql.identifier(this.tenantId)}.transport_orders WHERE id = ${id}`
    );
  }

  // Historical trips methods
  async getHistoricalTripsByVRID(vrid: string): Promise<HistoricalTrip[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.historical_trips WHERE vrid = ${vrid}`
    );
    return result as HistoricalTrip[];
  }

  async createHistoricalTrip(trip: InsertHistoricalTrip): Promise<HistoricalTrip> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.historical_trips 
        (vrid, trip_date, amount, driver_name, company_name, created_at)
        VALUES (
          ${trip.vrid},
          ${trip.tripDate},
          ${trip.amount},
          ${trip.driverName},
          ${trip.companyName},
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `
    );
    return result[0] as HistoricalTrip;
  }

  // Order sequence methods
  async getOrderSequence(): Promise<OrderSequence | undefined> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.order_sequence LIMIT 1`
    );
    return result[0] as OrderSequence;
  }

  async updateOrderSequence(lastOrderNumber: number): Promise<OrderSequence> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.order_sequence 
        SET last_order_number = ${lastOrderNumber}, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `
    );
    return result[0] as OrderSequence;
  }

  async createOrderSequence(sequence: InsertOrderSequence): Promise<OrderSequence> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.order_sequence 
        (last_order_number, updated_at)
        VALUES (${sequence.lastOrderNumber}, CURRENT_TIMESTAMP)
        RETURNING *
      `
    );
    return result[0] as OrderSequence;
  }

  // Company balances methods
  async getAllCompanyBalances(): Promise<CompanyBalance[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.company_balances ORDER BY id`
    );
    
    // Extractează array-ul de rows din rezultatul SQL
    const balances = (result as any).rows || [];
    console.log(`🔍 TenantStorageSimple.getAllCompanyBalances: ${balances.length} records from ${this.tenantId}`);
    return balances;
  }

  async createCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.company_balances 
        (company_name, week_label, total_invoiced, amount_paid, outstanding_balance, status, created_at)
        VALUES (
          ${balance.companyName},
          ${balance.weekLabel},
          ${balance.totalInvoiced},
          ${balance.amountPaid || 0},
          ${balance.outstandingBalance},
          ${balance.status || 'pending'},
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `
    );
    return result[0] as CompanyBalance;
  }

  async updateCompanyBalance(id: number, balance: Partial<InsertCompanyBalance>): Promise<CompanyBalance> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.company_balances 
        SET 
          company_name = COALESCE(${balance.companyName}, company_name),
          week_label = COALESCE(${balance.weekLabel}, week_label),
          total_invoiced = COALESCE(${balance.totalInvoiced}, total_invoiced),
          amount_paid = COALESCE(${balance.amountPaid}, amount_paid),
          outstanding_balance = COALESCE(${balance.outstandingBalance}, outstanding_balance),
          status = COALESCE(${balance.status}, status)
        WHERE id = ${id}
        RETURNING *
      `
    );
    return result[0] as CompanyBalance;
  }

  async deleteCompanyBalance(id: number): Promise<void> {
    await this.db.execute(
      sql`DELETE FROM ${sql.identifier(this.tenantId)}.company_balances WHERE id = ${id}`
    );
  }

  // Close connection method
  async close(): Promise<void> {
    await this.pool.end();
    console.log(`🔌 TenantStorageSimple connection closed for: ${this.tenantId}`);
  }
}