// src/services/savingsService.ts
// Handles business logic for Savings Goals, Deposits, Progress tracking, and Summaries

import crypto from 'crypto';
import { readData, writeData } from '../db/database';
import { SavingsGoal, SavingsTransaction } from '../types';

export interface EnrichedSavingsGoal extends SavingsGoal {
  remaining_amount: number;
  progress_percent: number;
  days_remaining: number | null;
  is_overdue: boolean;
}

export interface SavingsSummary {
  totalSaved: number;
  totalTarget: number;
  overallProgressPercent: number;
  activeCount: number;
  completedCount: number;
  pausedCount: number;
  goalsCount: number;
  goalsComparison: {
    id: string;
    name: string;
    category: string;
    current_amount: number;
    target_amount: number;
    progress_percent: number;
    status: string;
  }[];
  recentTransactions: SavingsTransaction[];
}

/**
 * Helper to compute progress, remaining amount, and days countdown for a goal
 */
function enrichGoal(goal: SavingsGoal): EnrichedSavingsGoal {
  const target = Number(goal.target_amount) || 0;
  const current = Number(goal.current_amount) || 0;
  const remaining = Math.max(0, target - current);
  const progress = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;

  let daysRemaining: number | null = null;
  let isOverdue = false;

  if (goal.target_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(goal.target_date);
    targetDate.setHours(0, 0, 0, 0);

    const diffMs = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    daysRemaining = diffDays;
    isOverdue = diffDays < 0 && goal.status !== 'Completed';
  }

  return {
    ...goal,
    target_amount: target,
    current_amount: current,
    remaining_amount: Math.round(remaining * 100) / 100,
    progress_percent: Math.round(progress * 100) / 100,
    days_remaining: daysRemaining,
    is_overdue: isOverdue,
  };
}

/**
 * Get all savings goals for a user
 */
export async function getAllSavingsGoals(userId: string): Promise<EnrichedSavingsGoal[]> {
  const db = await readData();
  if (!db.savings_goals) db.savings_goals = [];

  const userGoals: SavingsGoal[] = db.savings_goals.filter((g: SavingsGoal) => g.user_id === userId);

  return userGoals.map(enrichGoal);
}

/**
 * Get a single savings goal by ID, including its transaction history
 */
