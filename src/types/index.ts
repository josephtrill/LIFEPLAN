// src/types/index.ts
// Shared TypeScript type definitions for LifePlan
// This file will grow as we add more features in future phases.

/**
 * Standard API response format.
 * Every API endpoint will return data in this shape.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Health check response from GET /api/health
 */
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

/**
 * Database test response from GET /api/db-test
 */
export interface DbTestResponse {
  connected: boolean;
  serverTime: string;
}

export * from './schema';
