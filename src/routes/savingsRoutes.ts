// src/routes/savingsRoutes.ts
// Maps Savings Tracker REST API routes

import { Router } from 'express';
import {
  getSavings,
  getSavingsSummary,
  getSavingsGoalById,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  depositToGoal,
} from '../controllers/savingsController';

const router = Router();

// Summary route MUST precede /:id
router.get('/summary', getSavingsSummary);

// Standard CRUD
router.get('/', getSavings);
router.post('/', createSavingsGoal);
router.get('/:id', getSavingsGoalById);
router.put('/:id', updateSavingsGoal);
router.delete('/:id', deleteSavingsGoal);

// Deposit endpoint
router.post('/:id/deposit', depositToGoal);

export default router;
