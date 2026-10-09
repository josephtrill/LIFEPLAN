// src/server.ts
// LifePlan — Main Express Server
// This is the entry point of the application.
// It sets up Express, serves static files, and defines test routes.

import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { testConnection } from './db/database';
import { ApiResponse, HealthCheckResponse, DbTestResponse } from './types';
import authRoutes from './routes/authRoutes';
import expenseRoutes from './routes/expenseRoutes';
import budgetRoutes from './routes/budgetRoutes';
import savingsRoutes from './routes/savingsRoutes';
import { protect } from './middleware/authMiddleware';

// Load environment variables from .env file
dotenv.config();

// Create the Express application
const app = express();

// Get the port from .env or use 3000 as default
const PORT = parseInt(process.env.PORT || '3000');

// =============================================
// MIDDLEWARE
// =============================================

// Enable CORS (Cross-Origin Resource Sharing)
// This allows the frontend to make API requests to the backend
app.use(cors());

// Parse JSON request bodies (for POST/PUT requests)
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Parse cookies (used for JWT session tokens)
app.use(cookieParser());

// Serve static files (HTML, CSS, JS) from the 'public' folder
// When someone visits http://localhost:3000, Express will serve public/index.html
app.use(express.static(path.join(__dirname, '..', 'public')));

// =============================================
// API ROUTES
// =============================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Expense routes (protected — requires login)
app.use('/api/expenses', protect, expenseRoutes);

// Budget routes (protected — requires login)
app.use('/api/budget', protect, budgetRoutes);

// Savings routes (protected — requires login)
app.use('/api/savings', protect, savingsRoutes);

/**
 * GET /api/health
 * Health check endpoint — verifies the server is running.
 * Returns the server status, current time, and uptime.
 */
app.get('/api/health', (_req: Request, res: Response) => {
  const response: ApiResponse<HealthCheckResponse> = {
    success: true,
    message: 'LifePlan server is running',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  };
  res.json(response);
});

/**
 * GET /api/db-test
 * Database connection test — verifies PostgreSQL is connected.
 * Runs a simple SELECT NOW() query and returns the result.
 */
app.get('/api/db-test', async (_req: Request, res: Response) => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) throw new Error('Database test failed');
    
    const response: ApiResponse<DbTestResponse> = {
      success: true,
      message: 'Database connection successful',
      data: {
        connected: true,
        serverTime: new Date().toISOString(),
      },
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<DbTestResponse> = {
      success: false,
      message: 'Database connection failed: ' + error.message,
      data: {
        connected: false,
        serverTime: '',
      },
    };
    res.status(500).json(response);
  }
});

// =============================================
// START THE SERVER
// =============================================

app.listen(PORT, async () => {
  console.log('');
  console.log('=============================================');
  console.log('  🚀 LifePlan Server Started');
  console.log('=============================================');
  console.log(`  🌐 URL:  http://localhost:${PORT}`);
  console.log(`  📁 Mode: Development`);
  console.log('=============================================');
  console.log('');

  // Test the database connection on startup
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.log('');
    console.log('⚠️  The server is running but the database is not connected.');
    console.log('   Make sure PostgreSQL is running and the "lifeplan" database exists.');
    console.log('   You can still view the welcome page at http://localhost:' + PORT);
    console.log('');
  }
});

// Export the app for testing purposes
export default app;
