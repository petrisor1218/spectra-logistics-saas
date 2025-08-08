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
  transportOrders,
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
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interface extinsă pentru storage multi-tenant
export interface ITenantStorage {
  // User methods (cu tenant support)
  getUser(id: number, tenantId: number): Promise<User | undefined>;
  getUserByUsername(username: string, tenantId?: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Company methods (cu tenant support)
  getAllCompanies(tenantId: number): Promise<Company[]>;
  getCompanyByName(name: string, tenantId: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany, tenantId: number): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>, tenantId: number): Promise<Company>;
  deleteCompany(id: number, tenantId: number): Promise<void>;
  
  // Driver methods (cu tenant support)
  getAllDrivers(tenantId: number): Promise<Driver[]>;
  getDriversByCompany(companyId: number, tenantId: number): Promise<Driver[]>;
  createDriver(driver: InsertDriver, tenantId: number): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>, tenantId: number): Promise<Driver>;
  deleteDriver(id: number, tenantId: number): Promise<void>;
  
  // Weekly processing methods (cu tenant support)
  getWeeklyProcessing(weekLabel: string, tenantId: number): Promise<WeeklyProcessing | undefined>;
  getAllWeeklyProcessing(tenantId: number): Promise<WeeklyProcessing[]>;
  createWeeklyProcessing(processing: InsertWeeklyProcessing, tenantId: number): Promise<WeeklyProcessing>;
  updateWeeklyProcessing(weekLabel: string, data: Partial<InsertWeeklyProcessing>, tenantId: number): Promise<WeeklyProcessing>;
  
  // Payment methods (cu tenant support)
  getPaymentsByWeek(weekLabel: string, tenantId: number): Promise<Payment[]>;
  getAllPayments(tenantId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment, tenantId: number): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>, tenantId: number): Promise<Payment>;
  deletePayment(id: number, tenantId: number): Promise<void>;
  
  // Payment history methods (cu tenant support)
  getPaymentHistory(tenantId: number, paymentId?: number): Promise<PaymentHistoryRecord[]>;
  createPaymentHistoryRecord(record: InsertPaymentHistory, tenantId: number): Promise<PaymentHistoryRecord>;
  clearPaymentHistoryReferences(paymentId: number, tenantId: number): Promise<void>;

  // Transport orders (cu tenant support)
  createTransportOrder(order: InsertTransportOrder, tenantId: number): Promise<TransportOrder>;
  getAllTransportOrders(tenantId: number): Promise<TransportOrder[]>;
  getTransportOrdersByWeek(weekLabel: string, tenantId: number): Promise<TransportOrder[]>;
  getTransportOrdersByCompany(companyName: string, tenantId: number): Promise<TransportOrder[]>;
  updateTransportOrder(id: number, updates: Partial<InsertTransportOrder>, tenantId: number): Promise<TransportOrder>;
  deleteTransportOrder(id: number, tenantId: number): Promise<void>;
  
  // Historical trips methods (cu tenant support)
  createHistoricalTrip(trip: InsertHistoricalTrip, tenantId: number): Promise<HistoricalTrip>;
  getHistoricalTripByVrid(vrid: string, tenantId: number): Promise<HistoricalTrip | undefined>;
  getHistoricalTripsByWeek(weekLabel: string, tenantId: number): Promise<HistoricalTrip[]>;
  searchHistoricalTripsByVrids(vrids: string[], tenantId: number): Promise<HistoricalTrip[]>;
  
  // Enhanced weekly processing with historical data (cu tenant support)
  saveWeeklyDataWithHistory(
    weekLabel: string, 
    tripData: any[], 
    invoice7Data: any[], 
    invoice30Data: any[], 
    processedData: any,
    tenantId: number
  ): Promise<WeeklyProcessing>;
  
  // Order numbering methods (cu tenant support)
  getNextOrderNumber(tenantId: number): Promise<number>;
  initializeOrderSequence(tenantId: number): Promise<void>;
  
  // Company balance methods (cu tenant support)
  getCompanyBalances(tenantId: number): Promise<CompanyBalance[]>;
  getCompanyBalanceByWeek(companyName: string, weekLabel: string, tenantId: number): Promise<CompanyBalance | undefined>;
  createOrUpdateCompanyBalance(balance: InsertCompanyBalance, tenantId: number): Promise<CompanyBalance>;
  updateCompanyBalancePayment(companyName: string, weekLabel: string, paidAmount: number, tenantId: number): Promise<CompanyBalance>;
}

