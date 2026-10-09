// src/routes/expenseRoutes.ts
// Maps expense API endpoints to their controller functions

import { Router } from 'express';
import {
  getExpenses,
  getExpenseSummary,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController';

const router = Router();

// Summary endpoint MUST come before /:id to avoid conflicts
router.get('/summary', getExpenseSummary);

// Standard CRUD
router.get('/', getExpenses);
router.post('/', addExpense);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
