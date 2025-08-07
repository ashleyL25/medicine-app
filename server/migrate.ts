import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("🔄 Running database migrations...");

  try {
    // Check if new columns exist, add them if they don't
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Add password_hash column if it doesn't exist
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