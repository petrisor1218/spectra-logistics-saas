import { 
  users, 
  companies, 
  drivers, 
  weeklyProcessing, 
  payments, 
  paymentHistory,
  historicalTrips,
  orderSequence,
  companyBalances,
  usernameReservations,
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
  transportOrders,
  type TransportOrder,
  type InsertTransportOrder,
  type HistoricalTrip,
  type InsertHistoricalTrip,
  type OrderSequence,
  type InsertOrderSequence,
  type CompanyBalance,
  type InsertCompanyBalance,
  type UsernameReservation,
  type InsertUsernameReservation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Username reservation methods (to prevent race conditions)
  reserveUsername(username: string, email: string): Promise<string>; // Returns reservation token
  validateReservation(username: string, token: string): Promise<boolean>;
  releaseReservation(username: string): Promise<void>;
  
  // Company methods
  getAllCompanies(): Promise<Company[]>;
  getCompaniesByTenant(tenantId: string): Promise<Company[]>;
  getCompanyByName(name: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  
  // Driver methods
  getAllDrivers(): Promise<Driver[]>;
  getDriversByTenant(tenantId: string): Promise<Driver[]>;
  getDriversByCompany(companyId: number): Promise<Driver[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver>;
  deleteDriver(id: number): Promise<void>;
  
  // Weekly processing methods
  getWeeklyProcessing(weekLabel: string): Promise<WeeklyProcessing | undefined>;
  getWeeklyProcessingByWeek(weekLabel: string): Promise<WeeklyProcessing | undefined>;
  getAllWeeklyProcessing(): Promise<WeeklyProcessing[]>;
  createWeeklyProcessing(processing: InsertWeeklyProcessing): Promise<WeeklyProcessing>;
  updateWeeklyProcessing(weekLabel: string, data: Partial<InsertWeeklyProcessing>): Promise<WeeklyProcessing>;
  
  // Payment methods
  getPaymentsByWeek(weekLabel: string): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: number): Promise<void>;
  
  // Payment history methods
  getPaymentHistory(paymentId?: number): Promise<PaymentHistoryRecord[]>;
  createPaymentHistoryRecord(record: InsertPaymentHistory): Promise<PaymentHistoryRecord>;

  // Transport orders
  createTransportOrder(order: InsertTransportOrder): Promise<TransportOrder>;
  getAllTransportOrders(): Promise<TransportOrder[]>;
  getTransportOrdersByWeek(weekLabel: string): Promise<TransportOrder[]>;
  getTransportOrdersByCompany(companyName: string): Promise<TransportOrder[]>;
  updateTransportOrder(id: number, updates: Partial<InsertTransportOrder>): Promise<TransportOrder>;
  deleteTransportOrder(id: number): Promise<void>;
  
  // Historical trips methods
  createHistoricalTrip(trip: InsertHistoricalTrip): Promise<HistoricalTrip>;
  getHistoricalTripByVrid(vrid: string): Promise<HistoricalTrip | undefined>;
  getHistoricalTripsByWeek(weekLabel: string): Promise<HistoricalTrip[]>;
  searchHistoricalTripsByVrids(vrids: string[]): Promise<HistoricalTrip[]>;
  
  // Enhanced weekly processing with historical data
  saveWeeklyDataWithHistory(
    weekLabel: string, 
    tripData: any[], 
    invoice7Data: any[], 
    invoice30Data: any[], 
    processedData: any
  ): Promise<WeeklyProcessing>;
  
  // Order numbering methods
  getNextOrderNumber(): Promise<number>;
  initializeOrderSequence(): Promise<void>;
  
  // Company balance methods
  getCompanyBalances(): Promise<CompanyBalance[]>;
  getAllCompanyBalances(): Promise<CompanyBalance[]>;
  getCompanyBalanceByWeek(companyName: string, weekLabel: string): Promise<CompanyBalance | undefined>;
  createCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance>;
  createOrUpdateCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance>;
  updateCompanyBalancePayment(companyName: string, weekLabel: string, paidAmount: number): Promise<CompanyBalance>;
  generateCompanyBalancesFromCalendarData(): Promise<CompanyBalance[]>;
}

export class DatabaseStorage implements IStorage {
  private dbInstance: any;

  constructor(dbInstance?: any) {
    // Dacă primim o instanță de DB (pentru tenant), o folosim
    // Altfel folosim baza principală (pentru operațiuni de autentificare)
    this.dbInstance = dbInstance || db;
  }

  // Obține baza de date pentru această instanță
  private getDb() {
    return this.dbInstance;
  }

  // Obține baza de date principală pentru autentificare (când nu avem tenant setat)
  private getMainDb() {
    return db;
  }

  // User methods - folosesc baza de date principală

  // Username reservation methods to prevent race conditions
  async reserveUsername(username: string, email: string): Promise<string> {
    const dbConn = this.getDb();
    // Clean up expired reservations first
    await dbConn.delete(usernameReservations).where(sql`expires_at < NOW()`);
    
    // Check if username or email already exists in main users table
    const [existingUser, existingEmailUser] = await Promise.all([
      this.getUserByUsername(username),
      this.getUserByEmail(email)
    ]);

    if (existingUser) {
      throw new Error('Username already exists');
    }

    if (existingEmailUser) {
      throw new Error('Email already exists');
    }
    
    // Generate a simple token (timestamp-based)
    const token = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    try {
      await dbConn.insert(usernameReservations).values({
        username,
        email,
        expiresAt,
      });
      return token;
    } catch (error) {
      // If username is already reserved, throw error
      throw new Error('Username already reserved');
    }
  }

  async validateReservation(username: string, token: string): Promise<boolean> {
    const dbConn = this.getDb();
    // Clean up expired reservations
    await dbConn.delete(usernameReservations).where(sql`expires_at < NOW()`);
    
    const [reservation] = await dbConn
      .select()
      .from(usernameReservations)
      .where(eq(usernameReservations.username, username));

    return !!reservation && new Date() < new Date(reservation.expiresAt);
  }

  async releaseReservation(username: string): Promise<void> {
    const dbConn = this.getDb();
    await dbConn.delete(usernameReservations).where(eq(usernameReservations.username, username));
  }

  // Company methods with tenant isolation
  async getAllCompanies(tenantId?: string): Promise<Company[]> {
    const dbConn = this.getDb();
    return await dbConn.select().from(companies);
  }

  async getCompaniesByTenant(tenantId: string): Promise<Company[]> {
    const dbConn = this.getDb();
    return await dbConn.select().from(companies);
  }

  async getCompanyByName(name: string, tenantId?: string): Promise<Company | undefined> {
    const dbConn = this.getDb();
    const [company] = await dbConn.select().from(companies).where(eq(companies.name, name));
    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const dbConn = this.getDb();
    const [company] = await dbConn
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company> {
    const dbConn = this.getDb();
    
    // Remove any timestamp fields that shouldn't be updated
    const { createdAt, ...cleanData } = companyData as any;
    
    const [company] = await dbConn
      .update(companies)
      .set(cleanData)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async addCompany(companyData: Partial<InsertCompany>): Promise<Company> {
    const dbConn = this.getDb();
    const [company] = await dbConn
      .insert(companies)
      .values(companyData)
      .returning();
    return company;
  }

  async deleteCompany(id: number): Promise<void> {
    const dbConn = this.getDb();
    // First delete all drivers for this company
    await dbConn.delete(drivers).where(eq(drivers.companyId, id));
    // Then delete the company
    await dbConn.delete(companies).where(eq(companies.id, id));
  }

  // Driver methods with tenant isolation
  async getAllDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
  }

  async getDriversByTenant(tenantId: string): Promise<Driver[]> {
    // Return all drivers for now (no tenant filtering until migration complete)
    return await db.select().from(drivers);
  }

  async getDriversByCompany(companyId: number): Promise<Driver[]> {
    return await db.select().from(drivers).where(eq(drivers.companyId, companyId));
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    // Check if driver already exists
    const existingDriver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.name, insertDriver.name))
      .limit(1);
    
    if (existingDriver.length > 0) {
      console.log('Driver already exists:', existingDriver[0]);
      return existingDriver[0];
    }

    const [driver] = await db
      .insert(drivers)
      .values(insertDriver)
      .returning();
    return driver;
  }

  async updateDriver(id: number, driverData: Partial<InsertDriver>): Promise<Driver> {
    const [driver] = await db
      .update(drivers)
      .set(driverData)
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async deleteDriver(id: number): Promise<void> {
    await db.delete(drivers).where(eq(drivers.id, id));
  }

  // Weekly processing methods with tenant isolation
  async getWeeklyProcessing(weekLabel: string, tenantId?: string): Promise<WeeklyProcessing | undefined> {
    // Return weekly processing without tenant filtering for now
    const [processing] = await db.select().from(weeklyProcessing).where(eq(weeklyProcessing.weekLabel, weekLabel));
    return processing || undefined;
  }

  async createWeeklyProcessing(insertProcessing: InsertWeeklyProcessing): Promise<WeeklyProcessing> {
    const dbConn = this.getDb();
    
    // PROFESSIONAL LOGIC: Prevent duplicate empty records
    const existingRecord = await dbConn
      .select()
      .from(weeklyProcessing)
      .where(eq(weeklyProcessing.weekLabel, insertProcessing.weekLabel))
      .limit(1);
    
    // If record exists and new data is empty, don't create duplicate
    if (existingRecord.length > 0) {
      const isEmpty = !insertProcessing.processedData || 
                     insertProcessing.processedData === null ||
                     JSON.stringify(insertProcessing.processedData) === '{}';
      
      if (isEmpty && 
          (!insertProcessing.tripDataCount || insertProcessing.tripDataCount === 0) &&
          (!insertProcessing.invoice7Count || insertProcessing.invoice7Count === 0) &&
          (!insertProcessing.invoice30Count || insertProcessing.invoice30Count === 0)) {
        
        console.log(`🛡️ DUPLICATE PREVENTION: Skipping empty record for week ${insertProcessing.weekLabel}`);
        return existingRecord[0];
      }
      
      // If new data has content, update existing record instead of creating duplicate
      console.log(`🔄 SMART UPDATE: Updating existing record for week ${insertProcessing.weekLabel}`);
      const [updated] = await dbConn
        .update(weeklyProcessing)
        .set(insertProcessing)
        .where(eq(weeklyProcessing.weekLabel, insertProcessing.weekLabel))
        .returning();
      return updated;
    }
    
    // Create new record only if none exists
    const [processing] = await dbConn
      .insert(weeklyProcessing)
      .values(insertProcessing)
      .returning();
    return processing;
  }

  async getWeeklyProcessingByWeek(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    const dbConn = this.getDb();
    const [processing] = await dbConn.select().from(weeklyProcessing).where(eq(weeklyProcessing.weekLabel, weekLabel));
    return processing || undefined;
  }

  async getAllWeeklyProcessing(tenantId?: string): Promise<WeeklyProcessing[]> {
    const dbConn = this.getDb();
    return await dbConn.select().from(weeklyProcessing).orderBy(desc(weeklyProcessing.processingDate));
  }

  async updateWeeklyProcessing(weekLabel: string, data: Partial<InsertWeeklyProcessing>): Promise<WeeklyProcessing> {
    const [processing] = await db
      .update(weeklyProcessing)
      .set(data)
      .where(eq(weeklyProcessing.weekLabel, weekLabel))
      .returning();
    return processing;
  }

  // Payment methods
  async getPaymentsByWeek(weekLabel: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.weekLabel, weekLabel)).orderBy(desc(payments.paymentDate));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.paymentDate));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(id: number, paymentData: Partial<InsertPayment>): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set(paymentData)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // Payment history methods
  async getPaymentHistory(paymentId?: number): Promise<PaymentHistoryRecord[]> {
    if (paymentId) {
      return await db.select().from(paymentHistory).where(eq(paymentHistory.paymentId, paymentId)).orderBy(desc(paymentHistory.createdAt));
    }
    return await db.select().from(paymentHistory).orderBy(desc(paymentHistory.createdAt));
  }

  async createPaymentHistoryRecord(insertRecord: InsertPaymentHistory): Promise<PaymentHistoryRecord> {
    const [record] = await db
      .insert(paymentHistory)
      .values(insertRecord)
      .returning();
    return record;
  }

  // Transport orders methods
  async createTransportOrder(order: InsertTransportOrder): Promise<TransportOrder> {
    const dbConn = this.getDb();
    // Create the order
    const [transportOrder] = await dbConn
      .insert(transportOrders)
      .values(order)
      .returning();
    
    // Increment the order sequence after successful creation
    await this.incrementOrderNumber();
    
    return transportOrder;
  }

  async getAllTransportOrders(): Promise<TransportOrder[]> {
    const dbConn = this.getDb();
    return await dbConn.select().from(transportOrders).orderBy(desc(transportOrders.createdAt));
  }

  async getTransportOrdersByWeek(weekLabel: string): Promise<TransportOrder[]> {
    const dbConn = this.getDb();
    return await dbConn.select().from(transportOrders).where(eq(transportOrders.weekLabel, weekLabel));
  }

  async getTransportOrdersByCompany(companyName: string): Promise<TransportOrder[]> {
    const dbConn = this.getDb();
    return await dbConn.select().from(transportOrders).where(eq(transportOrders.companyName, companyName));
  }

  async updateTransportOrder(id: number, updates: Partial<InsertTransportOrder>): Promise<TransportOrder> {
    const dbConn = this.getDb();
    const [transportOrder] = await dbConn
      .update(transportOrders)
      .set(updates)
      .where(eq(transportOrders.id, id))
      .returning();
    return transportOrder;
  }

  async deleteTransportOrder(id: number): Promise<void> {
    const dbConn = this.getDb();
    await dbConn.delete(transportOrders).where(eq(transportOrders.id, id));
  }

  // Historical trips methods
  async createHistoricalTrip(trip: InsertHistoricalTrip): Promise<HistoricalTrip> {
    const [historicalTrip] = await db
      .insert(historicalTrips)
      .values(trip)
      .returning();
    return historicalTrip;
  }

  async getHistoricalTripByVrid(vrid: string): Promise<HistoricalTrip | undefined> {
    const [trip] = await db.select().from(historicalTrips).where(eq(historicalTrips.vrid, vrid));
    return trip || undefined;
  }

  async getHistoricalTripsByWeek(weekLabel: string): Promise<HistoricalTrip[]> {
    return await db.select().from(historicalTrips).where(eq(historicalTrips.weekLabel, weekLabel));
  }

  async searchHistoricalTripsByVrids(vrids: string[]): Promise<HistoricalTrip[]> {
    if (vrids.length === 0) return [];
    
    const trips: HistoricalTrip[] = [];
    for (const vrid of vrids) {
      const trip = await this.getHistoricalTripByVrid(vrid);
      if (trip) trips.push(trip);
    }
    return trips;
  }

  // Enhanced weekly processing with historical data
  async saveWeeklyDataWithHistory(
    weekLabel: string, 
    tripData: any[], 
    invoice7Data: any[], 
    invoice30Data: any[], 
    processedData: any
  ): Promise<WeeklyProcessing> {
    // Save weekly processing data (without raw file content for now, until DB schema is updated)
    const weeklyData: InsertWeeklyProcessing = {
      weekLabel,
      tripDataCount: tripData.length,
      invoice7Count: invoice7Data.length,
      invoice30Count: invoice30Data.length,
      processedData
    };

    const [processing] = await db
      .insert(weeklyProcessing)
      .values(weeklyData)
      .onConflictDoUpdate({
        target: weeklyProcessing.weekLabel,
        set: {
          ...weeklyData,
          processingDate: new Date()
        }
      })
      .returning();

    // Save individual trip records to historical table
    for (const trip of tripData) {
      const vrid = trip['Trip ID'] || trip['VR ID'];
      const driverName = trip['Driver'];
      
      if (vrid) {
        try {
          await this.createHistoricalTrip({
            vrid,
            driverName: driverName || null,
            weekLabel,
            tripDate: trip['Trip Date'] ? new Date(trip['Trip Date']) : null,
            route: trip['Route'] || null,
            rawTripData: trip
          });
        } catch (error) {
          // Ignore duplicates - trip already exists for this VRID
          console.log(`VRID ${vrid} already exists in historical data`);
        }
      }
    }

    return processing;
  }

  // Order numbering methods
  async getNextOrderNumber(): Promise<number> {
    // Only get current number without incrementing (for preview)
    const [sequence] = await db.select().from(orderSequence).limit(1);
    
    if (!sequence) {
      // Initialize sequence if it doesn't exist
      await this.initializeOrderSequence();
      return 1554; // First number
    }
    
    return sequence.currentNumber;
  }

  async incrementOrderNumber(): Promise<number> {
    // Increment only when order is actually saved
    const [sequence] = await db.select().from(orderSequence).limit(1);
    
    if (!sequence) {
      await this.initializeOrderSequence();
      return 1554;
    }
    
    const nextNumber = sequence.currentNumber + 1;
    await db.update(orderSequence)
      .set({ 
        currentNumber: nextNumber,
        lastUpdated: new Date()
      })
      .where(eq(orderSequence.id, sequence.id));
    
    return nextNumber;
  }

  async initializeOrderSequence(): Promise<void> {
    try {
      await db.insert(orderSequence).values({
        currentNumber: 1554
      });
    } catch (error) {
      // Sequence might already exist
      console.log('Order sequence might already be initialized');
    }
  }

  async getOrderSequence(): Promise<OrderSequence | undefined> {
    const [sequence] = await db.select().from(orderSequence).limit(1);
    return sequence || undefined;
  }

  async updateOrderSequence(currentNumber: number): Promise<OrderSequence> {
    const [sequence] = await db
      .update(orderSequence)
      .set({ 
        currentNumber,
        lastUpdated: new Date()
      })
      .where(eq(orderSequence.id, 1))
      .returning();
    return sequence;
  }

  // User authentication methods - folosesc baza de date principală
  async getUser(id: number): Promise<User | undefined> {
    const mainDb = this.getMainDb();
    const [user] = await mainDb.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const mainDb = this.getMainDb();
    const [user] = await mainDb.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const mainDb = this.getMainDb();
    const [user] = await mainDb.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async deleteUser(id: number): Promise<void> {
    const mainDb = this.getMainDb();
    await mainDb.delete(users).where(eq(users.id, id));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const mainDb = this.getMainDb();
    const [user] = await mainDb
      .insert(users)
      .values(insertUser)
      .returning();
    
    console.log(`📊 Created user ${user.username} with tenant ID: ${user.tenantId}`);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, updateData: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  // Company balance methods
  // Company balance methods 
  async getAllCompanyBalances(): Promise<CompanyBalance[]> {
    return this.getCompanyBalances();
  }

  async getCompanyBalances(): Promise<CompanyBalance[]> {
    const dbConn = this.getDb();
    return await dbConn.select().from(companyBalances).orderBy(desc(companyBalances.createdAt));
  }

  async getCompanyBalanceByWeek(companyName: string, weekLabel: string): Promise<CompanyBalance | undefined> {
    const [balance] = await db
      .select()
      .from(companyBalances)
      .where(
        and(
          eq(companyBalances.companyName, companyName),
          eq(companyBalances.weekLabel, weekLabel)
        )
      );
    return balance || undefined;
  }

  async createOrUpdateCompanyBalance(balance: InsertCompanyBalance): Promise<CompanyBalance> {
    const existing = await this.getCompanyBalanceByWeek(balance.companyName, balance.weekLabel);
    
    if (existing) {
      // Update existing balance
      const [updated] = await db
        .update(companyBalances)
        .set({
          totalInvoiced: balance.totalInvoiced,
          outstandingBalance: balance.outstandingBalance,
          paymentStatus: balance.paymentStatus,
          lastUpdated: new Date()
        })
        .where(eq(companyBalances.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new balance
      const [created] = await db
        .insert(companyBalances)
        .values(balance)
        .returning();
      return created;
    }
  }

  async updateCompanyBalancePayment(companyName: string, weekLabel: string, paidAmount: number): Promise<CompanyBalance> {
    const existing = await this.getCompanyBalanceByWeek(companyName, weekLabel);
    if (!existing) {
      throw new Error(`No balance found for ${companyName} in week ${weekLabel}`);
    }

    const newTotalPaid = parseFloat(existing.totalPaid || '0') + paidAmount;
    const totalInvoiced = parseFloat(existing.totalInvoiced);
    let newOutstandingBalance = totalInvoiced - newTotalPaid;
    
    // If difference is less than 1 EUR, consider it paid and set balance to 0
    let newStatus: 'pending' | 'partial' | 'paid' = 'pending';
    if (newTotalPaid === 0) {
      newStatus = 'pending';
    } else if (newTotalPaid >= totalInvoiced || Math.abs(newOutstandingBalance) < 1) {
      newStatus = 'paid';
      if (Math.abs(newOutstandingBalance) < 1) {
        newOutstandingBalance = 0;
      }
    } else {
      newStatus = 'partial';
    }

    const [updated] = await db
      .update(companyBalances)
      .set({
        totalPaid: newTotalPaid.toString(),
        outstandingBalance: newOutstandingBalance.toString(),
        paymentStatus: newStatus,
        lastUpdated: new Date()
      })
      .where(eq(companyBalances.id, existing.id))
      .returning();
    
    return updated;
  }

  // Generate company balances from weekly processing data and payments
  async generateCompanyBalancesFromCalendarData(): Promise<CompanyBalance[]> {
    try {
      // Get all weekly processing data
      const weeklyData = await db.select().from(weeklyProcessing).orderBy(weeklyProcessing.weekLabel);
      
      // Get all payments
      const allPayments = await db.select().from(payments);
      
      const balancesToCreate: InsertCompanyBalance[] = [];
      
      for (const week of weeklyData) {
        if (!week.processedData) continue;
        
        const processedData = week.processedData as any;
        
        // Extract company totals from processed data
        Object.keys(processedData).forEach(companyName => {
          if (companyName === 'Unmatched' || companyName === 'Totals') return;
          
          const companyData = processedData[companyName];
          if (companyData && (companyData.Total_7_days || companyData.Total_30_days)) {
            const total7Days = parseFloat(companyData.Total_7_days) || 0;
            const total30Days = parseFloat(companyData.Total_30_days) || 0;
            const totalCommission = parseFloat(companyData.Total_comision) || 0;
            
            // Total invoiced should exclude commission - commission is separate from company payments
            const totalInvoiced = total7Days + total30Days - totalCommission;
            

            

            
            // Calculate total paid for this company and week
            const weekPayments = allPayments.filter(p => 
              p.companyName === companyName && p.weekLabel === week.weekLabel
            );
            const totalPaid = weekPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
            
            let outstandingBalance = totalInvoiced - totalPaid;
            
            let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
            if (totalPaid === 0) {
              paymentStatus = 'pending';
            } else if (totalPaid >= totalInvoiced || Math.abs(totalInvoiced - totalPaid) < 1) {
              paymentStatus = 'paid';
              // Set outstanding balance to 0 if difference is less than 1 EUR
              if (Math.abs(totalInvoiced - totalPaid) < 1) {
                outstandingBalance = 0;
              }
            } else {
              paymentStatus = 'partial';
            }
            
            balancesToCreate.push({
              companyName,
              weekLabel: week.weekLabel,
              totalInvoiced: totalInvoiced.toString(),
              amountPaid: totalPaid.toString(), // Use amountPaid to match schema
              outstandingBalance: outstandingBalance.toString(),
              status: paymentStatus // Use status instead of paymentStatus
            });
          }
        });
      }
      
      // Clear existing balances and insert new ones
      await db.delete(companyBalances);
      
      if (balancesToCreate.length > 0) {
        // Map to database column names for compatibility
        const dbCompatibleBalances = balancesToCreate.map(balance => ({
          company_name: balance.companyName,
          week_label: balance.weekLabel,
          total_invoiced: balance.totalInvoiced,
          amount_paid: balance.amountPaid, // Now using the new column
          outstanding_balance: balance.outstandingBalance,
          status: balance.status
        }));
        
        const createdBalances = await db
          .insert(companyBalances)
          .values(dbCompatibleBalances)
          .returning();
        
        console.log(`✅ Generated ${createdBalances.length} company balances from calendar data`);
        return createdBalances;
      }
      
      return [];
    } catch (error) {
      console.error('Error generating company balances:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
