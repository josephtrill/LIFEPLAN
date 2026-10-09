// src/controllers/expenseController.ts
// Handles HTTP request/response for Expense Management

import { Request, Response } from 'express';
import * as expenseService from '../services/expenseService';

/**
 * GET /api/expenses
 * Get all expenses for the logged-in user, with optional filters
 */
export async function getExpenses(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { category, startDate, endDate, search } = req.query;

    const expenses = await expenseService.getAllExpenses(userId, {
      category: category as string,
      startDate: startDate as string,
      endDate: endDate as string,
      search: search as string,
    });

    res.json({ success: true, message: 'Expenses retrieved', data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/expenses/summary
 * Get expense summaries (today, weekly, monthly, by category) for the dashboard
 */
export async function getExpenseSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const summary = await expenseService.getExpenseSummary(userId);

    res.json({ success: true, message: 'Summary retrieved', data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/expenses/:id
 * Get a single expense by its ID
 */
export async function getExpenseById(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const expense = await expenseService.getExpenseById(userId, req.params.id);

    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    res.json({ success: true, message: 'Expense retrieved', data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/expenses
 * Add a new expense
 */
export async function addExpense(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { category, description, amount, expense_date, payment_method, note } = req.body;

    // Validate required fields
    if (!description || amount === undefined || amount === null) {
      res.status(400).json({ success: false, message: 'Description and amount are required' });
      return;
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      return;
    }

    const newExpense = await expenseService.addExpense(userId, {
      category,
      description,
      amount: Number(amount),
      expense_date,
      payment_method,
      note,
    });

    res.status(201).json({ success: true, message: 'Expense added successfully', data: newExpense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/expenses/:id
 * Update an existing expense
 */
export async function updateExpense(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const { category, description, amount, expense_date, payment_method, note } = req.body;

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      return;
    }

    const updated = await expenseService.updateExpense(userId, req.params.id, {
      category,
      description,
      amount: amount !== undefined ? Number(amount) : undefined,
      expense_date,
      payment_method,
      note,
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    res.json({ success: true, message: 'Expense updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/expenses/:id
 * Delete an expense
 */
export async function deleteExpense(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.id;
    const deleted = await expenseService.deleteExpense(userId, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
