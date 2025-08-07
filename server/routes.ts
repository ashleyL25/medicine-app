import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Use proper JWT authentication
import { setupAuth, isAuthenticated } from "./auth";
import { insertMedicationSchema, insertMedicationLogSchema, insertJournalEntrySchema, insertCycleTrackingSchema } from "@shared/schema";
import { z } from "zod";

// Interface to extend Request with user property
interface RequestWithUser {
  user: {
    claims: {
      sub: string;
    };
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (no auth required)
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV 
    });
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes are now handled in setupAuth() function
  
  // Medications
  app.get("/api/medications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const medications = await storage.getMedications(userId);
      res.json(medications);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.get("/api/medications/:id", isAuthenticated, async (req, res) => {
    try {
      const medication = await storage.getMedication(req.params.id);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      res.json(medication);
    } catch (error) {
      console.error("Error fetching medication:", error);
      res.status(500).json({ message: "Failed to fetch medication" });
    }
  });

  app.post("/api/medications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      console.log("Creating medication for user:", userId);
      console.log("Request body length:", JSON.stringify(req.body).length);
      console.log("Request body keys:", Object.keys(req.body));
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      // Check if all required fields are present
      const requiredFields = ['name', 'strength', 'dosage', 'frequency'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        return res.status(400).json({ message: "Missing required fields", missingFields });
      }
      
      const validatedData = insertMedicationSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      const medication = await storage.createMedication(userId, validatedData);
      console.log("Created medication:", JSON.stringify(medication, null, 2));
      res.status(201).json(medication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid medication data", errors: error.errors });
      }
      console.error("Error creating medication:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create medication", error: error.message });
    }
  });

  app.patch("/api/medications/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMedicationSchema.partial().parse(req.body);
      const medication = await storage.updateMedication(req.params.id, validatedData);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      res.json(medication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid medication data", errors: error.errors });
      }
      console.error("Error updating medication:", error);
      res.status(500).json({ message: "Failed to update medication" });
    }
  });

  app.delete("/api/medications/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteMedication(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Medication not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting medication:", error);
      res.status(500).json({ message: "Failed to delete medication" });
    }
  });

  // Medication Logs
  app.get("/api/medication-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { date, medicationId } = req.query;
      const dateParam = date ? new Date(date as string) : undefined;
      const logs = await storage.getMedicationLogs(userId, dateParam, medicationId as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching medication logs:", error);
      res.status(500).json({ message: "Failed to fetch medication logs" });
    }
  });

  app.post("/api/medication-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const validatedData = insertMedicationLogSchema.parse(req.body);
      const log = await storage.createMedicationLog(userId, validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid log data", errors: error.errors });
      }
      console.error("Error creating medication log:", error);
      res.status(500).json({ message: "Failed to create medication log" });
    }
  });

  app.patch("/api/medication-logs/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMedicationLogSchema.partial().parse(req.body);
      const log = await storage.updateMedicationLog(req.params.id, validatedData);
      if (!log) {
        return res.status(404).json({ message: "Medication log not found" });
      }
      res.json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid log data", errors: error.errors });
      }
      console.error("Error updating medication log:", error);
      res.status(500).json({ message: "Failed to update medication log" });
    }
  });

  // Journal Entries
  app.get("/api/journal-entries", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { limit } = req.query;
      const entries = await storage.getJournalEntries(userId, limit ? parseInt(limit as string) : undefined);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal-entries/date/:date", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const date = new Date(req.params.date);
      const entry = await storage.getJournalEntry(userId, date);
      // Return null instead of 404 when no entry is found
      res.json(entry || null);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  app.post("/api/journal-entries", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const validatedData = insertJournalEntrySchema.parse(req.body);
      const entry = await storage.createJournalEntry(userId, validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid journal entry data", errors: error.errors });
      }
      console.error("Error creating journal entry:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.patch("/api/journal-entries/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertJournalEntrySchema.partial().parse(req.body);
      const entry = await storage.updateJournalEntry(req.params.id, validatedData);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid journal entry data", errors: error.errors });
      }
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  // Cycle Tracking
  app.get("/api/cycle-tracking", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const cycles = await storage.getCycleTrackings(userId);
      res.json(cycles);
    } catch (error) {
      console.error("Error fetching cycle tracking:", error);
      res.status(500).json({ message: "Failed to fetch cycle tracking" });
    }
  });

  app.get("/api/cycle-tracking/current", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const cycle = await storage.getCurrentCycle(userId);
      res.json(cycle);
    } catch (error) {
      console.error("Error fetching current cycle:", error);
      res.status(500).json({ message: "Failed to fetch current cycle" });
    }
  });

  app.post("/api/cycle-tracking", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const validatedData = insertCycleTrackingSchema.parse(req.body);
      const cycle = await storage.createCycleTracking(userId, validatedData);
      res.status(201).json(cycle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cycle tracking data", errors: error.errors });
      }
      console.error("Error creating cycle tracking:", error);
      res.status(500).json({ message: "Failed to create cycle tracking" });
    }
  });

  app.patch("/api/cycle-tracking/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCycleTrackingSchema.partial().parse(req.body);
      const cycle = await storage.updateCycleTracking(req.params.id, validatedData);
      if (!cycle) {
        return res.status(404).json({ message: "Cycle tracking not found" });
      }
      res.json(cycle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cycle tracking data", errors: error.errors });
      }
      console.error("Error updating cycle tracking:", error);
      res.status(500).json({ message: "Failed to update cycle tracking" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
