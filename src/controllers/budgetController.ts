// src/controllers/budgetController.ts
// Handles HTTP requests for Budget Management

import { Request, Response } from 'express';
import * as budgetService from '../services/budgetService';

/**
 * GET /api/budget
 * Retrieves budget settings and live calculated analytics for the authenticated user
 */
export async function getBudget(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const analytics = await budgetService.getBudgetAnalytics(userId);

    res.json({
      success: true,
      message: 'Budget analytics retrieved successfully',
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/budget
 * Updates or creates budget settings for the authenticated user
 */
export async function updateBudget(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const {
      monthly_income,
      daily_spending_limit,
      monthly_spending_limit,
      savings_target,
      emergency_fund_target,
      future_purchase_target,
    } = req.body;

    // Validation helper
    const validateField = (name: string, val: any) => {
      if (val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          throw new Error(`${name} must be a valid number`);
        }
        if (num < 0) {
          throw new Error(`${name} cannot be negative`);
        }
      }
    };

    validateField('Monthly income', monthly_income);
    validateField('Daily spending limit', daily_spending_limit);
    validateField('Monthly spending limit', monthly_spending_limit);
    validateField('Savings target', savings_target);
    validateField('Emergency fund target', emergency_fund_target);
    validateField('Future purchase target', future_purchase_target);

    await budgetService.updateBudget(userId, {
      monthly_income: monthly_income !== undefined ? Number(monthly_income) : undefined,
      daily_spending_limit: daily_spending_limit !== undefined ? Number(daily_spending_limit) : undefined,
      monthly_spending_limit: monthly_spending_limit !== undefined ? Number(monthly_spending_limit) : undefined,
      savings_target: savings_target !== undefined ? Number(savings_target) : undefined,
      emergency_fund_target: emergency_fund_target !== undefined ? Number(emergency_fund_target) : undefined,
      future_purchase_target: future_purchase_target !== undefined ? Number(future_purchase_target) : undefined,
    });

    const updatedAnalytics = await budgetService.getBudgetAnalytics(userId);

    res.json({
      success: true,
      message: 'Budget settings saved successfully',
      data: updatedAnalytics,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
