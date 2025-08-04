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
    console.log(`🔍 CONSTRUCTOR: TenantStorageSimple called with tenantId:`, tenantId, `(type: ${typeof tenantId})`);
    this.tenantId = String(tenantId); // Ensure it's always a string
    
    // Conexiune simplă PostgreSQL
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(this.pool, { schema });
    
    console.log(`🔗 TenantStorageSimple initialized for: ${this.tenantId}`);
  }

  private extractRows(result: any): any[] {
    return (result as any).rows || [];
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
    
    const companies = this.extractRows(result);
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
    const companies = this.extractRows(result);
    return companies[0] || undefined;
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
      const companies = this.extractRows(result);
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
    const setParts = [];
    const values = [];
    
    if (company.name !== undefined) {
      setParts.push('name = $' + (values.length + 1));
      values.push(company.name);
    }
    if (company.commissionRate !== undefined) {
      setParts.push('commission_rate = $' + (values.length + 1));
      values.push(company.commissionRate);
    }
    if (company.cif !== undefined) {
      setParts.push('cif = $' + (values.length + 1));
      values.push(company.cif);
    }
    if (company.tradeRegisterNumber !== undefined) {
      setParts.push('trade_register_number = $' + (values.length + 1));
      values.push(company.tradeRegisterNumber);
    }
    if (company.address !== undefined) {
      setParts.push('address = $' + (values.length + 1));
      values.push(company.address);
    }
    if (company.location !== undefined) {
      setParts.push('location = $' + (values.length + 1));
      values.push(company.location);
    }
    if (company.county !== undefined) {
      setParts.push('county = $' + (values.length + 1));
      values.push(company.county);
    }
    if (company.country !== undefined) {
      setParts.push('country = $' + (values.length + 1));
      values.push(company.country);
    }
    if (company.contact !== undefined) {
      setParts.push('contact = $' + (values.length + 1));
      values.push(company.contact);
    }
    if (company.isMainCompany !== undefined) {
      setParts.push('is_main_company = $' + (values.length + 1));
      values.push(company.isMainCompany);
    }
    
    if (setParts.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE "${this.tenantId}".companies SET ${setParts.join(', ')} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);
    
    const result = await this.pool.query(query, values);
    return result.rows[0] as Company;
  }

  async deleteCompany(id: number): Promise<void> {
    console.log(`🗑️ DIRECT SQL DELETE: Deleting company ID ${id} from tenant schema`);
    
    try {
      // Folosește query direct fără sql.identifier pentru a evita [object Object]
      const query = `DELETE FROM "${this.tenantId}".companies WHERE id = $1 RETURNING id, name`;
      const result = await this.pool.query(query, [id]);
      
      if (result.rowCount === 0) {
        throw new Error(`Company with ID ${id} not found`);
      }
      
      console.log(`✅ Successfully deleted company ${id} from ${this.tenantId}:`, result.rows[0]);
    } catch (error) {
      console.error(`❌ Error deleting company ${id} from ${this.tenantId}:`, error);
      throw new Error(`Failed to delete company: ${(error as any).message}`);
    }
  }

  // Driver methods cu SQL direct
  async getAllDrivers(): Promise<Driver[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.drivers ORDER BY id`
    );
    
    const drivers = this.extractRows(result);
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
    const drivers = this.extractRows(result);
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
    const drivers = this.extractRows(result);
    return drivers[0] as Driver;
  }

  async updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver> {
    const setParts = [];
    const values = [];
    
    if (driver.name !== undefined) {
      setParts.push('name = $' + (values.length + 1));
      values.push(driver.name);
    }
    if (driver.companyId !== undefined) {
      setParts.push('company_id = $' + (values.length + 1));
      values.push(driver.companyId);
    }
    if (driver.nameVariants !== undefined) {
      setParts.push('name_variants = $' + (values.length + 1));
      values.push(driver.nameVariants);
    }
    if (driver.phone !== undefined) {
      setParts.push('phone = $' + (values.length + 1));
      values.push(driver.phone);
    }
    if (driver.email !== undefined) {
      setParts.push('email = $' + (values.length + 1));
      values.push(driver.email);
    }
    
    if (setParts.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE "${this.tenantId}".drivers SET ${setParts.join(', ')} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);
    
    console.log('🔍 UPDATE QUERY:', query);
    console.log('🔍 UPDATE VALUES:', values);
    
    const result = await this.pool.query(query, values);
    return result.rows[0] as Driver;
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
    const results = this.extractRows(result);
    return results[0] || undefined;
  }

  async getWeeklyProcessingByWeek(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    return await this.getWeeklyProcessing(weekLabel);
  }

  async getAllWeeklyProcessing(): Promise<WeeklyProcessing[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.weekly_processing ORDER BY processing_date DESC`
    );
    
    const processing = this.extractRows(result);
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
    const results = this.extractRows(result);
    return results[0] as WeeklyProcessing;
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
    const results = this.extractRows(result);
    return results[0] as WeeklyProcessing;
  }

  // Restul metodelor implementate similar cu SQL direct și sql.identifier()

  // Payment methods
  async getPaymentsByWeek(weekLabel: string): Promise<Payment[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.payments WHERE week_label = ${weekLabel}`
    );
    return this.extractRows(result);
  }

  async getAllPayments(): Promise<Payment[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.payments ORDER BY id`
    );
    const payments = this.extractRows(result);
    console.log(`🔍 TenantStorageSimple.getAllPayments: ${payments.length} records from ${this.tenantId}`);
    return payments;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.payments 
        (week_label, company_name, amount, description, payment_type)
        VALUES (
          ${payment.weekLabel},
          ${payment.companyName},
          ${payment.amount},
          ${payment.description || null},
          ${payment.paymentType || 'partial'}
        )
        RETURNING *
      `
    );
    const payments = this.extractRows(result);
    return payments[0] as Payment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.payments 
        SET 
          week_label = COALESCE(${payment.weekLabel}, week_label),
          company_name = COALESCE(${payment.companyName}, company_name),
          amount = COALESCE(${payment.amount}, amount),
          description = COALESCE(${payment.description}, description),
          payment_type = COALESCE(${payment.paymentType}, payment_type)
        WHERE id = ${id}
        RETURNING *
      `
    );
    const payments = this.extractRows(result);
    return payments[0] as Payment;
  }

  async deletePayment(id: number): Promise<void> {
    await this.db.execute(
      sql`DELETE FROM ${sql.identifier(this.tenantId)}.payments WHERE id = ${id}`
    );
  }

  // Payment history methods
  async getPaymentHistory(paymentId?: number): Promise<PaymentHistoryRecord[]> {
    let result;
    if (paymentId) {
      result = await this.db.execute(
        sql`SELECT * FROM ${sql.identifier(this.tenantId)}.payment_history WHERE payment_id = ${paymentId} ORDER BY created_at DESC`
      );
    } else {
      result = await this.db.execute(
        sql`SELECT * FROM ${sql.identifier(this.tenantId)}.payment_history ORDER BY created_at DESC`
      );
    }
    return this.extractRows(result);
  }

  async createPaymentHistory(history: InsertPaymentHistory): Promise<PaymentHistoryRecord> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.payment_history 
        (payment_id, action, previous_data, created_at)
        VALUES (
          ${history.paymentId || null},
          ${history.action},
          ${history.previousData ? JSON.stringify(history.previousData) : null},
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `
    );
    const records = this.extractRows(result);
    return records[0] as PaymentHistoryRecord;
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
    
    const orders = this.extractRows(result);
    console.log(`🔍 TenantStorageSimple.getAllTransportOrders: ${orders.length} records from ${this.tenantId}`);
    return orders;
  }

  async createTransportOrder(order: InsertTransportOrder): Promise<TransportOrder> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.transport_orders 
        (order_number, company_name, order_date, week_label, vrids, total_amount, route, status)
        VALUES (
          ${order.orderNumber},
          ${order.companyName},
          ${order.orderDate},
          ${order.weekLabel},
          ${order.vrids ? JSON.stringify(order.vrids) : null},
          ${order.totalAmount},
          ${order.route || 'DE-BE-NL'},
          ${order.status || 'draft'}
        )
        RETURNING *
      `
    );
    const orders = this.extractRows(result);
    return orders[0] as TransportOrder;
  }

  async getTransportOrdersByWeek(weekLabel: string): Promise<TransportOrder[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.transport_orders WHERE week_label = ${weekLabel}`
    );
    return this.extractRows(result);
  }

  async getTransportOrdersByCompany(companyName: string): Promise<TransportOrder[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.transport_orders WHERE company_name = ${companyName}`
    );
    return this.extractRows(result);
  }

  async updateTransportOrder(id: number, order: Partial<InsertTransportOrder>): Promise<TransportOrder> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.transport_orders 
        SET 
          order_number = COALESCE(${order.orderNumber}, order_number),
          company_name = COALESCE(${order.companyName}, company_name),
          week_label = COALESCE(${order.weekLabel}, week_label),
          total_amount = COALESCE(${order.totalAmount}, total_amount),
          status = COALESCE(${order.status}, status)
        WHERE id = ${id}
        RETURNING *
      `
    );
    const orders = this.extractRows(result);
    return orders[0] as TransportOrder;
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
    return this.extractRows(result);
  }

  async createHistoricalTrip(trip: InsertHistoricalTrip): Promise<HistoricalTrip> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.historical_trips 
        (vrid, driver_name, week_label, trip_date, route, raw_trip_data)
        VALUES (
          ${trip.vrid},
          ${trip.driverName || null},
          ${trip.weekLabel},
          ${trip.tripDate || null},
          ${trip.route || null},
          ${trip.rawTripData ? JSON.stringify(trip.rawTripData) : null}
        )
        RETURNING *
      `
    );
    const trips = this.extractRows(result);
    return trips[0] as HistoricalTrip;
  }

  // Order sequence methods
  async getOrderSequence(): Promise<OrderSequence | undefined> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.order_sequence LIMIT 1`
    );
    const sequences = this.extractRows(result);
    return sequences[0] || undefined;
  }

  async updateOrderSequence(currentNumber: number): Promise<OrderSequence> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.order_sequence 
        SET current_number = ${currentNumber}, last_updated = CURRENT_TIMESTAMP
        RETURNING *
      `
    );
    const sequences = this.extractRows(result);
    return sequences[0] as OrderSequence;
  }

  async createOrderSequence(sequence: InsertOrderSequence): Promise<OrderSequence> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.order_sequence 
        (current_number, last_updated)
        VALUES (${sequence.currentNumber || 1554}, CURRENT_TIMESTAMP)
        RETURNING *
      `
    );
    const sequences = this.extractRows(result);
    return sequences[0] as OrderSequence;
  }

  // Company balances methods
  async getAllCompanyBalances(): Promise<CompanyBalance[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.company_balances ORDER BY id`
    );
    
    const balances = this.extractRows(result);
    console.log(`🔍 TenantStorageSimple.getAllCompanyBalances: ${balances.length} records from ${this.tenantId}`);
    return balances;
  }

  async createCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance> {
    const result = await this.db.execute(
      sql`
        INSERT INTO ${sql.identifier(this.tenantId)}.company_balances 
        (company_name, week_label, total_invoiced, total_paid, outstanding_balance, payment_status)
        VALUES (
          ${balance.companyName},
          ${balance.weekLabel},
          ${balance.totalInvoiced},
          ${balance.totalPaid || 0},
          ${balance.outstandingBalance},
          ${balance.paymentStatus || 'pending'}
        )
        RETURNING *
      `
    );
    const balances = this.extractRows(result);
    return balances[0] as CompanyBalance;
  }

  async updateCompanyBalance(id: number, balance: Partial<InsertCompanyBalance>): Promise<CompanyBalance> {
    const result = await this.db.execute(
      sql`
        UPDATE ${sql.identifier(this.tenantId)}.company_balances 
        SET 
          company_name = COALESCE(${balance.companyName}, company_name),
          week_label = COALESCE(${balance.weekLabel}, week_label),
          total_invoiced = COALESCE(${balance.totalInvoiced}, total_invoiced),
          total_paid = COALESCE(${balance.totalPaid}, total_paid),
          outstanding_balance = COALESCE(${balance.outstandingBalance}, outstanding_balance),
          payment_status = COALESCE(${balance.paymentStatus}, payment_status)
        WHERE id = ${id}
        RETURNING *
      `
    );
    const balances = this.extractRows(result);
    return balances[0] as CompanyBalance;
  }

  async deleteCompanyBalance(id: number): Promise<void> {
    await this.db.execute(
      sql`DELETE FROM ${sql.identifier(this.tenantId)}.company_balances WHERE id = ${id}`
    );
  }

  // Missing interface methods that need to be implemented
  async createPaymentHistoryRecord(record: InsertPaymentHistory): Promise<PaymentHistoryRecord> {
    return await this.createPaymentHistory(record);
  }

  async getHistoricalTripByVrid(vrid: string): Promise<HistoricalTrip | undefined> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.historical_trips WHERE vrid = ${vrid} LIMIT 1`
    );
    const trips = this.extractRows(result);
    return trips[0] || undefined;
  }

  async getHistoricalTripsByWeek(weekLabel: string): Promise<HistoricalTrip[]> {
    const result = await this.db.execute(
      sql`SELECT * FROM ${sql.identifier(this.tenantId)}.historical_trips WHERE week_label = ${weekLabel}`
    );
    return this.extractRows(result);
  }

  async searchHistoricalTripsByVrids(vrids: string[]): Promise<HistoricalTrip[]> {
    if (vrids.length === 0) return [];
    
    const placeholders = vrids.map((_, i) => `$${i + 1}`).join(',');
    const query = `SELECT * FROM "${this.tenantId}".historical_trips WHERE vrid = ANY(ARRAY[${placeholders}])`;
    const result = await this.pool.query(query, vrids);
    return result.rows;
  }

  async saveWeeklyDataWithHistory(
    weekLabel: string, 
    tripData: any[], 
    invoice7Data: any[], 
    invoice30Data: any[], 
    processedData: any
  ): Promise<WeeklyProcessing> {
    // Save the weekly processing data
    const weeklyData: InsertWeeklyProcessing = {
      weekLabel,
      tripDataCount: tripData.length,
      invoice7Count: invoice7Data.length,
      invoice30Count: invoice30Data.length,
      processedData,
      tripData,
      invoice7Data,
      invoice30Data
    };
    
    const existingRecord = await this.getWeeklyProcessing(weekLabel);
    if (existingRecord) {
      return await this.updateWeeklyProcessing(weekLabel, weeklyData);
    } else {
      return await this.createWeeklyProcessing(weeklyData);
    }
  }

  async getNextOrderNumber(): Promise<number> {
    const result = await this.db.execute(
      sql`SELECT current_number FROM ${sql.identifier(this.tenantId)}.order_sequence LIMIT 1`
    );
    const sequences = this.extractRows(result);
    
    if (sequences.length === 0) {
      await this.initializeOrderSequence();
      return 1554; // Starting number
    }
    
    const nextNumber = (sequences[0].current_number || 0) + 1;
    
    // Update the sequence
    await this.db.execute(
      sql`UPDATE ${sql.identifier(this.tenantId)}.order_sequence SET current_number = ${nextNumber}`
    );
    
    return nextNumber;
  }

  async initializeOrderSequence(): Promise<void> {
    try {
      await this.db.execute(
        sql`INSERT INTO ${sql.identifier(this.tenantId)}.order_sequence (current_number) VALUES (1554)`
      );
    } catch (error) {
      // Sequence might already exist, that's OK
      console.log('Order sequence already initialized or error:', error);
    }
  }

  // Close connection method
  async close(): Promise<void> {
    await this.pool.end();
    console.log(`🔌 TenantStorageSimple connection closed for: ${this.tenantId}`);
  }
}