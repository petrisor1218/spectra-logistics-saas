/**
 * 🔒 TENANT STORAGE FIXED - Conectare directă cu prefix schema explicit în fiecare query
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
 * Storage adapter pentru tenant-i cu prefix explicit de schema în toate queries
 */
export class TenantStorageFixed implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    
    // Conexiune simplă PostgreSQL cu prefix manual de schema
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(this.pool, { schema });
    
    console.log(`🔗 TenantStorageFixed initialized for: ${tenantId}`);
  }

  // Helper pentru a executa SQL cu schema explicitară și parametri corect bindați
  private async executeRaw<T = any>(query: string, params: any[] = []): Promise<T[]> {
    try {
      // Folosim direct sql template pentru a evita problemele cu parametrii
      const sqlQuery = sql.raw(query.replace(/\$(\d+)/g, (match, num) => {
        const paramIndex = parseInt(num) - 1;
        const value = params[paramIndex];
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        return String(value);
      }));
      
      const result = await this.db.execute(sqlQuery);
      return result as T[];
    } catch (error) {
      console.error(`❌ SQL Error in ${this.tenantId}:`, error);
      console.error(`Query: ${query}`);
      console.error(`Params:`, params);
      throw error;
    }
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

  // Company methods cu schema prefix explicit
  async getAllCompanies(): Promise<Company[]> {
    const query = `SELECT * FROM "${this.tenantId}".companies ORDER BY id`;
    const result = await this.executeRaw<Company>(query);
    console.log(`🔍 TenantStorageFixed.getAllCompanies: ${result.length} records from ${this.tenantId}`);
    return result;
  }

  async getCompaniesByTenant(tenantId: string): Promise<Company[]> {
    return await this.getAllCompanies();
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const query = `SELECT * FROM "${this.tenantId}".companies WHERE name = $1 LIMIT 1`;
    const result = await this.executeRaw<Company>(query, [name]);
    return result[0];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    // Abordare simplificată - folosim direct valorile în query pentru a evita problemele de parametri
    const name = company.name.replace(/'/g, "''");
    const commissionRate = company.commissionRate || '0.0400';
    const cif = company.cif ? `'${company.cif.replace(/'/g, "''")}'` : 'NULL';
    const tradeRegisterNumber = company.tradeRegisterNumber ? `'${company.tradeRegisterNumber.replace(/'/g, "''")}'` : 'NULL';
    const address = company.address ? `'${company.address.replace(/'/g, "''")}'` : 'NULL';
    const location = company.location ? `'${company.location.replace(/'/g, "''")}'` : 'NULL';
    const county = company.county ? `'${company.county.replace(/'/g, "''")}'` : 'NULL';
    const country = company.country ? `'${company.country.replace(/'/g, "''")}'` : "'Romania'";
    const contact = company.contact ? `'${company.contact.replace(/'/g, "''")}'` : 'NULL';
    const isMainCompany = company.isMainCompany || false;
    
    const query = `
      INSERT INTO "${this.tenantId}".companies (name, commission_rate, cif, trade_register_number, address, location, county, country, contact, is_main_company, created_at)
      VALUES ('${name}', '${commissionRate}', ${cif}, ${tradeRegisterNumber}, ${address}, ${location}, ${county}, ${country}, ${contact}, ${isMainCompany}, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    console.log(`🔍 Creating company in schema ${this.tenantId}:`, company.name);
    
    const result = await this.executeRaw<Company>(query, []);
    
    console.log(`✅ Company created in ${this.tenantId}:`, result[0]);
    return result[0];
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    // Pentru simplitate, implementez doar update complet
    const query = `
      UPDATE "${this.tenantId}".companies 
      SET name = COALESCE($2, name),
          commission_rate = COALESCE($3, commission_rate),
          cif = COALESCE($4, cif),
          trade_register_number = COALESCE($5, trade_register_number),
          address = COALESCE($6, address),
          location = COALESCE($7, location),
          county = COALESCE($8, county),
          country = COALESCE($9, country),
          contact = COALESCE($10, contact),
          is_main_company = COALESCE($11, is_main_company)
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.executeRaw<Company>(query, [
      id,
      company.name,
      company.commissionRate,
      company.cif,
      company.tradeRegisterNumber,
      company.address,
      company.location,
      company.county,
      company.country,
      company.contact,
      company.isMainCompany
    ]);
    return result[0];
  }

  async deleteCompany(id: number): Promise<void> {
    const query = `DELETE FROM "${this.tenantId}".companies WHERE id = $1`;
    await this.executeRaw(query, [id]);
  }

  // Driver methods cu schema prefix explicit
  async getAllDrivers(): Promise<Driver[]> {
    const query = `SELECT * FROM "${this.tenantId}".drivers ORDER BY id`;
    const result = await this.executeRaw<Driver>(query);
    console.log(`🔍 TenantStorageFixed.getAllDrivers: ${result.length} records from ${this.tenantId}`);
    return result;
  }

  async getDriversByTenant(tenantId: string): Promise<Driver[]> {
    return await this.getAllDrivers();
  }

  async getDriversByCompany(companyId: number): Promise<Driver[]> {
    const query = `SELECT * FROM "${this.tenantId}".drivers WHERE company_id = $1`;
    const result = await this.executeRaw<Driver>(query, [companyId]);
    return result;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const query = `
      INSERT INTO "${this.tenantId}".drivers (name, company_id, name_variants, phone, email, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await this.executeRaw<Driver>(query, [
      driver.name,
      driver.companyId || null,
      driver.nameVariants || null,
      driver.phone || null,
      driver.email || null
    ]);
    return result[0];
  }

  async updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver> {
    const query = `
      UPDATE "${this.tenantId}".drivers 
      SET name = COALESCE($2, name),
          company_id = COALESCE($3, company_id),
          name_variants = COALESCE($4, name_variants),
          phone = COALESCE($5, phone),
          email = COALESCE($6, email)
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.executeRaw<Driver>(query, [
      id,
      driver.name,
      driver.companyId,
      driver.nameVariants,
      driver.phone,
      driver.email
    ]);
    return result[0];
  }

  async deleteDriver(id: number): Promise<void> {
    const query = `DELETE FROM "${this.tenantId}".drivers WHERE id = $1`;
    await this.executeRaw(query, [id]);
  }

  // Weekly processing methods cu schema prefix explicit
  async getWeeklyProcessing(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    const query = `SELECT * FROM "${this.tenantId}".weekly_processing WHERE week_label = $1 LIMIT 1`;
    const result = await this.executeRaw<WeeklyProcessing>(query, [weekLabel]);
    return result[0];
  }

  async getWeeklyProcessingByWeek(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    return await this.getWeeklyProcessing(weekLabel);
  }

  async getAllWeeklyProcessing(): Promise<WeeklyProcessing[]> {
    const query = `SELECT * FROM "${this.tenantId}".weekly_processing ORDER BY processing_date DESC`;
    const result = await this.executeRaw<WeeklyProcessing>(query);
    console.log(`🔍 TenantStorageFixed.getAllWeeklyProcessing: ${result.length} records from ${this.tenantId}`);
    return result;
  }

  async createWeeklyProcessing(processing: InsertWeeklyProcessing): Promise<WeeklyProcessing> {
    const query = `
      INSERT INTO "${this.tenantId}".weekly_processing (week_label, trip_data_count, invoice7_count, invoice30_count, processed_data, trip_data, invoice7_data, invoice30_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await this.executeRaw<WeeklyProcessing>(query, [
      processing.weekLabel,
      processing.tripDataCount || 0,
      processing.invoice7Count || 0,
      processing.invoice30Count || 0,
      JSON.stringify(processing.processedData),
      JSON.stringify(processing.tripData),
      JSON.stringify(processing.invoice7Data),
      JSON.stringify(processing.invoice30Data)
    ]);
    return result[0];
  }

  async updateWeeklyProcessing(weekLabel: string, data: Partial<InsertWeeklyProcessing>): Promise<WeeklyProcessing> {
    const query = `
      UPDATE "${this.tenantId}".weekly_processing 
      SET trip_data_count = COALESCE($2, trip_data_count),
          invoice7_count = COALESCE($3, invoice7_count),
          invoice30_count = COALESCE($4, invoice30_count),
          processed_data = COALESCE($5, processed_data),
          trip_data = COALESCE($6, trip_data),
          invoice7_data = COALESCE($7, invoice7_data),
          invoice30_data = COALESCE($8, invoice30_data)
      WHERE week_label = $1
      RETURNING *
    `;
    const result = await this.executeRaw<WeeklyProcessing>(query, [
      weekLabel,
      data.tripDataCount,
      data.invoice7Count,
      data.invoice30Count,
      data.processedData ? JSON.stringify(data.processedData) : null,
      data.tripData ? JSON.stringify(data.tripData) : null,
      data.invoice7Data ? JSON.stringify(data.invoice7Data) : null,
      data.invoice30Data ? JSON.stringify(data.invoice30Data) : null
    ]);
    return result[0];
  }

  // Restul metodelor implementate cu raw SQL pentru a forța folosirea schemei corecte

  // Payment methods
  async getPaymentsByWeek(weekLabel: string): Promise<Payment[]> {
    const query = `SELECT * FROM "${this.tenantId}".payments WHERE week_label = $1`;
    return await this.executeRaw<Payment>(query, [weekLabel]);
  }

  async getAllPayments(): Promise<Payment[]> {
    const query = `SELECT * FROM "${this.tenantId}".payments ORDER BY id`;
    return await this.executeRaw<Payment>(query);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const query = `
      INSERT INTO "${this.tenantId}".payments (week_label, company_name, total_7_days, total_30_days, commission, total_invoiced)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await this.executeRaw<Payment>(query, [
      payment.weekLabel,
      payment.companyName,
      payment.total7Days,
      payment.total30Days,
      payment.commission,
      payment.totalInvoiced
    ]);
    return result[0];
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const query = `
      UPDATE "${this.tenantId}".payments 
      SET week_label = COALESCE($2, week_label),
          company_name = COALESCE($3, company_name),
          total_7_days = COALESCE($4, total_7_days),
          total_30_days = COALESCE($5, total_30_days),
          commission = COALESCE($6, commission),
          total_invoiced = COALESCE($7, total_invoiced)
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.executeRaw<Payment>(query, [
      id,
      payment.weekLabel,
      payment.companyName,
      payment.total7Days,
      payment.total30Days,
      payment.commission,
      payment.totalInvoiced
    ]);
    return result[0];
  }

  async deletePayment(id: number): Promise<void> {
    const query = `DELETE FROM "${this.tenantId}".payments WHERE id = $1`;
    await this.executeRaw(query, [id]);
  }

  // Payment history methods
  async getPaymentHistory(): Promise<PaymentHistoryRecord[]> {
    const query = `SELECT * FROM "${this.tenantId}".payment_history ORDER BY created_at DESC`;
    return await this.executeRaw<PaymentHistoryRecord>(query);
  }

  async createPaymentHistory(history: InsertPaymentHistory): Promise<PaymentHistoryRecord> {
    const query = `
      INSERT INTO "${this.tenantId}".payment_history (payment_id, action, previous_data)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.executeRaw<PaymentHistoryRecord>(query, [
      history.paymentId,
      history.action,
      history.previousData ? JSON.stringify(history.previousData) : null
    ]);
    return result[0];
  }

  async deletePaymentHistory(id: number): Promise<void> {
    const query = `DELETE FROM "${this.tenantId}".payment_history WHERE id = $1`;
    await this.executeRaw(query, [id]);
  }

  // Transport orders methods
  async getAllTransportOrders(): Promise<TransportOrder[]> {
    const query = `SELECT * FROM "${this.tenantId}".transport_orders ORDER BY id`;
    const result = await this.executeRaw<TransportOrder>(query);
    console.log(`🔍 TenantStorageFixed.getAllTransportOrders: ${result.length} records from ${this.tenantId}`);
    return result;
  }

  async createTransportOrder(order: InsertTransportOrder): Promise<TransportOrder> {
    const query = `
      INSERT INTO "${this.tenantId}".transport_orders (order_number, company_id, week_label, total_amount, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.executeRaw<TransportOrder>(query, [
      order.orderNumber,
      order.companyId,
      order.weekLabel,
      order.totalAmount,
      order.status || 'pending'
    ]);
    return result[0];
  }

  async updateTransportOrder(id: number, order: Partial<InsertTransportOrder>): Promise<TransportOrder> {
    const query = `
      UPDATE "${this.tenantId}".transport_orders 
      SET order_number = COALESCE($2, order_number),
          company_id = COALESCE($3, company_id),
          week_label = COALESCE($4, week_label),
          total_amount = COALESCE($5, total_amount),
          status = COALESCE($6, status)
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.executeRaw<TransportOrder>(query, [
      id,
      order.orderNumber,
      order.companyId,
      order.weekLabel,
      order.totalAmount,
      order.status
    ]);
    return result[0];
  }

  async deleteTransportOrder(id: number): Promise<void> {
    const query = `DELETE FROM "${this.tenantId}".transport_orders WHERE id = $1`;
    await this.executeRaw(query, [id]);
  }

  // Historical trips methods
  async getHistoricalTripsByVRID(vrid: string): Promise<HistoricalTrip[]> {
    const query = `SELECT * FROM "${this.tenantId}".historical_trips WHERE vrid = $1`;
    return await this.executeRaw<HistoricalTrip>(query, [vrid]);
  }

  async createHistoricalTrip(trip: InsertHistoricalTrip): Promise<HistoricalTrip> {
    const query = `
      INSERT INTO "${this.tenantId}".historical_trips (vrid, trip_date, amount, driver_name, company_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.executeRaw<HistoricalTrip>(query, [
      trip.vrid,
      trip.tripDate,
      trip.amount,
      trip.driverName,
      trip.companyName
    ]);
    return result[0];
  }

  // Order sequence methods
  async getOrderSequence(): Promise<OrderSequence | undefined> {
    const query = `SELECT * FROM "${this.tenantId}".order_sequence LIMIT 1`;
    const result = await this.executeRaw<OrderSequence>(query);
    return result[0];
  }

  async updateOrderSequence(lastOrderNumber: number): Promise<OrderSequence> {
    const query = `
      UPDATE "${this.tenantId}".order_sequence 
      SET last_order_number = $1, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await this.executeRaw<OrderSequence>(query, [lastOrderNumber]);
    return result[0];
  }

  async createOrderSequence(sequence: InsertOrderSequence): Promise<OrderSequence> {
    const query = `
      INSERT INTO "${this.tenantId}".order_sequence (last_order_number)
      VALUES ($1)
      RETURNING *
    `;
    const result = await this.executeRaw<OrderSequence>(query, [sequence.lastOrderNumber]);
    return result[0];
  }

  // Company balances methods
  async getAllCompanyBalances(): Promise<CompanyBalance[]> {
    const query = `SELECT * FROM "${this.tenantId}".company_balances ORDER BY id`;
    const result = await this.executeRaw<CompanyBalance>(query);
    console.log(`🔍 TenantStorageFixed.getAllCompanyBalances: ${result.length} records from ${this.tenantId}`);
    return result;
  }

  async createCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance> {
    const query = `
      INSERT INTO "${this.tenantId}".company_balances (company_name, week_label, total_invoiced, amount_paid, outstanding_balance, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await this.executeRaw<CompanyBalance>(query, [
      balance.companyName,
      balance.weekLabel,
      balance.totalInvoiced,
      balance.amountPaid || 0,
      balance.outstandingBalance,
      balance.status || 'pending'
    ]);
    return result[0];
  }

  async updateCompanyBalance(id: number, balance: Partial<InsertCompanyBalance>): Promise<CompanyBalance> {
    const query = `
      UPDATE "${this.tenantId}".company_balances 
      SET company_name = COALESCE($2, company_name),
          week_label = COALESCE($3, week_label),
          total_invoiced = COALESCE($4, total_invoiced),
          amount_paid = COALESCE($5, amount_paid),
          outstanding_balance = COALESCE($6, outstanding_balance),
          status = COALESCE($7, status)
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.executeRaw<CompanyBalance>(query, [
      id,
      balance.companyName,
      balance.weekLabel,
      balance.totalInvoiced,
      balance.amountPaid,
      balance.outstandingBalance,
      balance.status
    ]);
    return result[0];
  }

  async deleteCompanyBalance(id: number): Promise<void> {
    const query = `DELETE FROM "${this.tenantId}".company_balances WHERE id = $1`;
    await this.executeRaw(query, [id]);
  }

  // Close connection method
  async close(): Promise<void> {
    await this.pool.end();
    console.log(`🔌 TenantStorageFixed connection closed for: ${this.tenantId}`);
  }
}