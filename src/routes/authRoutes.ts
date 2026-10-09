// src/routes/authRoutes.ts
// Maps authentication URLs to their respective controller functions

import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes (requires a valid JWT token)
// By adding the 'protect' middleware, getMe will only run if the user is logged in
router.get('/me', protect, getMe);

export default router;
