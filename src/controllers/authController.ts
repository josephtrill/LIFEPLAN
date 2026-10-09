// src/controllers/authController.ts
// Handles the HTTP request/response flow for authentication

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as authService from '../services/authService';

// The secret key used to sign the tokens
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

/**
 * Helper function to generate a JWT token and set it as an HTTP-only cookie
 */
function sendTokenResponse(user: any, statusCode: number, res: Response, message: string) {
  // Generate the token containing the user's ID
  const token = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  // Set the token as a cookie
  // httpOnly: true ensures the cookie can't be accessed by client-side JS (prevents XSS)
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });

  // Send the successful response
  res.status(statusCode).json({
    success: true,
    message,
    data: { user }
  });
}

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide all required fields' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      return;
    }

    const newUser = await authService.registerUser(username, email, password);
    sendTokenResponse(newUser, 201, res, 'Registration successful');
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      res.status(400).json({ success: false, message: 'Please provide email/username and password' });
      return;
    }

    const user = await authService.loginUser(usernameOrEmail, password);
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error: any) {
    // 401 Unauthorized for bad credentials
    res.status(401).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  // Clear the JWT cookie
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // expire in 10 seconds
    httpOnly: true
  });
  
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

/**
 * GET /api/auth/me
 * Retrieves the currently logged-in user based on their JWT token
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    // Note: req.user is set by the authMiddleware (which runs before this function)
    // We cast it to any here to avoid TS errors, since we haven't extended the Request type globally yet
    const userId = (req as any).user.id;
    const user = await authService.getUserById(userId);
    
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: { user }
    });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
}
