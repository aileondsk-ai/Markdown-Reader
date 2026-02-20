import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL is not set. Database features will not work.",
  );
}

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : (null as any);

const noDB = new Proxy({} as any, {
  get() {
    throw new Error(
      "DATABASE_URL is not configured. Set it in your Vercel environment variables.",
    );
  },
});

export const db = pool ? drizzle(pool, { schema }) : noDB;
