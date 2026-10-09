// src/routes/budgetRoutes.ts
// Maps budget API routes

import { Router } from 'express';
import { getBudget, updateBudget } from '../controllers/budgetController';

const router = Router();

router.get('/', getBudget);
router.put('/', updateBudget);

export default router;
