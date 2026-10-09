// src/types/schema.ts
// TypeScript definitions for the LifePlan database schema

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method?: string;
  note?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  monthly_income: number;
  daily_spending_limit: number;
  monthly_spending_limit: number;
  savings_target: number;
  emergency_fund_target: number;
  future_purchase_target: number;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  status: 'Active' | 'Completed' | 'Paused' | 'Cancelled';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsTransaction {
  id: string;
  savings_goal_id: string;
  user_id: string;
  amount: number;
  transaction_type: 'Deposit' | 'Withdrawal' | 'Adjustment';
  description?: string;
  transaction_date: string;
  created_at: string;
}

export interface DailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  completion_date?: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  activity: string;
  category: 'Work' | 'Study' | 'Exercise' | 'Sleep' | 'Family' | 'Entertainment' | 'Social Media' | 'Personal' | 'Other';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes?: string;
  created_at: string;
}

export interface Thought {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: 'Reflection' | 'Idea' | 'Problem' | 'Lesson' | 'Future' | 'Personal';
  thought_date: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  goal_type: 'Short-Term' | 'Medium-Term' | 'Long-Term';
  target_date: string;
  progress: number; // 0 to 100
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Paused' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface RoadmapStep {
  id: string;
  goal_id: string;
  step_number: number;
  title: string;
  description?: string;
  deadline?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  progress: number; // 0 to 100
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  user_id: string;
  skill_name: string;
  current_level: number; // 0 to 100
  target_level: number; // 0 to 100
  progress: number; // 0 to 100
  status: 'Not Started' | 'Learning' | 'Practicing' | 'Improving' | 'Completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  habit_name: string;
  created_at: string;
}

export interface HabitRecord {
  id: string;
  habit_id: string;
  user_id: string;
  record_date: string;
  completed: boolean;
}

export interface DailyReview {
  id: string;
  user_id: string;
  review_date: string;
  what_went_well?: string;
  what_to_improve?: string;
  what_learned?: string;
  productivity_score: number;
  discipline_score: number;
  created_at: string;
}

// The complete JSON Database structure
export interface DatabaseSchema {
  users: User[];
  budgets: Budget[];
  expenses: Expense[];
  savings_goals: SavingsGoal[];
  savings_transactions: SavingsTransaction[];
  daily_plans: DailyPlan[];
  tasks: Task[];
  time_entries: TimeEntry[];
  thoughts: Thought[];
  goals: Goal[];
  roadmaps: RoadmapStep[];
  skills: Skill[];
  habits: Habit[];
  habit_records: HabitRecord[];
  daily_reviews: DailyReview[];
}
