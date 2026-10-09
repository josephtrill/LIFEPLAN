// src/services/authService.ts
// Handles the business logic for user authentication (Register & Login)
// Uses Supabase (PostgreSQL) instead of the JSON file.

import bcrypt from 'bcrypt';
import { query } from '../db/database';

/**
 * Registers a new user.
 * @returns The newly created user object (without the password).
 */
export async function registerUser(username: string, email: string, passwordRaw: string) {
  // 1. Check if the user already exists
  const existing = await query(
    'SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1',
    [username, email]
  );
  if (existing.rows.length > 0) {
    throw new Error('Username or email is already in use');
  }

  // 2. Hash the password (10 salt rounds)
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(passwordRaw, saltRounds);

  // 3. Insert the new user; the database generates the id and created_at
  const result = await query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, created_at`,
    [username, email, passwordHash]
  );

  // 4. Return the user (password hash is never selected)
  return result.rows[0];
}

/**
 * Logs in a user by verifying their credentials.
 * @returns The authenticated user object (without the password).
 */
export async function loginUser(usernameOrEmail: string, passwordRaw: string) {
  // 1. Find the user by username OR email
  const result = await query(
    'SELECT id, username, email, password_hash, created_at FROM users WHERE username = $1 OR email = $1 LIMIT 1',
    [usernameOrEmail]
  );
  const user = result.rows[0];
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // 2. Compare the provided password with the stored hash
  const isMatch = await bcrypt.compare(passwordRaw, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // 3. Return the user (exclude password hash)
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Finds a user by their ID (used to fetch the current logged-in user).
 */
export async function getUserById(id: string) {
  const result = await query(
    'SELECT id, username, email, created_at FROM users WHERE id = $1',
    [id]
  );
  const user = result.rows[0];
  if (!user) throw new Error('User not found');

  return user;
}
