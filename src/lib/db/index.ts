import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../env";
import * as schema from "./schema";

const { Pool } = pg;

/**
 * PostgreSQL connection pool and Drizzle client instance.
 * Reads DATABASE_URL from validated environment configuration.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export type DB = typeof db;
export * from "./schema";
