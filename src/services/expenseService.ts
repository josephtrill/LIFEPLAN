// src/services/expenseService.ts
// Handles the business logic for Expense Management (CRUD + Summaries)

import crypto from 'crypto';
import { readData, writeData } from '../db/database';
import { Expense } from '../types';

/**
 * Get all expenses for a user, with optional filtering
 */
export async function getAllExpenses(
  userId: string,
  filters?: { category?: string; startDate?: string; endDate?: string; search?: string }
): Promise<Expense[]> {
  const db = await readData();
  let expenses: Expense[] = (db.expenses || []).filter((e: Expense) => e.user_id === userId);

  // Filter by category
  if (filters?.category && filters.category !== 'All') {
    expenses = expenses.filter((e: Expense) => e.category === filters.category);
  }

  // Filter by date range
  if (filters?.startDate) {
    expenses = expenses.filter((e: Expense) => e.expense_date >= filters.startDate!);
  }
  if (filters?.endDate) {
    expenses = expenses.filter((e: Expense) => e.expense_date <= filters.endDate!);
  }

  // Search by description or note
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    expenses = expenses.filter(
      (e: Expense) =>
        e.description.toLowerCase().includes(searchLower) ||
        (e.note && e.note.toLowerCase().includes(searchLower))
    );
  }

  // Sort by expense_date descending (newest first)
  expenses.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());

  return expenses;
}

/**
 * Get a single expense by ID (only if it belongs to the user)
 */
export async function getExpenseById(userId: string, expenseId: string): Promise<Expense | null> {
  const db = await readData();
  const expense = (db.expenses || []).find(
    (e: Expense) => e.id === expenseId && e.user_id === userId
  );
  return expense || null;
}

/**
 * Add a new expense
 */
export async function addExpense(userId: string, data: Partial<Expense>): Promise<Expense> {
  const db = await readData();
  if (!db.expenses) {
    db.expenses = [];
  }

  const newExpense: Expense = {
    id: crypto.randomUUID(),
    user_id: userId,
    category: data.category || 'Other',
    description: data.description || '',
    amount: Number(data.amount) || 0,
    expense_date: data.expense_date || new Date().toISOString().split('T')[0],
    payment_method: data.payment_method || 'Cash',
    note: data.note || '',
    created_at: new Date().toISOString(),
  };

  db.expenses.push(newExpense);
  await writeData(db);

  return newExpense;
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  userId: string,
  expenseId: string,
  updates: Partial<Expense>
): Promise<Expense | null> {
  const db = await readData();
  if (!db.expenses) {
    db.expenses = [];
  }

  const index = db.expenses.findIndex(
    (e: Expense) => e.id === expenseId && e.user_id === userId
  );

  if (index === -1) return null;

  // Merge updates (keep immutable id, user_id, created_at)
  db.expenses[index] = {
    ...db.expenses[index],
    category: updates.category ?? db.expenses[index].category,
    description: updates.description ?? db.expenses[index].description,
    amount: updates.amount !== undefined ? Number(updates.amount) : db.expenses[index].amount,
    expense_date: updates.expense_date ?? db.expenses[index].expense_date,
    payment_method: updates.payment_method ?? db.expenses[index].payment_method,
    note: updates.note ?? db.expenses[index].note,
  };

  await writeData(db);
  return db.expenses[index];
}

/**
 * Delete an expense
 */
export async function deleteExpense(userId: string, expenseId: string): Promise<boolean> {
  const db = await readData();
  if (!db.expenses) {
    db.expenses = [];
    return false;
  }

  const originalLength = db.expenses.length;
  db.expenses = db.expenses.filter(
    (e: Expense) => !(e.id === expenseId && e.user_id === userId)
  );

  if (db.expenses.length === originalLength) return false;

  await writeData(db);
  return true;
}

/**
 * Get expense summaries for the dashboard (today, this week, this month, by category)
 */
export async function getExpenseSummary(userId: string) {
  const db = await readData();
  const userExpenses: Expense[] = (db.expenses || []).filter((e: Expense) => e.user_id === userId);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

  // Calculate "start of week" (Monday)
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - mondayOffset);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Start of month
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Calculate totals
  let todayTotal = 0;
  let weeklyTotal = 0;
  let monthlyTotal = 0;
  const categoryTotals: Record<string, number> = {};

  for (const exp of userExpenses) {
    const amount = Number(exp.amount) || 0;

    if (exp.expense_date === todayStr) {
      todayTotal += amount;
    }
    if (exp.expense_date >= weekStartStr) {
      weeklyTotal += amount;
    }
    if (exp.expense_date >= monthStartStr) {
      monthlyTotal += amount;
    }

    // Accumulate by category
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;
  }

  return {
    today: todayTotal,
    weekly: weeklyTotal,
    monthly: monthlyTotal,
    byCategory: categoryTotals,
    totalExpenses: userExpenses.length,
  };
}
