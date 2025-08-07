import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table: { expire: any }) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table  
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  brand: text("brand"),
  strength: text("strength").notNull(),
  form: text("form"), // tablet, capsule, softgel, liquid, etc.
  dosage: text("dosage").notNull(), // e.g., "1 capsule", "2 tablets"
  frequency: text("frequency").notNull(), // daily, weekly, cycle-based, etc.
  timeOfDay: text("time_of_day"), // morning, evening, etc.
  purpose: text("purpose"),
  category: text("category"), // vitamin, supplement, prescription, etc.
  bottleSize: integer("bottle_size"),
  purchaseDate: timestamp("purchase_date"),
  daysSupply: integer("days_supply"),
  doctor: text("doctor"),
  cost: text("cost"),
  pharmacy: text("pharmacy"),
  sideEffects: text("side_effects"),
  notes: text("notes"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const medicationLogs = pgTable("medication_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  medicationId: varchar("medication_id").notNull().references(() => medications.id),
  date: timestamp("date").notNull(),
  taken: boolean("taken").default(false),
  skipped: boolean("skipped").default(false),
  skipReason: text("skip_reason"),
  notes: text("notes"),
});

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  mood: text("mood"), // great, good, okay, low, unwell
  symptoms: jsonb("symptoms").$type<string[]>().default([]),
  notes: text("notes"),
  cycleDay: integer("cycle_day"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const cycleTracking = pgTable("cycle_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  periodStartDate: timestamp("period_start_date").notNull(),
  periodEndDate: timestamp("period_end_date"),
  cycleLength: integer("cycle_length").default(28),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }: { many: any }) => ({
  medications: many(medications),
  medicationLogs: many(medicationLogs),
  journalEntries: many(journalEntries),
  cycleTracking: many(cycleTracking),
}));

export const medicationsRelations = relations(medications, ({ one, many }: { one: any, many: any }) => ({
  user: one(users, {
    fields: [medications.userId],
    references: [users.id],
  }),
  logs: many(medicationLogs),
}));

export const medicationLogsRelations = relations(medicationLogs, ({ one }: { one: any }) => ({
  user: one(users, {
    fields: [medicationLogs.userId],
    references: [users.id],
  }),
  medication: one(medications, {
    fields: [medicationLogs.medicationId],
    references: [medications.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }: { one: any }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
}));

export const cycleTrackingRelations = relations(cycleTracking, ({ one }: { one: any }) => ({
  user: one(users, {
    fields: [cycleTracking.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true, // Don't include password hash in public schema
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

// Auth-specific schemas
export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  purchaseDate: z.union([z.string(), z.date()]).optional().transform((val: any) => {
    if (!val || val === "") return null;
    return typeof val === 'string' ? new Date(val) : val;
  }),
});

export const insertMedicationLogSchema = createInsertSchema(medicationLogs).omit({
  id: true,
  userId: true,
}).extend({
  date: z.union([z.string(), z.date()]).transform((val: any) => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  symptoms: z.array(z.string()).optional().default([]),
  date: z.union([z.string(), z.date()]).transform((val: any) => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertCycleTrackingSchema = createInsertSchema(cycleTracking).omit({
  id: true,
  userId: true,
}).extend({
  periodStartDate: z.union([z.string(), z.date()]).transform((val: any) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  periodEndDate: z.union([z.string(), z.date()]).optional().transform((val: any) => 
    val ? (typeof val === 'string' ? new Date(val) : val) : null
  ),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type MedicationLog = typeof medicationLogs.$inferSelect;
export type InsertMedicationLog = z.infer<typeof insertMedicationLogSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type CycleTracking = typeof cycleTracking.$inferSelect;
export type InsertCycleTracking = z.infer<typeof insertCycleTrackingSchema>;