// Implementarea multi-tenant a storage-ului
export class TenantDatabaseStorage implements ITenantStorage {
  
  // User methods cu tenant support
  async getUser(id: number, tenantId: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
    return user || undefined;
  }

  async getUserByUsername(username: string, tenantId?: number): Promise<User | undefined> {
    if (tenantId) {
      const [user] = await db.select().from(users).where(and(eq(users.username, username), eq(users.tenantId, tenantId)));
      return user || undefined;
    }
    // Pentru backward compatibility (login), se verifică pe toate tenant-urile
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

  // Company methods cu tenant support
  async getAllCompanies(tenantId: number): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.tenantId, tenantId));
  }

  async getCompanyByName(name: string, tenantId: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(and(eq(companies.name, name), eq(companies.tenantId, tenantId)));
    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany, tenantId: number): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values({ ...insertCompany, tenantId })
      .returning();
    return company;
  }

  async updateCompany(id: number, companyData: Partial<InsertCompany>, tenantId: number): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set(companyData)
      .where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)))
      .returning();
    return company;
  }

  async deleteCompany(id: number, tenantId: number): Promise<void> {
    // First delete all drivers for this company
    await db.delete(drivers).where(and(eq(drivers.companyId, id), eq(drivers.tenantId, tenantId)));
    // Then delete the company
    await db.delete(companies).where(and(eq(companies.id, id), eq(companies.tenantId, tenantId)));
  }

  // Driver methods cu tenant support
  async getAllDrivers(tenantId: number): Promise<Driver[]> {
    return await db.select().from(drivers).where(eq(drivers.tenantId, tenantId));
  }

  async getDriversByCompany(companyId: number, tenantId: number): Promise<Driver[]> {
    return await db.select().from(drivers).where(and(eq(drivers.companyId, companyId), eq(drivers.tenantId, tenantId)));
  }

  async createDriver(insertDriver: InsertDriver, tenantId: number): Promise<Driver> {
    // Check if driver already exists in this tenant
    const existingDriver = await db
      .select()
      .from(drivers)
      .where(and(eq(drivers.name, insertDriver.name), eq(drivers.tenantId, tenantId)))
      .limit(1);
    
    if (existingDriver.length > 0) {
      console.log('Driver already exists in tenant:', existingDriver[0]);
      return existingDriver[0];
    }

    const [driver] = await db
      .insert(drivers)
      .values({ ...insertDriver, tenantId })
      .returning();
    return driver;
  }

  async updateDriver(id: number, driverData: Partial<InsertDriver>, tenantId: number): Promise<Driver> {
    const [driver] = await db
      .update(drivers)
      .set(driverData)
      .where(and(eq(drivers.id, id), eq(drivers.tenantId, tenantId)))
      .returning();
    return driver;
  }

  async deleteDriver(id: number, tenantId: number): Promise<void> {
    await db.delete(drivers).where(and(eq(drivers.id, id), eq(drivers.tenantId, tenantId)));
  }

  // Weekly processing methods cu tenant support
  async getWeeklyProcessing(weekLabel: string, tenantId: number): Promise<WeeklyProcessing | undefined> {
    const [processing] = await db.select().from(weeklyProcessing).where(and(eq(weeklyProcessing.weekLabel, weekLabel), eq(weeklyProcessing.tenantId, tenantId)));
    return processing || undefined;
  }

  async createWeeklyProcessing(insertProcessing: InsertWeeklyProcessing, tenantId: number): Promise<WeeklyProcessing> {
    const [processing] = await db
      .insert(weeklyProcessing)
      .values({ ...insertProcessing, tenantId })
      .returning();
    return processing;
  }

  async getAllWeeklyProcessing(tenantId: number): Promise<WeeklyProcessing[]> {
    return await db.select().from(weeklyProcessing).where(eq(weeklyProcessing.tenantId, tenantId)).orderBy(desc(weeklyProcessing.processingDate));
  }

  async updateWeeklyProcessing(weekLabel: string, data: Partial<InsertWeeklyProcessing>, tenantId: number): Promise<WeeklyProcessing> {
    const [processing] = await db
      .update(weeklyProcessing)
      .set(data)
      .where(and(eq(weeklyProcessing.weekLabel, weekLabel), eq(weeklyProcessing.tenantId, tenantId)))
      .returning();
    return processing;
  }

  // Payment methods cu tenant support
  async getPaymentsByWeek(weekLabel: string, tenantId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(and(eq(payments.weekLabel, weekLabel), eq(payments.tenantId, tenantId))).orderBy(desc(payments.paymentDate));
  }

  async getAllPayments(tenantId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.tenantId, tenantId)).orderBy(desc(payments.paymentDate));
  }

  async createPayment(insertPayment: InsertPayment, tenantId: number): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values({ ...insertPayment, tenantId })
      .returning();
    return payment;
  }

  async updatePayment(id: number, paymentData: Partial<InsertPayment>, tenantId: number): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set(paymentData)
      .where(and(eq(payments.id, id), eq(payments.tenantId, tenantId)))
      .returning();
    return payment;
  }

  async deletePayment(id: number, tenantId: number): Promise<void> {
    console.log(`🗑️ Deleting payment with id: ${id} for tenant ${tenantId}`);
    
    // First get the payment details for logging and balance updates
    const [paymentToDelete] = await db.select().from(payments).where(and(eq(payments.id, id), eq(payments.tenantId, tenantId)));
    
    if (!paymentToDelete) {
      throw new Error(`Payment with id ${id} not found for tenant ${tenantId}`);
    }
    
    console.log(`🗑️ Found payment to delete: ${paymentToDelete.companyName} - ${paymentToDelete.weekLabel} - ${paymentToDelete.amount} EUR`);
    
    // Delete from payments table
    await db.delete(payments).where(and(eq(payments.id, id), eq(payments.tenantId, tenantId)));
    console.log(`✅ Payment deleted from payments table`);
    
    // Update company balance by subtracting the payment amount
    const existingBalance = await this.getCompanyBalanceByWeek(
      paymentToDelete.companyName, 
      paymentToDelete.weekLabel || "",
      tenantId
    );
    
    if (existingBalance) {
      const newTotalPaid = Math.max(0, parseFloat(existingBalance.totalPaid || "0") - parseFloat(paymentToDelete.amount));
      const newOutstandingBalance = parseFloat(existingBalance.totalInvoiced) - newTotalPaid;
      const newPaymentStatus = newOutstandingBalance <= 1 ? "paid" : newOutstandingBalance < parseFloat(existingBalance.totalInvoiced) ? "partial" : "pending";
      
      await db.update(companyBalances)
        .set({
          totalPaid: newTotalPaid.toString(),
          outstandingBalance: newOutstandingBalance.toString(),
          paymentStatus: newPaymentStatus,
          lastUpdated: new Date()
        })
        .where(
          and(
            eq(companyBalances.companyName, paymentToDelete.companyName),
            eq(companyBalances.weekLabel, paymentToDelete.weekLabel),
            eq(companyBalances.tenantId, tenantId)
          )
        );
      
      console.log(`✅ Updated balance for ${paymentToDelete.companyName} - ${paymentToDelete.weekLabel}: totalPaid=${newTotalPaid}, outstanding=${newOutstandingBalance}, status=${newPaymentStatus}`);
    }
    
    console.log(`✅ Payment ${id} successfully deleted from both payments and balances for tenant ${tenantId}`);
  }

  // Payment history methods cu tenant support
  async getPaymentHistory(tenantId: number, paymentId?: number): Promise<PaymentHistoryRecord[]> {
    if (paymentId) {
      return await db.select().from(paymentHistory).where(and(eq(paymentHistory.paymentId, paymentId), eq(paymentHistory.tenantId, tenantId))).orderBy(desc(paymentHistory.createdAt));
    }
    return await db.select().from(paymentHistory).where(eq(paymentHistory.tenantId, tenantId)).orderBy(desc(paymentHistory.createdAt));
  }

  async createPaymentHistoryRecord(insertRecord: InsertPaymentHistory, tenantId: number): Promise<PaymentHistoryRecord> {
    const [record] = await db
      .insert(paymentHistory)
      .values({ ...insertRecord, tenantId })
      .returning();
    return record;
  }

  async clearPaymentHistoryReferences(paymentId: number, tenantId: number): Promise<void> {
    console.log(`🧹 Clearing payment history references for payment ${paymentId} in tenant ${tenantId}`);
    
    // Update all existing payment_history records for this payment to have null paymentId
    await db
      .update(paymentHistory)
      .set({ paymentId: null })
      .where(and(eq(paymentHistory.paymentId, paymentId), eq(paymentHistory.tenantId, tenantId)));
      
    console.log(`✅ Payment history references cleared for payment ${paymentId} in tenant ${tenantId}`);
  }

  // Transport orders methods cu tenant support
  async createTransportOrder(order: InsertTransportOrder, tenantId: number): Promise<TransportOrder> {
    // Create the order with tenant ID
    const [transportOrder] = await db
      .insert(transportOrders)
      .values({ ...order, tenantId })
      .returning();
    
    // Increment the order sequence after successful creation
    await this.incrementOrderNumber(tenantId);
    
    return transportOrder;
  }

  async getAllTransportOrders(tenantId: number): Promise<TransportOrder[]> {
    return await db.select().from(transportOrders).where(eq(transportOrders.tenantId, tenantId)).orderBy(desc(transportOrders.createdAt));
  }

  async getTransportOrdersByWeek(weekLabel: string, tenantId: number): Promise<TransportOrder[]> {
    return await db.select().from(transportOrders).where(and(eq(transportOrders.weekLabel, weekLabel), eq(transportOrders.tenantId, tenantId)));
  }

  async getTransportOrdersByCompany(companyName: string, tenantId: number): Promise<TransportOrder[]> {
    return await db.select().from(transportOrders).where(and(eq(transportOrders.companyName, companyName), eq(transportOrders.tenantId, tenantId)));
  }

  async updateTransportOrder(id: number, updates: Partial<InsertTransportOrder>, tenantId: number): Promise<TransportOrder> {
    const [transportOrder] = await db
      .update(transportOrders)
      .set(updates)
      .where(and(eq(transportOrders.id, id), eq(transportOrders.tenantId, tenantId)))
      .returning();
    return transportOrder;
  }

  async deleteTransportOrder(id: number, tenantId: number): Promise<void> {
    await db.delete(transportOrders).where(and(eq(transportOrders.id, id), eq(transportOrders.tenantId, tenantId)));
  }

  // Historical trips methods cu tenant support
  async createHistoricalTrip(trip: InsertHistoricalTrip, tenantId: number): Promise<HistoricalTrip> {
    const [historicalTrip] = await db
      .insert(historicalTrips)
      .values({ ...trip, tenantId })
      .returning();
    return historicalTrip;
  }

  async getHistoricalTripByVrid(vrid: string, tenantId: number): Promise<HistoricalTrip | undefined> {
    const [trip] = await db.select().from(historicalTrips).where(and(eq(historicalTrips.vrid, vrid), eq(historicalTrips.tenantId, tenantId)));
    return trip || undefined;
  }

  async getHistoricalTripsByWeek(weekLabel: string, tenantId: number): Promise<HistoricalTrip[]> {
    return await db.select().from(historicalTrips).where(and(eq(historicalTrips.weekLabel, weekLabel), eq(historicalTrips.tenantId, tenantId)));
  }

  async searchHistoricalTripsByVrids(vrids: string[], tenantId: number): Promise<HistoricalTrip[]> {
    if (vrids.length === 0) return [];
    
    const trips: HistoricalTrip[] = [];
    for (const vrid of vrids) {
      const trip = await this.getHistoricalTripByVrid(vrid, tenantId);
      if (trip) trips.push(trip);
    }
    return trips;
  }

  // Enhanced weekly processing cu tenant support
  async saveWeeklyDataWithHistory(
    weekLabel: string, 
    tripData: any[], 
    invoice7Data: any[], 
    invoice30Data: any[], 
    processedData: any,
    tenantId: number
  ): Promise<WeeklyProcessing> {
    // Save weekly processing data with processed results AND raw data
    const weeklyData: InsertWeeklyProcessing = {
      weekLabel,
      tripDataCount: tripData.length,
      invoice7Count: invoice7Data.length,
      invoice30Count: invoice30Data.length,
      processedData: processedData || null,
      tripData: tripData || null,
      invoice7Data: invoice7Data || null,
      invoice30Data: invoice30Data || null
    };

    const [processing] = await db
      .insert(weeklyProcessing)
      .values({ ...weeklyData, tenantId })
      .onConflictDoUpdate({
        target: [weeklyProcessing.weekLabel, weeklyProcessing.tenantId],
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
          }, tenantId);
        } catch (error) {
          console.log(`VRID ${vrid} already exists in historical data for tenant ${tenantId}`);
        }
      }
    }

    return processing;
  }

  // Order numbering methods cu tenant support
  async getNextOrderNumber(tenantId: number): Promise<number> {
    const [sequence] = await db.select().from(orderSequence).where(eq(orderSequence.tenantId, tenantId)).limit(1);
    
    if (!sequence) {
      await this.initializeOrderSequence(tenantId);
      return 1554;
    }
    
    return sequence.currentNumber;
  }

  async incrementOrderNumber(tenantId: number): Promise<number> {
    const [sequence] = await db.select().from(orderSequence).where(eq(orderSequence.tenantId, tenantId)).limit(1);
    
    if (!sequence) {
      await this.initializeOrderSequence(tenantId);
      return 1554;
    }
    
    const nextNumber = sequence.currentNumber + 1;
    await db.update(orderSequence)
      .set({ 
        currentNumber: nextNumber,
        lastUpdated: new Date()
      })
      .where(and(eq(orderSequence.id, sequence.id), eq(orderSequence.tenantId, tenantId)));
    
    return nextNumber;
  }

  async initializeOrderSequence(tenantId: number): Promise<void> {
    try {
      await db.insert(orderSequence).values({
        currentNumber: 1554,
        tenantId
      });
    } catch (error) {
      console.log(`Order sequence might already be initialized for tenant ${tenantId}`);
    }
  }

  // Company balance methods cu tenant support
  async getCompanyBalances(tenantId: number): Promise<CompanyBalance[]> {
    return await db.select().from(companyBalances).where(eq(companyBalances.tenantId, tenantId)).orderBy(desc(companyBalances.createdAt));
  }

  async getCompanyBalanceByWeek(companyName: string, weekLabel: string, tenantId: number): Promise<CompanyBalance | undefined> {
    const [balance] = await db
      .select()
      .from(companyBalances)
      .where(and(
        eq(companyBalances.companyName, companyName),
        eq(companyBalances.weekLabel, weekLabel),
        eq(companyBalances.tenantId, tenantId)
      ));
    return balance || undefined;
  }

  async createOrUpdateCompanyBalance(balance: InsertCompanyBalance, tenantId: number): Promise<CompanyBalance> {
    const existing = await this.getCompanyBalanceByWeek(balance.companyName, balance.weekLabel, tenantId);
    
    if (existing) {
      const [updated] = await db
        .update(companyBalances)
        .set({
          totalInvoiced: balance.totalInvoiced,
          outstandingBalance: balance.outstandingBalance,
          paymentStatus: balance.paymentStatus,
          lastUpdated: new Date()
        })
        .where(and(eq(companyBalances.id, existing.id), eq(companyBalances.tenantId, tenantId)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(companyBalances)
        .values({ ...balance, tenantId })
        .returning();
      return created;
    }
  }

  async updateCompanyBalancePayment(companyName: string, weekLabel: string, paidAmount: number, tenantId: number): Promise<CompanyBalance> {
    const existing = await this.getCompanyBalanceByWeek(companyName, weekLabel, tenantId);
    if (!existing) {
      throw new Error(`No balance found for ${companyName} in week ${weekLabel} for tenant ${tenantId}`);
    }

    // Save the payment in the payments table so it persists through synchronization
    const paymentData: InsertPayment = {
      companyName: companyName,
      weekLabel: weekLabel,
      amount: paidAmount.toString(),
      description: `Plată manuală adăugată prin bilanțe`
    };

    await db.insert(payments).values({ ...paymentData, tenantId });
    console.log(`💾 Plată salvată în tabelul payments pentru tenant ${tenantId}: ${companyName} - ${weekLabel} - ${paidAmount} EUR`);

    const newTotalPaid = parseFloat(existing.totalPaid || '0') + paidAmount;
    const totalInvoiced = parseFloat(existing.totalInvoiced || '0');
    let newOutstandingBalance = totalInvoiced - newTotalPaid;
    
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
      .where(and(eq(companyBalances.id, existing.id), eq(companyBalances.tenantId, tenantId)))
      .returning();
    
    return updated;
  }
}

// Instance single pentru storage-ul multi-tenant
export const tenantStorage = new TenantDatabaseStorage();