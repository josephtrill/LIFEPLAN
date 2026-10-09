// src/middleware/authMiddleware.ts
// Middleware to protect routes that require authentication

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export function protect(req: Request, res: Response, next: NextFunction): void {
  try {
    // Check if the JWT cookie exists
    const token = req.cookies.jwt;

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Not authorized to access this route. Please log in.' 
      });
      return; // Stop execution
    }

    // Verify the token using the secret key
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach the decoded user ID to the request object so future routes can use it
    // We cast to any to bypass TS typing limitations for the Request object here
    (req as any).user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token is invalid or expired. Please log in again.' 
    });
  }
}
