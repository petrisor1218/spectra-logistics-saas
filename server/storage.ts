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
  type InsertCompanyBalance
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Company methods
  getAllCompanies(): Promise<Company[]>;
  getCompanyByName(name: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  
  // Driver methods
  getAllDrivers(): Promise<Driver[]>;
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
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Company methods
  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.name, name));
    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set(companyData)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async deleteCompany(id: number): Promise<void> {
    // First delete all drivers for this company
    await db.delete(drivers).where(eq(drivers.companyId, id));
    // Then delete the company
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Driver methods
  async getAllDrivers(): Promise<Driver[]> {
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

  // Weekly processing methods
  async getWeeklyProcessing(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    const [processing] = await db.select().from(weeklyProcessing).where(eq(weeklyProcessing.weekLabel, weekLabel));
    return processing || undefined;
  }

  async createWeeklyProcessing(insertProcessing: InsertWeeklyProcessing): Promise<WeeklyProcessing> {
    const [processing] = await db
      .insert(weeklyProcessing)
      .values(insertProcessing)
      .returning();
    return processing;
  }

  async getWeeklyProcessingByWeek(weekLabel: string): Promise<WeeklyProcessing | undefined> {
    const [processing] = await db.select().from(weeklyProcessing).where(eq(weeklyProcessing.weekLabel, weekLabel));
    return processing || undefined;
  }

  async getAllWeeklyProcessing(): Promise<WeeklyProcessing[]> {
    return await db.select().from(weeklyProcessing).orderBy(desc(weeklyProcessing.processingDate));
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
    // Create the order
    const [transportOrder] = await db
      .insert(transportOrders)
      .values(order)
      .returning();
    
    // Increment the order sequence after successful creation
    await this.incrementOrderNumber();
    
    return transportOrder;
  }

  async getAllTransportOrders(): Promise<TransportOrder[]> {
    return await db.select().from(transportOrders).orderBy(desc(transportOrders.createdAt));
  }

  async getTransportOrdersByWeek(weekLabel: string): Promise<TransportOrder[]> {
    return await db.select().from(transportOrders).where(eq(transportOrders.weekLabel, weekLabel));
  }

  async getTransportOrdersByCompany(companyName: string): Promise<TransportOrder[]> {
    return await db.select().from(transportOrders).where(eq(transportOrders.companyName, companyName));
  }

  async updateTransportOrder(id: number, updates: Partial<InsertTransportOrder>): Promise<TransportOrder> {
    const [transportOrder] = await db
      .update(transportOrders)
      .set(updates)
      .where(eq(transportOrders.id, id))
      .returning();
    return transportOrder;
  }

  async deleteTransportOrder(id: number): Promise<void> {
    await db.delete(transportOrders).where(eq(transportOrders.id, id));
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

  // User authentication methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Company balance methods
  async getCompanyBalances(): Promise<CompanyBalance[]> {
    return await db.select().from(companyBalances).orderBy(desc(companyBalances.lastUpdated));
  }

  async getCompanyBalanceByWeek(companyName: string, weekLabel: string): Promise<CompanyBalance | undefined> {
    const [balance] = await db
      .select()
      .from(companyBalances)
      .where(eq(companyBalances.companyName, companyName))
      .where(eq(companyBalances.weekLabel, weekLabel));
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

    const newTotalPaid = parseFloat(existing.totalPaid) + paidAmount;
    const newOutstandingBalance = parseFloat(existing.totalInvoiced) - newTotalPaid;
    const newStatus = newOutstandingBalance <= 0 ? 'paid' : newTotalPaid > 0 ? 'partial' : 'pending';

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
}

export const storage = new DatabaseStorage();
