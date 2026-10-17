import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

// Load environment configuration
config({ path: ".env" });

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://qalam:qalam_dev_password@localhost:5432/qalam_dev";

  console.log("[Migration] Initializing connection to PostgreSQL...");
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool);

  try {
    console.log("[Migration] Applying SQL migrations from ./drizzle directory...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[Migration] ✓ Migrations applied successfully!");

    // Verify that the expected Better Auth tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('user', 'session', 'account', 'verification')
      ORDER BY table_name;
    `);

    const tableNames = result.rows.map((row) => row.table_name);
    console.log("[Migration] ✓ Verified existing authentication tables in database:", tableNames);

    const requiredTables = ["account", "session", "user", "verification"];
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t));

    if (missingTables.length > 0) {
      console.warn(`[Migration] Warning: missing expected tables: ${missingTables.join(", ")}`);
    } else {
      console.log("[Migration] ✓ All 4 required Better Auth tables verified.");
    }
  } catch (error: any) {
    // Sanitized error logging without leaking connection credentials
    console.error(`[Migration Error] Failed to apply migrations: ${error.message || "Unknown error"}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
