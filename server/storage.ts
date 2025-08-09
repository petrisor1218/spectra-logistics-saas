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
import { eq, and, desc, sql } from "drizzle-orm";

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
  clearPaymentHistoryReferences(paymentId: number): Promise<void>;

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
    // In simplified system, only return companies for tenant 1
    return await db.select().from(companies).where(eq(companies.tenantId, 1));
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
    // In simplified system, only return drivers for tenant 1
    return await db.select().from(drivers).where(eq(drivers.tenantId, 1));
  }

  async getDriversByCompany(companyId: number): Promise<Driver[]> {
    // In simplified system, filter by both company and tenant
    return await db.select().from(drivers).where(
      and(eq(drivers.companyId, companyId), eq(drivers.tenantId, 1))
    );
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

  async getPaymentsByCompanyAndWeek(companyName: string, weekLabel: string): Promise<Payment[]> {
    return await db.select().from(payments).where(
      and(
        eq(payments.companyName, companyName),
        eq(payments.weekLabel, weekLabel)
      )
    ).orderBy(desc(payments.paymentDate));
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
    console.log(`🗑️ Deleting payment with id: ${id}`);
    
    // First get the payment details for logging and balance updates
    const [paymentToDelete] = await db.select().from(payments).where(eq(payments.id, id));
    
    if (!paymentToDelete) {
      throw new Error(`Payment with id ${id} not found`);
    }
    
    console.log(`🗑️ Found payment to delete: ${paymentToDelete.companyName} - ${paymentToDelete.weekLabel} - ${paymentToDelete.amount} EUR`);
    
    // Delete from payments table
    await db.delete(payments).where(eq(payments.id, id));
    console.log(`✅ Payment deleted from payments table`);
    
    // Update company balance by subtracting the payment amount
    const existingBalance = await this.getCompanyBalanceByWeek(
      paymentToDelete.companyName, 
      paymentToDelete.weekLabel || ""
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
            eq(companyBalances.weekLabel, paymentToDelete.weekLabel)
          )
        );
      
      console.log(`✅ Updated balance for ${paymentToDelete.companyName} - ${paymentToDelete.weekLabel}: totalPaid=${newTotalPaid}, outstanding=${newOutstandingBalance}, status=${newPaymentStatus}`);
    }
    
    console.log(`✅ Payment ${id} successfully deleted from both payments and balances`);
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

  async clearPaymentHistoryReferences(paymentId: number): Promise<void> {
    console.log(`🧹 Clearing payment history references for payment ${paymentId}`);
    
    // Update all existing payment_history records for this payment to have null paymentId
    await db
      .update(paymentHistory)
      .set({ paymentId: null })
      .where(eq(paymentHistory.paymentId, paymentId));
      
    console.log(`✅ Payment history references cleared for payment ${paymentId}`);
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

  async getHistoricalTripsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(historicalTrips);
    return result[0].count;
  }

  async getUniqueVridsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(distinct ${historicalTrips.vrid})` }).from(historicalTrips);
    return result[0].count;
  }

  async getHistoricalWeeksCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(distinct ${historicalTrips.weekLabel})` }).from(historicalTrips);
    return result[0].count;
  }

  // Enhanced weekly processing with historical data
  async saveWeeklyDataWithHistory(
    weekLabel: string, 
    tripData: any[], 
    invoice7Data: any[], 
    invoice30Data: any[], 
    processedData: any
  ): Promise<WeeklyProcessing> {
    // Save weekly processing data with processed results AND raw data
    const weeklyData: InsertWeeklyProcessing = {
      weekLabel,
      tripDataCount: tripData.length,
      invoice7Count: invoice7Data.length,
      invoice30Count: invoice30Data.length,
      processedData: processedData || null, // Processed results
      tripData: tripData || null, // Raw trip file data
      invoice7Data: invoice7Data || null, // Raw 7-day invoice data  
      invoice30Data: invoice30Data || null // Raw 30-day invoice data
    };

    const [processing] = await db
      .insert(weeklyProcessing)
      .values(weeklyData)
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
  async getCompanyBalances(): Promise<CompanyBalance[]> {
    // Order by creation date - newest first (inverse chronological)
    return await db.select().from(companyBalances).orderBy(desc(companyBalances.createdAt));
  }

  async getCompanyBalanceByWeek(companyName: string, weekLabel: string): Promise<CompanyBalance | undefined> {
    const [balance] = await db
      .select()
      .from(companyBalances)
      .where(and(
        eq(companyBalances.companyName, companyName),
        eq(companyBalances.weekLabel, weekLabel)
      ));
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

    // IMPORTANT: Save the payment in the payments table so it persists through synchronization
    const paymentData: InsertPayment = {
      companyName: companyName,
      weekLabel: weekLabel,
      amount: paidAmount.toString(),
      description: `Plată manuală adăugată prin bilanțe`
    };

    await db.insert(payments).values(paymentData);
    console.log(`💾 Plată salvată în tabelul payments: ${companyName} - ${weekLabel} - ${paidAmount} EUR`);

    const newTotalPaid = parseFloat(existing.totalPaid || '0') + paidAmount;
    const totalInvoiced = parseFloat(existing.totalInvoiced || '0');
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

  async deleteCompanyBalancePayment(companyName: string, weekLabel: string, paymentAmount: number): Promise<CompanyBalance> {
    const existing = await this.getCompanyBalanceByWeek(companyName, weekLabel);
    if (!existing) {
      throw new Error(`No balance found for ${companyName} in week ${weekLabel}`);
    }

    // First, find and delete the corresponding payment from the payments table
    const paymentToDelete = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.companyName, companyName),
          eq(payments.weekLabel, weekLabel),
          eq(payments.amount, paymentAmount.toString())
        )
      )
      .limit(1);

    if (paymentToDelete.length > 0) {
      await db
        .delete(payments)
        .where(eq(payments.id, paymentToDelete[0].id));
      
      console.log(`🗑️ Plata de ${paymentAmount} EUR ștearsă din tabelul payments`);
    }

    // Now recalculate the balance based on remaining payments
    const remainingPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.companyName, companyName),
          eq(payments.weekLabel, weekLabel)
        )
      );

    const newTotalPaid = remainingPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const totalInvoiced = parseFloat(existing.totalInvoiced || '0');
    let newOutstandingBalance = totalInvoiced - newTotalPaid;
    
    // Recalculate status based on new balance
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

    console.log(`💰 Plată ștearsă complet: ${companyName} - ${weekLabel}`);
    console.log(`   Plătit înainte: ${parseFloat(existing.totalPaid || '0')} EUR → după: ${newTotalPaid} EUR`);
    console.log(`   Status: ${newStatus}, Restant: ${newOutstandingBalance} EUR`);

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
              totalPaid: totalPaid.toString(),
              outstandingBalance: outstandingBalance.toString(),
              paymentStatus
            });
          }
        });
      }
      
      // Clear existing balances and insert new ones
      await db.delete(companyBalances);
      
      if (balancesToCreate.length > 0) {
        const createdBalances = await db
          .insert(companyBalances)
          .values(balancesToCreate)
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

  async updateCompanyEmail(companyName: string, newEmail: string): Promise<void> {
    await db
      .update(companies)
      .set({ contact: newEmail })
      .where(eq(companies.name, companyName));
    console.log(`📧 Updated email for ${companyName} to ${newEmail}`);
  }
}

export const storage = new DatabaseStorage();
