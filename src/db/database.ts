// src/db/database.ts
// Local JSON File Database
// This replaces PostgreSQL with a simple JSON file for storage.

import fs from 'fs/promises';
import path from 'path';

// The path to our JSON database file
const DB_PATH = path.join(__dirname, '..', '..', 'database', 'data.json');

/**
 * Reads all data from the JSON database file.
 */
export async function readData(): Promise<any> {
  try {
    const fileContent = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    console.error('❌ Error reading database:', error.message);
    throw new Error('Database read failed');
  }
}

/**
 * Writes data back to the JSON database file.
 * @param data The full JSON object to save
 */
export async function writeData(data: any): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('❌ Error writing to database:', error.message);
    throw new Error('Database write failed');
  }
}

/**
 * Helper to ensure the database file exists and is accessible.
 * Returns true if successful.
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Attempt to read the file to ensure it exists and is valid JSON
    await readData();
    console.log('✅ JSON Database connection test passed.');
    return true;
  } catch (error: any) {
    console.error('❌ JSON Database connection test failed:', error.message);
    return false;
  }
}
