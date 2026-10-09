// src/controllers/savingsController.ts
// Handles HTTP requests and validation for Savings Goals and Deposits

import { Request, Response } from 'express';
import * as savingsService from '../services/savingsService';

/**
 * GET /api/savings
 * Retrieves all savings goals for the authenticated user
 */
export async function getSavings(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const goals = await savingsService.getAllSavingsGoals(userId);

    res.json({
      success: true,
      message: 'Savings goals retrieved successfully',
      data: goals,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/savings/summary
 * Retrieves overall savings summary, progress %, and comparison chart data
 */
export async function getSavingsSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const summary = await savingsService.getSavingsSummary(userId);

    res.json({
      success: true,
      message: 'Savings summary retrieved successfully',
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/savings/:id
 * Retrieves a single savings goal and its transaction history
 */
export async function getSavingsGoalById(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const id = String(req.params.id); // FIX: params can be string | string[]
    const result = await savingsService.getSavingsGoalById(userId, id);

    if (!result) {
      res.status(404).json({ success: false, message: 'Savings goal not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Savings goal retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/savings
 * Creates a new savings goal
 */
export async function createSavingsGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { name, category, description, target_amount, current_amount, target_date, note } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, message: 'Goal name is required' });
      return;
    }

    if (target_amount === undefined || isNaN(Number(target_amount)) || Number(target_amount) <= 0) {
      res.status(400).json({ success: false, message: 'Please enter a valid target amount greater than zero' });
      return;
    }

    if (current_amount !== undefined && (isNaN(Number(current_amount)) || Number(current_amount) < 0)) {
      res.status(400).json({ success: false, message: 'Current amount cannot be negative' });
      return;
    }

    const newGoal = await savingsService.createSavingsGoal(userId, {
      name: name.trim(),
      category: category || 'Personal',
      description,
      target_amount: Number(target_amount),
      current_amount: current_amount !== undefined ? Number(current_amount) : 0,
      target_date,
      note,
    });

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully.',
      data: newGoal,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/savings/:id
 * Updates an existing savings goal
 */
export async function updateSavingsGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const id = String(req.params.id); // FIX: params can be string | string[]
    const { name, category, description, target_amount, current_amount, target_date, status, note } = req.body;

    if (name !== undefined && name.trim() === '') {
      res.status(400).json({ success: false, message: 'Goal name cannot be empty' });
      return;
    }

    if (target_amount !== undefined && (isNaN(Number(target_amount)) || Number(target_amount) <= 0)) {
      res.status(400).json({ success: false, message: 'Target amount must be greater than zero' });
      return;
    }

    if (current_amount !== undefined && (isNaN(Number(current_amount)) || Number(current_amount) < 0)) {
      res.status(400).json({ success: false, message: 'Current amount cannot be negative' });
      return;
    }

    const updated = await savingsService.updateSavingsGoal(userId, id, {
      name: name ? name.trim() : undefined,
      category,
      description,
      target_amount: target_amount !== undefined ? Number(target_amount) : undefined,
      current_amount: current_amount !== undefined ? Number(current_amount) : undefined,
      target_date,
      status,
      note,
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Savings goal not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Savings goal updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/savings/:id
 * Deletes a savings goal
 */
export async function deleteSavingsGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const id = String(req.params.id); // FIX: params can be string | string[]
    const deleted = await savingsService.deleteSavingsGoal(userId, id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Savings goal not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Savings goal deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/savings/:id/deposit
 * Deposits / adds money to a savings goal
 */
export async function depositToGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const id = String(req.params.id); // FIX: params can be string | string[]
    const { amount, description } = req.body;

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Deposit amount must be greater than zero.' });
      return;
    }

    const result = await savingsService.depositToGoal(userId, id, Number(amount), description);

    if (!result) {
      res.status(404).json({ success: false, message: 'Savings goal not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Savings updated successfully.',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
