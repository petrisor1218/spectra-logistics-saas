#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { secondaryDb } from "../server/db-secondary.js";
import { tenants, tenantUsers, systemMetrics } from "../shared/schema-secondary.js";
import { users, companies, drivers, payments, transportOrders, orderSequence } from "../shared/schema.js";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Începe popularea bazelor de date cu date de test...");

  try {
    // Popularea bazei de date secundare (admin)
    console.log("📊 Popularea bazei de date secundare...");

    // Creează un tenant de test
    const [testTenant] = await secondaryDb.insert(tenants).values({
      name: "Transport Express Test",
      subdomain: "test-transport",
      contactEmail: "admin@test-transport.ro",
      contactPhone: "+40 123 456 789",
      companyName: "Transport Express SRL",
      databaseUrl: process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test_db",
      databaseName: "test_transport_db",
      status: "active",
      subscriptionStatus: "active",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 zile
      promotionalEndsAt: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000), // 3 luni
      monthlyRecurringRevenue: 99.99,
      totalRevenue: 299.97,
    }).returning();

    console.log(`✅ Tenant creat: ${testTenant.name} (ID: ${testTenant.id})`);

    // Creează un utilizator admin pentru tenant
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const [adminUser] = await secondaryDb.insert(tenantUsers).values({
      tenantId: testTenant.id,
      userId: 1, // Va fi creat în baza tenantului
      email: "admin@test-transport.ro",
      firstName: "Admin",
      lastName: "Test",
      role: "admin",
    }).returning();

    console.log(`✅ Utilizator admin creat: ${adminUser.email}`);

    // Adaugă metrici de sistem
    await secondaryDb.insert(systemMetrics).values([
      {
        metricType: "mrr",
        metricValue: 99.99,
        metricData: { tenantCount: 1 }
      },
      {
        metricType: "active_tenants",
        metricValue: 1,
        metricData: { totalTenants: 1 }
      },
      {
        metricType: "trial_tenants",
        metricValue: 0,
        metricData: { totalTenants: 1 }
      }
    ]);

    console.log("✅ Metrici de sistem adăugate");

    // Popularea bazei de date a tenantului (dacă există)
    if (process.env.DATABASE_URL) {
      console.log("🏢 Popularea bazei de date a tenantului...");
      
      const mainSql = neon(process.env.DATABASE_URL);
      const mainDb = drizzle(mainSql);

      // Creează utilizatorul admin
      const [user] = await mainDb.insert(users).values({
        username: "admin@test-transport.ro",
        email: "admin@test-transport.ro",
        firstName: "Admin",
        lastName: "Test",
        password: hashedPassword,
        role: "admin",
        tenantId: 1,
        companyName: "Transport Express SRL",
        subscriptionStatus: "active",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }).returning();

      console.log(`✅ Utilizator creat în baza tenantului: ${user.username}`);

      // Creează companii de test
      const [company1] = await mainDb.insert(companies).values({
        name: "DE Cargo Speed",
        commissionRate: 0.15,
        cif: "RO12345678",
        tradeRegisterNumber: "J40/1234/2020",
        address: "Strada Transportului, Nr. 1, București",
        location: "București",
        county: "București",
        tenantId: 1,
      }).returning();

      const [company2] = await mainDb.insert(companies).values({
        name: "Fast Express",
        commissionRate: 0.12,
        cif: "RO87654321",
        tradeRegisterNumber: "J40/5678/2021",
        address: "Strada Vitezei, Nr. 10, Cluj",
        location: "Cluj",
        county: "Cluj",
        tenantId: 1,
      }).returning();

      console.log(`✅ Companii create: ${company1.name}, ${company2.name}`);

      // Creează șoferi de test
      await mainDb.insert(drivers).values([
        {
          name: "Ion Popescu",
          companyId: company1.id,
          nameVariants: ["I. Popescu", "Popescu Ion"],
          phone: "+40 123 456 789",
          email: "ion.popescu@email.com",
          tenantId: 1,
        },
        {
          name: "Maria Ionescu",
          companyId: company1.id,
          nameVariants: ["M. Ionescu", "Ionescu Maria"],
          phone: "+40 987 654 321",
          email: "maria.ionescu@email.com",
          tenantId: 1,
        },
        {
          name: "Vasile Dumitrescu",
          companyId: company2.id,
          nameVariants: ["V. Dumitrescu", "Dumitrescu Vasile"],
          phone: "+40 555 123 456",
          email: "vasile.dumitrescu@email.com",
          tenantId: 1,
        }
      ]);

      console.log("✅ Șoferi creați");

      // Creează plăți de test
      await mainDb.insert(payments).values([
        {
          companyName: "DE Cargo Speed",
          amount: 1500.00,
          description: "Plată pentru săptămâna 1-7 iulie 2024",
          weekLabel: "Jul 1 - Jul 7, 2024",
          paymentType: "full",
          tenantId: 1,
        },
        {
          companyName: "Fast Express",
          amount: 2200.00,
          description: "Plată pentru săptămâna 8-14 iulie 2024",
          weekLabel: "Jul 8 - Jul 14, 2024",
          paymentType: "full",
          tenantId: 1,
        }
      ]);

      console.log("✅ Plăți create");

      // Creează comenzi de transport de test
      await mainDb.insert(transportOrders).values([
        {
          orderNumber: "TO-1554",
          companyName: "DE Cargo Speed",
          orderDate: new Date("2024-07-15"),
          weekLabel: "Jul 15 - Jul 21, 2024",
          vrids: ["T-114QYYSH3", "T-115QYYSH4"],
          totalAmount: 2500.00,
          route: "DE-BE-NL",
          status: "confirmed",
          tenantId: 1,
        },
        {
          orderNumber: "TO-1555",
          companyName: "Fast Express",
          orderDate: new Date("2024-07-16"),
          weekLabel: "Jul 15 - Jul 21, 2024",
          vrids: ["T-116QYYSH5"],
          totalAmount: 1800.00,
          route: "DE-BE-NL",
          status: "draft",
          tenantId: 1,
        }
      ]);

      console.log("✅ Comenzi de transport create");

      // Inițializează secvența pentru numerele de comandă
      await mainDb.insert(orderSequence).values({
        currentNumber: 1556,
        tenantId: 1,
      });

      console.log("✅ Secvența pentru comenzi inițializată");
    }

    console.log("🎉 Popularea bazelor de date finalizată cu succes!");
    console.log("\n📋 Credențiale de test:");
    console.log("   Email: admin@test-transport.ro");
    console.log("   Parolă: admin123");
    console.log("   Subdomain: test-transport");
    console.log("\n🌐 Accesează platforma la:");
    console.log("   http://test-transport.localhost:5000");

  } catch (error) {
    console.error("❌ Eroare la popularea bazelor de date:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Eroare fatală:", error);
  process.exit(1);
});
