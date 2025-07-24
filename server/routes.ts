import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema, insertWeeklyProcessingSchema } from "@shared/schema";

// Seed initial companies and drivers
async function seedDatabase() {
  try {
    // Check if companies already exist
    const existingCompanies = await storage.getAllCompanies();
    if (existingCompanies.length > 0) {
      return; // Already seeded
    }

    // Create companies with commission rates
    const companies = [
      { name: "Fast Express", commissionRate: "0.02" },
      { name: "Daniel Ontheroad", commissionRate: "0.04" },
      { name: "DE Cargo Speed", commissionRate: "0.04" },
      { name: "Florin Cargo", commissionRate: "0.04" },
      { name: "TRANSVAL SRL", commissionRate: "0.04" },
      { name: "TRANS DUNAREA", commissionRate: "0.04" },
      { name: "TRANS VALI", commissionRate: "0.04" },
      { name: "TRANEXPO", commissionRate: "0.04" },
      { name: "TRANS ELEFANT", commissionRate: "0.04" },
      { name: "EVERTRANS", commissionRate: "0.04" },
    ];

    const createdCompanies = [];
    for (const company of companies) {
      const created = await storage.createCompany(company);
      createdCompanies.push(created);
    }

    // Driver-company mapping
    const driverMappings = [
      { drivers: ["DAVID ZOLTAN", "IOZSI DAVID", "DAVID IOSIF"], company: "Fast Express" },
      { drivers: ["DANIEL OPREAN", "OPREAN DANIEL"], company: "Daniel Ontheroad" },
      { drivers: ["Stefanel"], company: "DE Cargo Speed" },
      { drivers: ["FLORIN OPREAN", "OPREAN FLORIN"], company: "Florin Cargo" },
      { drivers: ["VALENTIN OPREAN", "OPREAN VALENTIN"], company: "TRANSVAL SRL" },
      { drivers: ["DUNAREANU PAUL", "PAUL DUNAREANU"], company: "TRANS DUNAREA" },
      { drivers: ["MOLDOVAN VALENTIN", "VALENTIN MOLDOVAN"], company: "TRANS VALI" },
      { drivers: ["IOAN MOLDOVAN", "MOLDOVAN IOAN"], company: "TRANEXPO" },
      { drivers: ["ELEFANT LUCIAN", "LUCIAN ELEFANT"], company: "TRANS ELEFANT" },
      { drivers: ["VLAD EVERTRANS", "EVERTRANS VLAD"], company: "EVERTRANS" },
    ];

    // Create drivers
    for (const mapping of driverMappings) {
      const company = createdCompanies.find(c => c.name === mapping.company);
      if (company) {
        const primaryName = mapping.drivers[0];
        const nameVariants = mapping.drivers;
        
        await storage.createDriver({
          name: primaryName,
          companyId: company.id,
          nameVariants: nameVariants,
        });
      }
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed database on startup
  await seedDatabase();

  // Company routes
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  // Driver routes
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  // Weekly processing routes
  app.get("/api/processing/:weekLabel", async (req, res) => {
    try {
      const { weekLabel } = req.params;
      const processing = await storage.getWeeklyProcessing(weekLabel);
      res.json(processing || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processing data" });
    }
  });

  app.post("/api/processing", async (req, res) => {
    try {
      const validatedData = insertWeeklyProcessingSchema.parse(req.body);
      const existing = await storage.getWeeklyProcessing(validatedData.weekLabel);
      
      if (existing) {
        const updated = await storage.updateWeeklyProcessing(validatedData.weekLabel, validatedData);
        res.json(updated);
      } else {
        const created = await storage.createWeeklyProcessing(validatedData);
        res.json(created);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to save processing data" });
    }
  });

  // Payment routes
  app.get("/api/payments", async (req, res) => {
    try {
      const { weekLabel } = req.query;
      
      if (weekLabel) {
        const payments = await storage.getPaymentsByWeek(weekLabel as string);
        res.json(payments);
      } else {
        const payments = await storage.getAllPayments();
        res.json(payments);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      
      // Create history record
      await storage.createPaymentHistoryRecord({
        paymentId: payment.id,
        action: "created",
        previousData: null,
      });
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  app.put("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Get current payment for history
      const currentPayments = await storage.getAllPayments();
      const currentPayment = currentPayments.find(p => p.id === id);
      
      const updatedPayment = await storage.updatePayment(id, updateData);
      
      // Create history record
      await storage.createPaymentHistoryRecord({
        paymentId: id,
        action: "updated",
        previousData: currentPayment,
      });
      
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get current payment for history
      const currentPayments = await storage.getAllPayments();
      const currentPayment = currentPayments.find(p => p.id === id);
      
      await storage.deletePayment(id);
      
      // Create history record
      if (currentPayment) {
        await storage.createPaymentHistoryRecord({
          paymentId: id,
          action: "deleted",
          previousData: currentPayment,
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  // Payment history routes
  app.get("/api/payment-history", async (req, res) => {
    try {
      const { paymentId } = req.query;
      const history = await storage.getPaymentHistory(
        paymentId ? parseInt(paymentId as string) : undefined
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payment history" });
    }
  });

  // Weekly processing routes
  app.post("/api/weekly-processing", async (req, res) => {
    try {
      const { weekLabel, data, processedAt } = req.body;
      
      const weeklyProcessingData = {
        weekLabel,
        processingDate: processedAt ? new Date(processedAt) : new Date(),
        tripDataCount: 0,
        invoice7Count: 0, 
        invoice30Count: 0,
        processedData: data
      };

      const savedProcessing = await storage.createWeeklyProcessing(weeklyProcessingData);
      res.json(savedProcessing);
    } catch (error) {
      console.error("Error saving weekly processing:", error);
      res.status(500).json({ error: "Failed to save processed data" });
    }
  });

  app.get("/api/weekly-processing", async (req, res) => {
    try {
      const { weekLabel } = req.query;
      
      if (weekLabel) {
        const processing = await storage.getWeeklyProcessingByWeek(weekLabel as string);
        res.json(processing);
      } else {
        const allProcessing = await storage.getAllWeeklyProcessing();
        res.json(allProcessing);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly processing data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
