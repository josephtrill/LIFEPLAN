// src/services/authService.ts
// Handles the business logic for user authentication (Register & Login)

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { readData, writeData } from '../db/database';
import { User } from '../types';

/**
 * Registers a new user.
 * @returns The newly created user object (without the password).
 */
export async function registerUser(username: string, email: string, passwordRaw: string) {
  // 1. Read the database
  const db = await readData();

  // 2. Check if the user already exists
  const existingUser = db.users.find(
    (u: User) => u.username === username || u.email === email
  );
  if (existingUser) {
    throw new Error('Username or email is already in use');
  }

  // 3. Hash the password for security
  // We use 10 salt rounds — a standard balance of security and performance
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(passwordRaw, saltRounds);

  // 4. Create the new user object
  const newUser: User = {
    id: crypto.randomUUID(), // Generate a unique ID
    username,
    email,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };

  // 5. Save to database
  db.users.push(newUser);
  await writeData(db);

  // 6. Return the user (exclude password hash)
  const { password_hash, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Logs in a user by verifying their credentials.
 * @returns The authenticated user object (without the password).
 */
export async function loginUser(usernameOrEmail: string, passwordRaw: string) {
  // 1. Read the database
  const db = await readData();

  // 2. Find the user by username OR email
  const user = db.users.find(
    (u: User) => u.username === usernameOrEmail || u.email === usernameOrEmail
  );
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // 3. Compare the provided password with the stored hash
  const isMatch = await bcrypt.compare(passwordRaw, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // 4. Return the user (exclude password hash)
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Finds a user by their ID (used to fetch the current logged-in user).
 */
export async function getUserById(id: string) {
  const db = await readData();
  const user = db.users.find((u: User) => u.id === id);
  if (!user) throw new Error('User not found');
  
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
