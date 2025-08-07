import { 
  type User,
  type UpsertUser,
  type Medication, 
  type InsertMedication,
  type MedicationLog,
  type InsertMedicationLog,
  type JournalEntry,
  type InsertJournalEntry,
  type CycleTracking,
  type InsertCycleTracking,
  users,
  medications,
  medicationLogs,
  journalEntries,
  cycleTracking
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; passwordHash: string; firstName: string; lastName: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;

  // Medications
  getMedications(userId: string): Promise<Medication[]>;
  getMedication(id: string): Promise<Medication | undefined>;
  createMedication(userId: string, medication: InsertMedication): Promise<Medication>;
  updateMedication(id: string, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: string): Promise<boolean>;

  // Medication Logs
  getMedicationLogs(userId: string, date?: Date, medicationId?: string): Promise<MedicationLog[]>;
  getMedicationLog(id: string): Promise<MedicationLog | undefined>;
  createMedicationLog(userId: string, log: InsertMedicationLog): Promise<MedicationLog>;
  updateMedicationLog(id: string, log: Partial<InsertMedicationLog>): Promise<MedicationLog | undefined>;

  // Journal Entries
  getJournalEntries(userId: string, limit?: number): Promise<JournalEntry[]>;
  getJournalEntry(userId: string, date: Date): Promise<JournalEntry | undefined>;
  createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: string, entry: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;

  // Cycle Tracking
  getCycleTrackings(userId: string): Promise<CycleTracking[]>;
  getCurrentCycle(userId: string): Promise<CycleTracking | undefined>;
  createCycleTracking(userId: string, cycle: InsertCycleTracking): Promise<CycleTracking>;
  updateCycleTracking(id: string, cycle: Partial<InsertCycleTracking>): Promise<CycleTracking | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: { email: string; passwordHash: string; firstName: string; lastName: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  // Medications
  async getMedications(userId: string): Promise<Medication[]> {
    return await db.select().from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.isActive, true)));
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(eq(medications.id, id));
    return medication;
  }

  async createMedication(userId: string, insertMedication: InsertMedication): Promise<Medication> {
    console.log("Storage: Creating medication with data:", {
      userId,
      name: insertMedication.name,
      strength: insertMedication.strength,
      dosage: insertMedication.dosage,
      frequency: insertMedication.frequency
    });
    
    try {
      const [medication] = await db
        .insert(medications)
        .values({ ...insertMedication, userId })
        .returning();
      console.log("Storage: Medication created successfully:", medication.id);
      return medication;
    } catch (error) {
      console.error("Storage: Error creating medication:", error);
      throw error;
    }
  }

  async updateMedication(id: string, updates: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [medication] = await db
      .update(medications)
      .set(updates)
      .where(eq(medications.id, id))
      .returning();
    return medication;
  }

  async deleteMedication(id: string): Promise<boolean> {
    const [medication] = await db
      .update(medications)
      .set({ isActive: false })
      .where(eq(medications.id, id))
      .returning();
    return !!medication;
  }

  // Medication Logs
  async getMedicationLogs(userId: string, date?: Date, medicationId?: string): Promise<MedicationLog[]> {
    let conditions = [eq(medicationLogs.userId, userId)];
    
    if (medicationId) {
      conditions.push(eq(medicationLogs.medicationId, medicationId));
    }
    
    return await db.select().from(medicationLogs).where(and(...conditions));
  }

  async getMedicationLog(id: string): Promise<MedicationLog | undefined> {
    const [log] = await db.select().from(medicationLogs).where(eq(medicationLogs.id, id));
    return log;
  }

  async createMedicationLog(userId: string, insertLog: InsertMedicationLog): Promise<MedicationLog> {
    const [log] = await db
      .insert(medicationLogs)
      .values({ ...insertLog, userId })
      .returning();
    return log;
  }

  async updateMedicationLog(id: string, updates: Partial<InsertMedicationLog>): Promise<MedicationLog | undefined> {
    const [log] = await db
      .update(medicationLogs)
      .set(updates)
      .where(eq(medicationLogs.id, id))
      .returning();
    return log;
  }

  // Journal Entries
  async getJournalEntries(userId: string, limit: number = 10): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.date))
      .limit(limit);
  }

  async getJournalEntry(userId: string, date: Date): Promise<JournalEntry | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    console.log(`Looking for journal entry for user ${userId} on date ${dateStr}`);
    
    // Create start and end of day timestamps to handle timezone issues
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
    
    console.log(`Searching between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);
    
    const [entry] = await db.select().from(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        sql`${journalEntries.date} >= ${startOfDay}`,
        sql`${journalEntries.date} <= ${endOfDay}`
      ))
      .limit(1);
      
    console.log(`Found journal entry:`, entry ? 'YES' : 'NO');
    return entry;
  }

  async createJournalEntry(userId: string, insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    console.log(`Creating journal entry for user ${userId} with date:`, insertEntry.date);
    const [entry] = await db
      .insert(journalEntries)
      .values({ 
        ...insertEntry, 
        userId,
        symptoms: insertEntry.symptoms || []
      })
      .returning();
    console.log(`Created journal entry with stored date:`, entry.date);
    return entry;
  }

  async updateJournalEntry(id: string, updates: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .update(journalEntries)
      .set(updates)
      .where(eq(journalEntries.id, id))
      .returning();
    return entry;
  }

  // Cycle Tracking
  async getCycleTrackings(userId: string): Promise<CycleTracking[]> {
    return await db.select().from(cycleTracking)
      .where(eq(cycleTracking.userId, userId))
      .orderBy(desc(cycleTracking.periodStartDate));
  }

  async getCurrentCycle(userId: string): Promise<CycleTracking | undefined> {
    const [cycle] = await db.select().from(cycleTracking)
      .where(eq(cycleTracking.userId, userId))
      .orderBy(desc(cycleTracking.periodStartDate))
      .limit(1);
    return cycle;
  }

  async createCycleTracking(userId: string, insertCycle: InsertCycleTracking): Promise<CycleTracking> {
    const [cycle] = await db
      .insert(cycleTracking)
      .values({ ...insertCycle, userId })
      .returning();
    return cycle;
  }

  async updateCycleTracking(id: string, updates: Partial<InsertCycleTracking>): Promise<CycleTracking | undefined> {
    const [cycle] = await db
      .update(cycleTracking)
      .set(updates)
      .where(eq(cycleTracking.id, id))
      .returning();
    return cycle;
  }
}

export const storage = new DatabaseStorage();
