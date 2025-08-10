import { Router } from "express";
import { storage } from "../storage";
import { insertVehicleSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Get all vehicles
router.get("/", async (req, res) => {
  try {
    const vehicles = await storage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// Get vehicles by company
router.get("/company/:companyId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const vehicles = await storage.getVehiclesByCompany(companyId);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles by company:", error);
    res.status(500).json({ error: "Failed to fetch vehicles by company" });
  }
});

// Create new vehicle
router.post("/", async (req, res) => {
  try {
    const vehicleData = insertVehicleSchema.parse(req.body);
    const vehicle = await storage.createVehicle(vehicleData);
    res.status(201).json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid vehicle data", details: error.errors });
    }
    console.error("Error creating vehicle:", error);
    res.status(500).json({ error: "Failed to create vehicle" });
  }
});

// Update vehicle
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const vehicleData = insertVehicleSchema.partial().parse(req.body);
    const vehicle = await storage.updateVehicle(id, vehicleData);
    res.json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid vehicle data", details: error.errors });
    }
    console.error("Error updating vehicle:", error);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

// Delete vehicle
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteVehicle(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});

export default router;