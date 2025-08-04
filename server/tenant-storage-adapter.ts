/**
 * 🔒 TENANT STORAGE ADAPTER - Conectare directă la schema PostgreSQL separată
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
 * Storage adapter pentru tenant-i cu schema PostgreSQL separată
 */
export class TenantStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    
    // Creează conexiunea cu search_path setat DOAR pe schema tenant-ului (nu fallback la public)
    const connectionString = process.env.DATABASE_URL;
    this.pool = new Pool({ 
      connectionString,
      statement_timeout: 30000,
      query_timeout: 30000
    });
    
    // Setează search_path după conectare pentru a folosi DOAR schema tenant-ului
    this.db = drizzle(this.pool, { 
      schema,
      logger: false
    });
    
    console.log(`🔗 TenantStorage initialized for schema: ${tenantId}`);
    
    // Execută setarea schema path imediat
    this.setSchemaPath();
  }

  private async setSchemaPath() {
    try {
      // Set search_path for this connection permanently
      await this.db.execute(sql`SET search_path TO ${sql.identifier(this.tenantId)}, public`);
      console.log(`🔗 Schema path set to: ${this.tenantId}`);
    } catch (error) {
      console.error(`❌ Failed to set schema path to ${this.tenantId}:`, error);
    }
  }

  private async executeWithSchemaPath<T>(operation: () => Promise<T>): Promise<T> {
    // Ensure schema path is set before every operation
    await this.db.execute(sql`SET search_path TO ${sql.identifier(this.tenantId)}`);
    return await operation();
  }

  // User methods (doar pentru validări - tenant-ii nu gestionează utilizatori)
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

  // Username reservation methods (nu sunt necesare pentru tenant-i)
  async reserveUsername(username: string, email: string): Promise<string> {
    throw new Error('Tenant storage does not manage username reservations');
  }

  async validateReservation(username: string, token: string): Promise<boolean> {
    throw new Error('Tenant storage does not manage username reservations');
  }

  async releaseReservation(username: string): Promise<void> {
    throw new Error('Tenant storage does not manage username reservations');
  }

  // Company methods
  async getAllCompanies(): Promise<Company[]> {
    return await this.executeWithSchemaPath(async () => {
      return await this.db.select().from(schema.companies);
    });
  }

  async getCompaniesByTenant(tenantId: string): Promise<Company[]> {
    return await this.getAllCompanies(); // În schema tenant, toate companiile aparțin tenant-ului
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const [company] = await this.db.select().from(schema.companies).where(eq(schema.companies.name, name));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await this.db.insert(schema.companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updated] = await this.db.update(schema.companies).set(company).where(eq(schema.companies.id, id)).returning();
    return updated;
  }

  async deleteCompany(id: number): Promise<void> {
    await this.db.delete(schema.companies).where(eq(schema.companies.id, id));
  }

  // Driver methods
  async getAllDrivers(): Promise<Driver[]> {
    return await this.executeWithSchemaPath(async () => {
      return await this.db.select().from(schema.drivers);
    });
  }

  async getDriversByTenant(tenantId: string): Promise<Driver[]> {
    return await this.getAllDrivers(); // În schema tenant, toți șoferii aparțin tenant-ului
  }

  async getDriversByCompany(companyId: number): Promise<Driver[]> {
    return await this.db.select().from(schema.drivers).where(eq(schema.drivers.companyId, companyId));
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await this.db.insert(schema.drivers).values(driver).returning();
    return newDriver;
  }

  async updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver> {
    const [updated] = await this.db.update(schema.drivers).set(driver).where(eq(schema.drivers.id, id)).returning();
    return updated;
  }

  async deleteDriver(id: number): Promise<void> {
    await this.db.delete(schema.drivers).where(eq(schema.drivers.id, id));
  }

  // Weekly processing methods
  async getWeeklyProcessing(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    const [processing] = await this.db.select().from(schema.weeklyProcessing).where(eq(schema.weeklyProcessing.weekLabel, weekLabel));
    return processing;
  }

  async getWeeklyProcessingByWeek(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    return await this.getWeeklyProcessing(weekLabel);
  }

  async getAllWeeklyProcessing(): Promise<WeeklyProcessing[]> {
    return await this.executeWithSchemaPath(async () => {
      return await this.db.select().from(schema.weeklyProcessing).orderBy(desc(schema.weeklyProcessing.processingDate));
    });
  }

  async createWeeklyProcessing(processing: InsertWeeklyProcessing): Promise<WeeklyProcessing> {
    const [newProcessing] = await this.db.insert(schema.weeklyProcessing).values(processing).returning();
    return newProcessing;
  }

  async updateWeeklyProcessing(weekLabel: string, data: Partial<InsertWeeklyProcessing>): Promise<WeeklyProcessing> {
    const [updated] = await this.db.update(schema.weeklyProcessing).set(data).where(eq(schema.weeklyProcessing.weekLabel, weekLabel)).returning();
    return updated;
  }

  // Pentru metodele rămase, implementez stubs simple
  async getPaymentsByWeek(weekLabel: string): Promise<Payment[]> {
    return await this.db.select().from(schema.payments).where(eq(schema.payments.weekLabel, weekLabel));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await this.db.select().from(schema.payments);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await this.db.insert(schema.payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await this.db.update(schema.payments).set(payment).where(eq(schema.payments.id, id)).returning();
    return updated;
  }

  async deletePayment(id: number): Promise<void> {
    await this.db.delete(schema.payments).where(eq(schema.payments.id, id));
  }

  // Payment history methods
  async getPaymentHistory(): Promise<PaymentHistoryRecord[]> {
    return await this.db.select().from(schema.paymentHistory);
  }

  async createPaymentHistory(history: InsertPaymentHistory): Promise<PaymentHistoryRecord> {
    const [newHistory] = await this.db.insert(schema.paymentHistory).values(history).returning();
    return newHistory;
  }

  async deletePaymentHistory(id: number): Promise<void> {
    await this.db.delete(schema.paymentHistory).where(eq(schema.paymentHistory.id, id));
  }

  // Transport orders methods
  async getAllTransportOrders(): Promise<TransportOrder[]> {
    return await this.executeWithSchemaPath(async () => {
      return await this.db.select().from(schema.transportOrders);
    });
  }

  async createTransportOrder(order: InsertTransportOrder): Promise<TransportOrder> {
    const [newOrder] = await this.db.insert(schema.transportOrders).values(order).returning();
    return newOrder;
  }

  async updateTransportOrder(id: number, order: Partial<InsertTransportOrder>): Promise<TransportOrder> {
    const [updated] = await this.db.update(schema.transportOrders).set(order).where(eq(schema.transportOrders.id, id)).returning();
    return updated;
  }

  async deleteTransportOrder(id: number): Promise<void> {
    await this.db.delete(schema.transportOrders).where(eq(schema.transportOrders.id, id));
  }

  // Historical trips methods
  async getHistoricalTripsByVRID(vrid: string): Promise<HistoricalTrip[]> {
    return await this.db.select().from(schema.historicalTrips).where(eq(schema.historicalTrips.vrid, vrid));
  }

  async createHistoricalTrip(trip: InsertHistoricalTrip): Promise<HistoricalTrip> {
    const [newTrip] = await this.db.insert(schema.historicalTrips).values(trip).returning();
    return newTrip;
  }

  // Order sequence methods
  async getOrderSequence(): Promise<OrderSequence | undefined> {
    const [sequence] = await this.db.select().from(schema.orderSequence);
    return sequence;
  }

  async updateOrderSequence(lastOrderNumber: number): Promise<OrderSequence> {
    const [updated] = await this.db.update(schema.orderSequence).set({ lastOrderNumber }).returning();
    return updated;
  }

  async createOrderSequence(sequence: InsertOrderSequence): Promise<OrderSequence> {
    const [newSequence] = await this.db.insert(schema.orderSequence).values(sequence).returning();
    return newSequence;
  }

  // Company balances methods
  async getAllCompanyBalances(): Promise<CompanyBalance[]> {
    return await this.executeWithSchemaPath(async () => {
      return await this.db.select().from(schema.companyBalances);
    });
  }

  async createCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance> {
    const [newBalance] = await this.db.insert(schema.companyBalances).values(balance).returning();
    return newBalance;
  }

  async updateCompanyBalance(id: number, balance: Partial<InsertCompanyBalance>): Promise<CompanyBalance> {
    const [updated] = await this.db.update(schema.companyBalances).set(balance).where(eq(schema.companyBalances.id, id)).returning();
    return updated;
  }

  async deleteCompanyBalance(id: number): Promise<void> {
    await this.db.delete(schema.companyBalances).where(eq(schema.companyBalances.id, id));
  }

  // Close connection method
  async close(): Promise<void> {
    await this.pool.end();
    console.log(`🔌 TenantStorage connection closed for: ${this.tenantId}`);
  }
}