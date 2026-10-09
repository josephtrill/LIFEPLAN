// src/services/budgetService.ts
// Handles business logic for Budget Management, calculations, and financial warnings

import crypto from 'crypto';
import { readData, writeData } from '../db/database';
import { Budget } from '../types';
import { getExpenseSummary } from './expenseService';

export interface BudgetAnalytics {
  budget: Budget;
  todaySpent: number;
  dailyRemaining: number;
  monthlySpent: number;
  monthlyRemaining: number;
  budgetUsagePercent: number;
  availableSavings: number;
  savingsProgressPercent: number;
  budgetStatus: 'Healthy' | 'Near Limit' | 'Critical' | 'Exceeded' | 'Not Set';
  budgetStatusLabel: string;
  warnings: string[];
}

/**
 * Get raw budget record for a user or create default if none exists
 */
export async function getBudgetRecord(userId: string): Promise<Budget> {
  const db = await readData();
  if (!db.budgets) db.budgets = [];

  let budget = db.budgets.find((b: Budget) => b.user_id === userId);
  if (!budget) {
    budget = {
      id: crypto.randomUUID(),
      user_id: userId,
      monthly_income: 0,
      daily_spending_limit: 0,
      monthly_spending_limit: 0,
      savings_target: 0,
      emergency_fund_target: 0,
      future_purchase_target: 0,
      updated_at: new Date().toISOString(),
    };
    db.budgets.push(budget);
    await writeData(db);
  }
  return budget;
}

/**
 * Create or update budget settings for a user
 */
export async function updateBudget(
  userId: string,
  data: {
    monthly_income?: number;
    daily_spending_limit?: number;
    monthly_spending_limit?: number;
    savings_target?: number;
    emergency_fund_target?: number;
    future_purchase_target?: number;
  }
): Promise<Budget> {
  const db = await readData();
  if (!db.budgets) db.budgets = [];

  let index = db.budgets.findIndex((b: Budget) => b.user_id === userId);

  if (index === -1) {
    const newBudget: Budget = {
      id: crypto.randomUUID(),
      user_id: userId,
      monthly_income: Number(data.monthly_income) || 0,
      daily_spending_limit: Number(data.daily_spending_limit) || 0,
      monthly_spending_limit: Number(data.monthly_spending_limit) || 0,
      savings_target: Number(data.savings_target) || 0,
      emergency_fund_target: Number(data.emergency_fund_target) || 0,
      future_purchase_target: Number(data.future_purchase_target) || 0,
      updated_at: new Date().toISOString(),
    };
    db.budgets.push(newBudget);
    await writeData(db);
    return newBudget;
  }

  // Update existing budget record
  db.budgets[index] = {
    ...db.budgets[index],
    monthly_income: data.monthly_income !== undefined ? Number(data.monthly_income) : db.budgets[index].monthly_income,
    daily_spending_limit: data.daily_spending_limit !== undefined ? Number(data.daily_spending_limit) : db.budgets[index].daily_spending_limit,
    monthly_spending_limit: data.monthly_spending_limit !== undefined ? Number(data.monthly_spending_limit) : db.budgets[index].monthly_spending_limit,
    savings_target: data.savings_target !== undefined ? Number(data.savings_target) : db.budgets[index].savings_target,
    emergency_fund_target: data.emergency_fund_target !== undefined ? Number(data.emergency_fund_target) : db.budgets[index].emergency_fund_target,
    future_purchase_target: data.future_purchase_target !== undefined ? Number(data.future_purchase_target) : db.budgets[index].future_purchase_target,
    updated_at: new Date().toISOString(),
  };

  await writeData(db);
  return db.budgets[index];
}

/**
 * Calculate comprehensive budget analytics, remaining money, savings, status & warnings
 */
export async function getBudgetAnalytics(userId: string): Promise<BudgetAnalytics> {
  const budget = await getBudgetRecord(userId);
  const expenseSummary = await getExpenseSummary(userId);

  const todaySpent = expenseSummary.today;
  const monthlySpent = expenseSummary.monthly;

  // Remaining limits
  const dailyRemaining = budget.daily_spending_limit > 0
    ? budget.daily_spending_limit - todaySpent
    : -todaySpent;

  const monthlyRemaining = budget.monthly_spending_limit > 0
    ? budget.monthly_spending_limit - monthlySpent
    : -monthlySpent;

  // Usage percentage
  const budgetUsagePercent = budget.monthly_spending_limit > 0
    ? (monthlySpent / budget.monthly_spending_limit) * 100
    : 0;

  // Savings
  const availableSavings = budget.monthly_income - monthlySpent;
  const savingsProgressPercent = budget.savings_target > 0
    ? Math.max(0, Math.min(100, (availableSavings / budget.savings_target) * 100))
    : 0;

  // Budget Status
  let budgetStatus: 'Healthy' | 'Near Limit' | 'Critical' | 'Exceeded' | 'Not Set' = 'Not Set';
  let budgetStatusLabel = 'No Budget Configured';

  if (budget.monthly_spending_limit > 0) {
    if (budgetUsagePercent <= 70) {
      budgetStatus = 'Healthy';
      budgetStatusLabel = 'Under Budget';
    } else if (budgetUsagePercent <= 90) {
      budgetStatus = 'Near Limit';
      budgetStatusLabel = 'Near Budget Limit';
    } else if (budgetUsagePercent <= 100) {
      budgetStatus = 'Critical';
      budgetStatusLabel = 'Near Budget Cap';
    } else {
      budgetStatus = 'Exceeded';
      budgetStatusLabel = 'Budget Exceeded';
    }
  }

  // Financial Warnings Generation
  const warnings: string[] = [];

  // Daily budget warnings
  if (budget.daily_spending_limit > 0) {
    if (todaySpent > budget.daily_spending_limit) {
      warnings.push(`You have exceeded your daily budget by ₱${Math.abs(dailyRemaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
    } else if (todaySpent >= budget.daily_spending_limit * 0.8) {
      warnings.push(`Your spending is approaching today's daily budget limit (${Math.round((todaySpent / budget.daily_spending_limit) * 100)}% used).`);
    }
  }

  // Monthly budget warnings
  if (budget.monthly_spending_limit > 0) {
    if (monthlySpent > budget.monthly_spending_limit) {
      warnings.push(`You have exceeded your monthly spending limit by ₱${Math.abs(monthlyRemaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
    } else if (budgetUsagePercent >= 85) {
      warnings.push(`You have used ${budgetUsagePercent.toFixed(1)}% of your monthly spending budget.`);
    }
  }

  // Savings warnings
  if (budget.savings_target > 0 && budget.monthly_income > 0) {
    if (availableSavings < budget.savings_target) {
      warnings.push(`Your projected savings (₱${Math.max(0, availableSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })}) are currently below your target of ₱${budget.savings_target.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
    }
  }

  return {
    budget,
    todaySpent,
    dailyRemaining,
    monthlySpent,
    monthlyRemaining,
    budgetUsagePercent: Math.round(budgetUsagePercent * 100) / 100,
    availableSavings,
    savingsProgressPercent: Math.round(savingsProgressPercent * 100) / 100,
    budgetStatus,
    budgetStatusLabel,
    warnings,
  };
}
