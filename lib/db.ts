import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "@/lib/schema"

let pool: Pool | null = null

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not configured")
  }

  if (!pool) {
    pool = new Pool({ connectionString: url })
  }

  return drizzle(pool, { schema })
}

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL)
}
