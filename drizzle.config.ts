import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables for Drizzle Kit CLI
config({ path: ".env" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ||
      "postgresql://alfaaz:alfaaz_dev_password@localhost:5432/alfaaz_dev",
  },
  verbose: true,
  strict: true,
});