export async function getSavingsGoalById(
  userId: string,
  goalId: string
): Promise<{ goal: EnrichedSavingsGoal; transactions: SavingsTransaction[] } | null> {
  const db = await readData();
  if (!db.savings_goals) db.savings_goals = [];
  if (!db.savings_transactions) db.savings_transactions = [];

  const goal = db.savings_goals.find((g: SavingsGoal) => g.id === goalId && g.user_id === userId);
  if (!goal) return null;

  const transactions = db.savings_transactions
    .filter((t: SavingsTransaction) => t.savings_goal_id === goalId && t.user_id === userId)
    .sort((a: SavingsTransaction, b: SavingsTransaction) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

  return {
    goal: enrichGoal(goal),
    transactions,
  };
}

/**
 * Create a new savings goal
 */
export async function createSavingsGoal(
  userId: string,
  data: {
    name: string;
    category?: string;
    description?: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string;
    note?: string;
  }
): Promise<EnrichedSavingsGoal> {
  const db = await readData();
  if (!db.savings_goals) db.savings_goals = [];
  if (!db.savings_transactions) db.savings_transactions = [];

  const targetAmount = Number(data.target_amount) || 0;
  const initialAmount = Number(data.current_amount) || 0;
  const status = initialAmount >= targetAmount && targetAmount > 0 ? 'Completed' : 'Active';

  const newGoal: SavingsGoal = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: data.name,
    category: data.category || 'Personal',
    description: data.description || '',
    target_amount: targetAmount,
    current_amount: initialAmount,
    target_date: data.target_date || undefined,
    status: status,
    note: data.note || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.savings_goals.push(newGoal);

  // If initial current_amount > 0, log an initial deposit transaction
  if (initialAmount > 0) {
    db.savings_transactions.push({
      id: crypto.randomUUID(),
      savings_goal_id: newGoal.id,
      user_id: userId,
      amount: initialAmount,
      transaction_type: 'Deposit',
      description: 'Initial deposit',
      transaction_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    });
  }

  await writeData(db);
  return enrichGoal(newGoal);
}

/**
 * Update a savings goal
 */
export async function updateSavingsGoal(
  userId: string,
  goalId: string,
  updates: Partial<SavingsGoal>
): Promise<EnrichedSavingsGoal | null> {
  const db = await readData();
  if (!db.savings_goals) db.savings_goals = [];

  const index = db.savings_goals.findIndex((g: SavingsGoal) => g.id === goalId && g.user_id === userId);
  if (index === -1) return null;

  const currentGoal = db.savings_goals[index];
  const newTarget = updates.target_amount !== undefined ? Number(updates.target_amount) : currentGoal.target_amount;
  const newCurrent = updates.current_amount !== undefined ? Number(updates.current_amount) : currentGoal.current_amount;

  let newStatus = updates.status || currentGoal.status;
  if (newCurrent >= newTarget && newTarget > 0 && newStatus === 'Active') {
    newStatus = 'Completed';
  }

  db.savings_goals[index] = {
    ...currentGoal,
    name: updates.name ?? currentGoal.name,
    category: updates.category ?? currentGoal.category,
    description: updates.description ?? currentGoal.description,
    target_amount: newTarget,
    current_amount: newCurrent,
    target_date: updates.target_date !== undefined ? updates.target_date : currentGoal.target_date,
    status: newStatus,
    note: updates.note ?? currentGoal.note,
    updated_at: new Date().toISOString(),
  };

  await writeData(db);
  return enrichGoal(db.savings_goals[index]);
}

/**
 * Delete a savings goal and its associated transactions
 */
export async function deleteSavingsGoal(userId: string, goalId: string): Promise<boolean> {
  const db = await readData();
  if (!db.savings_goals) db.savings_goals = [];
  if (!db.savings_transactions) db.savings_transactions = [];

  const originalLength = db.savings_goals.length;
  db.savings_goals = db.savings_goals.filter((g: SavingsGoal) => !(g.id === goalId && g.user_id === userId));

  if (db.savings_goals.length === originalLength) return false;

  // Also remove transactions
  db.savings_transactions = db.savings_transactions.filter(
    (t: SavingsTransaction) => !(t.savings_goal_id === goalId && t.user_id === userId)
  );

  await writeData(db);
  return true;
}

/**
 * Deposit / Add money to an existing savings goal
 */
export async function depositToGoal(
  userId: string,
  goalId: string,
  amount: number,
  description?: string
): Promise<{ goal: EnrichedSavingsGoal; transaction: SavingsTransaction } | null> {
  const db = await readData();
  if (!db.savings_goals) db.savings_goals = [];
  if (!db.savings_transactions) db.savings_transactions = [];

  const index = db.savings_goals.findIndex((g: SavingsGoal) => g.id === goalId && g.user_id === userId);
  if (index === -1) return null;

  const goal = db.savings_goals[index];
  const depositAmount = Number(amount);
  const newCurrent = Number(goal.current_amount) + depositAmount;

  // Auto-complete if target reached
  let newStatus = goal.status;
  if (newCurrent >= Number(goal.target_amount) && Number(goal.target_amount) > 0) {
    newStatus = 'Completed';
  }

  db.savings_goals[index] = {
    ...goal,
    current_amount: newCurrent,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  const newTransaction: SavingsTransaction = {
    id: crypto.randomUUID(),
    savings_goal_id: goalId,
    user_id: userId,
    amount: depositAmount,
    transaction_type: 'Deposit',
    description: description || 'Deposit',
    transaction_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };

  db.savings_transactions.push(newTransaction);
  await writeData(db);

  return {
    goal: enrichGoal(db.savings_goals[index]),
    transaction: newTransaction,
  };
}

/**
 * Get comprehensive Savings Summary and analytics for dashboard and graphs
 */
export async function getSavingsSummary(userId: string): Promise<SavingsSummary> {
  const db = await readData();
  if (!db.savings_goals) db.savings_goals = [];
  if (!db.savings_transactions) db.savings_transactions = [];

  // FIX: explicit types so `g` below is no longer implicitly `any`
  const userGoals: SavingsGoal[] = db.savings_goals.filter((g: SavingsGoal) => g.user_id === userId);
  const enriched: EnrichedSavingsGoal[] = userGoals.map(enrichGoal);

  let totalSaved = 0;
  let totalTarget = 0;
  let activeCount = 0;
  let completedCount = 0;
  let pausedCount = 0;

  for (const g of enriched) {
    totalSaved += g.current_amount;
    totalTarget += g.target_amount;
    if (g.status === 'Active') activeCount++;
    else if (g.status === 'Completed') completedCount++;
    else if (g.status === 'Paused') pausedCount++;
  }

  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const goalsComparison = enriched.map((g: EnrichedSavingsGoal) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    current_amount: g.current_amount,
    target_amount: g.target_amount,
    progress_percent: g.progress_percent,
    status: g.status,
  }));

  const userTransactions: SavingsTransaction[] = db.savings_transactions
    .filter((t: SavingsTransaction) => t.user_id === userId)
    .sort((a: SavingsTransaction, b: SavingsTransaction) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return {
    totalSaved: Math.round(totalSaved * 100) / 100,
    totalTarget: Math.round(totalTarget * 100) / 100,
    overallProgressPercent: Math.round(overallProgress * 100) / 100,
    activeCount,
    completedCount,
    pausedCount,
    goalsCount: userGoals.length,
    goalsComparison,
    recentTransactions: userTransactions,
  };
}
