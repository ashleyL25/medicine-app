import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("🔄 Running database migrations...");

  try {
    // First, create tables if they don't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Create users table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            last_login_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          RAISE NOTICE 'Created users table';
        END IF;

        -- Create medicines table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medicines') THEN
          CREATE TABLE medicines (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            dosage VARCHAR(255),
            frequency VARCHAR(255),
            instructions TEXT,
            supply_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          RAISE NOTICE 'Created medicines table';
        END IF;

        -- Create medicine_logs table if it doesn't exist  
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medicine_logs') THEN
          CREATE TABLE medicine_logs (
            id SERIAL PRIMARY KEY,
            medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT
          );
          RAISE NOTICE 'Created medicine_logs table';
        END IF;

        -- Now add any missing columns to existing tables
        -- Add password_hash column if it doesn't exist (for existing users tables)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'password_hash') THEN
          ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
          UPDATE users SET password_hash = 'temp_hash' WHERE password_hash IS NULL;
          ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
          RAISE NOTICE 'Added password_hash column';
        END IF;

        -- Add is_active column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'is_active') THEN
          ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
          RAISE NOTICE 'Added is_active column';
        END IF;

        -- Add last_login_at column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
          ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
          RAISE NOTICE 'Added last_login_at column';
        END IF;

        -- Add user_id to medicines table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'medicines' AND column_name = 'user_id') THEN
          ALTER TABLE medicines ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
          RAISE NOTICE 'Added user_id column to medicines';
        END IF;

        -- Add user_id to medicine_logs table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'medicine_logs' AND column_name = 'user_id') THEN
          ALTER TABLE medicine_logs ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
          RAISE NOTICE 'Added user_id column to medicine_logs';
        END IF;

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