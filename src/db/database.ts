// src/db/database.ts
// Supabase (PostgreSQL) connection using the `pg` driver.
//
// NOTE: readData/writeData (JSON file) are kept at the bottom ONLY so the
// services that have not been converted yet (expenses, savings, etc.) still
// compile. They will NOT work on Vercel (read-only filesystem). Convert each
// service to use query() and then delete them.

import { Pool, QueryResultRow } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const connectionString = process.env.DATABASE_URL;

// Prints only true/false (never the password). Remove once everything works.
console.log('DATABASE_URL set?', !!connectionString);

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set. Add it in .env (local) or Vercel Environment Variables (Production), then redeploy.');
}

// Supabase requires SSL. Use the "Transaction pooler" connection string (port 6543)
// so serverless functions on Vercel do not exhaust database connections.
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

/**
 * Run a parameterized SQL query.
 * Usage: const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
 */
export async function query<T extends QueryResultRow = any>(text: string, params: any[] = []) {
  // Fail with a clear message instead of silently trying localhost (ECONNREFUSED 127.0.0.1)
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set on the server');
  }

  try {
    return await pool.query<T>(text, params);
  } catch (error: any) {
    console.error('❌ Database query failed:', error.message);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

/**
 * Checks that the database is reachable. Returns true if successful.
 */
export async function testConnection(): Promise<boolean> {
  if (!connectionString) {
    console.error('❌ Supabase database connection test failed: DATABASE_URL is not set');
    return false;
  }

  try {
    await pool.query('SELECT 1');
    console.log('✅ Supabase database connection test passed.');
    return true;
  } catch (error: any) {
    console.error('❌ Supabase database connection test failed:', error.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// LEGACY JSON FILE HELPERS (temporary, do not use in new code)
// ---------------------------------------------------------------------------
const DB_PATH = path.join(__dirname, '..', '..', 'database', 'data.json');

export async function readData(): Promise<any> {
  try {
    const fileContent = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    console.error('❌ Error reading database:', error.message);
    throw new Error('Database read failed');
  }
}

export async function writeData(data: any): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('❌ Error writing to database:', error.message);
    throw new Error('Database write failed');
  }
}
