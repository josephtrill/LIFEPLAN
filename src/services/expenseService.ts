// src/services/expenseService.ts
// Business logic for Expense Management, stored in Supabase (PostgreSQL).

import { query } from '../db/database';

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string; // YYYY-MM-DD
  payment_method: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ExpenseInput {
  category?: string;
  description?: string;
  amount?: number;
  expense_date?: string;
  payment_method?: string;
  note?: string;
}

// Columns returned to the controller. amount is cast to a JS number and the
// date to a plain YYYY-MM-DD string (pg would otherwise return a string/Date object).
const EXPENSE_COLUMNS = `
  id,
  user_id,
  category,
  description,
  amount::float8 AS amount,
  to_char(expense_date, 'YYYY-MM-DD') AS expense_date,
  payment_method,
  note,
  created_at,
  updated_at
`;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get all expenses for a user, with optional filters (category, date range, search).
 */
export async function getAllExpenses(userId: string, filters: ExpenseFilters = {}): Promise<Expense[]> {
  const conditions: string[] = ['user_id = $1'];
  const params: any[] = [userId];

  if (filters.category && filters.category !== 'All') {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }
  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`expense_date >= $${params.length}::date`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`expense_date <= $${params.length}::date`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(description ILIKE $${params.length} OR COALESCE(note, '') ILIKE $${params.length})`
    );
  }

  const result = await query<Expense>(
    `SELECT ${EXPENSE_COLUMNS}
     FROM expenses
     WHERE ${conditions.join(' AND ')}
     ORDER BY expense_date DESC, created_at DESC`,
    params
  );
  return result.rows;
}

/**
 * Get one expense by ID (only if it belongs to the user).
 */
export async function getExpenseById(userId: string, id: string): Promise<Expense | null> {
  if (!UUID_REGEX.test(id)) return null;

  const result = await query<Expense>(
    `SELECT ${EXPENSE_COLUMNS} FROM expenses WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
}

/**
 * Add a new expense.
 */
export async function addExpense(userId: string, data: ExpenseInput): Promise<Expense> {
  const result = await query<Expense>(
    `INSERT INTO expenses (user_id, category, description, amount, expense_date, payment_method, note)
     VALUES ($1, COALESCE($2, 'Other'), $3, $4, COALESCE($5::date, CURRENT_DATE), $6, $7)
     RETURNING ${EXPENSE_COLUMNS}`,
    [
      userId,
      data.category || null,
      data.description,
      data.amount,
      data.expense_date || null,
      data.payment_method || null,
      data.note || null,
    ]
  );
  return result.rows[0];
}

/**
 * Update an expense. Only fields that are provided are changed.
 */
export async function updateExpense(
  userId: string,
  id: string,
  data: ExpenseInput
): Promise<Expense | null> {
  if (!UUID_REGEX.test(id)) return null;

  const result = await query<Expense>(
    `UPDATE expenses SET
       category       = COALESCE($3, category),
       description    = COALESCE($4, description),
       amount         = COALESCE($5, amount),
       expense_date   = COALESCE($6::date, expense_date),
       payment_method = COALESCE($7, payment_method),
       note           = COALESCE($8, note),
       updated_at     = now()
     WHERE id = $1 AND user_id = $2
     RETURNING ${EXPENSE_COLUMNS}`,
    [
      id,
      userId,
      data.category ?? null,
      data.description ?? null,
      data.amount ?? null,
      data.expense_date ?? null,
      data.payment_method ?? null,
      data.note ?? null,
    ]
  );
  return result.rows[0] || null;
}

/**
 * Delete an expense. Returns true if a row was deleted.
 */
export async function deleteExpense(userId: string, id: string): Promise<boolean> {
  if (!UUID_REGEX.test(id)) return false;

  const result = await query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Summary for the dashboard: today, last 7 days, this month, and this month by category.
 */
export async function getExpenseSummary(userId: string) {
  const totals = await query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE expense_date = CURRENT_DATE), 0)::float8 AS today_total,
       COALESCE(SUM(amount) FILTER (WHERE expense_date >= CURRENT_DATE - 6), 0)::float8 AS weekly_total,
       COALESCE(SUM(amount) FILTER (
         WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)
       ), 0)::float8 AS monthly_total,
       COUNT(*)::int AS total_count
     FROM expenses
     WHERE user_id = $1`,
    [userId]
  );

  const byCategory = await query(
    `SELECT category, SUM(amount)::float8 AS total, COUNT(*)::int AS count
     FROM expenses
     WHERE user_id = $1
       AND date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)
     GROUP BY category
     ORDER BY total DESC`,
    [userId]
  );

  const row = totals.rows[0];
  return {
    // Names used by budgetService.ts and the dashboard
    today: row.today_total as number,
    weekly: row.weekly_total as number,
    monthly: row.monthly_total as number,
    total_count: row.total_count as number,
    // Same list under two names, in case the frontend uses either one
    by_category: byCategory.rows as { category: string; total: number; count: number }[],
    byCategory: byCategory.rows as { category: string; total: number; count: number }[],
  };
}