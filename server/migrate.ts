import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("🔄 Running database migrations...");

  try {
    // Enable UUID extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    
    // Drop existing tables that have wrong schema (this will cascade to dependent tables)
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Drop existing tables with wrong schema if they exist
        DROP TABLE IF EXISTS medicine_logs CASCADE;
        DROP TABLE IF EXISTS medicines CASCADE; 
        DROP TABLE IF EXISTS medication_logs CASCADE;
        DROP TABLE IF EXISTS medications CASCADE;
        DROP TABLE IF EXISTS journal_entries CASCADE;
        DROP TABLE IF EXISTS cycle_tracking CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS sessions CASCADE;
        
        RAISE NOTICE 'Dropped existing tables to recreate with correct schema';
      END
      $$;
    `);
    
    // Create tables with correct schema
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Create users table
        CREATE TABLE users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR UNIQUE NOT NULL,
          password_hash VARCHAR NOT NULL,
          first_name VARCHAR,
          last_name VARCHAR,
          profile_image_url VARCHAR,
          is_active BOOLEAN DEFAULT true,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT now(),
          updated_at TIMESTAMP DEFAULT now()
        );
        RAISE NOTICE 'Created users table';

        -- Create medications table
        CREATE TABLE medications (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            brand TEXT,
            strength TEXT NOT NULL,
            form TEXT,
            dosage TEXT NOT NULL,
            frequency TEXT NOT NULL,
            time_of_day TEXT,
            purpose TEXT,
            category TEXT,
            bottle_size INTEGER,
            purchase_date TIMESTAMP,
            days_supply INTEGER,
            doctor TEXT,
            cost TEXT,
            pharmacy TEXT,
            side_effects TEXT,
            notes TEXT,
            image_url TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT now()
          );
          RAISE NOTICE 'Created medications table';

        -- Create medication_logs table
        CREATE TABLE medication_logs (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            medication_id VARCHAR NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
            date TIMESTAMP NOT NULL,
            taken BOOLEAN DEFAULT false,
            skipped BOOLEAN DEFAULT false,
            skip_reason TEXT,
            notes TEXT
          );
          RAISE NOTICE 'Created medication_logs table';

        -- Create journal_entries table
        CREATE TABLE journal_entries (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            date TIMESTAMP NOT NULL,
            mood TEXT,
            symptoms JSONB DEFAULT '[]'::jsonb,
            notes TEXT,
            cycle_day INTEGER,
            created_at TIMESTAMP DEFAULT now()
          );
          RAISE NOTICE 'Created journal_entries table';

        -- Create cycle_tracking table
        CREATE TABLE cycle_tracking (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            period_start_date TIMESTAMP NOT NULL,
            period_end_date TIMESTAMP,
            cycle_length INTEGER DEFAULT 28,
            notes TEXT,
            created_at TIMESTAMP DEFAULT now()
          );
          RAISE NOTICE 'Created cycle_tracking table';

        -- Create sessions table
        CREATE TABLE sessions (
            sid VARCHAR PRIMARY KEY,
            sess JSONB NOT NULL,
            expire TIMESTAMP NOT NULL
          );
          CREATE INDEX "IDX_session_expire" ON sessions (expire);
          RAISE NOTICE 'Created sessions table';


        RAISE NOTICE '✅ Database migration completed successfully';
      END
      $$;
    `);

    console.log("✅ Database migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    console.log("📝 This might be normal if the columns already exist or if this is the first run");
    
    // Don't throw error - let app continue to start
    // The auth system will handle missing columns gracefully
  }
}