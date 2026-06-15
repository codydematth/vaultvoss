// ─── Generic API wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  hasError: boolean;
  message: string;
  data: T;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  full_name: string;
  email: string;
  profile_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

// ─── Auth payloads ────────────────────────────────────────────────────────────
export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { full_name: string; email: string; password: string; }
export interface RefreshPayload { refresh_token: string; }
export interface VerifyOtpPayload { email: string; otp: string; }
export interface ForgotPasswordPayload { email: string; }
export interface ResetPasswordPayload { reset_token: string; new_password: string; }
export interface ChangePasswordPayload { current_password: string; new_password: string; }
export interface GoogleAuthPayload { id_token: string; }
export interface UpdateUserPayload {
  full_name?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
  profile_image_url?: string;
}

// ─── Enums ────────────────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Food' | 'Transport' | 'Shopping' | 'Entertainment'
  | 'Bills' | 'Health' | 'Other';

export type IncomeCategory =
  | 'Salary' | 'Freelance' | 'Gift' | 'Investment' | 'Other';

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export type RecurringFrequency =
  | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type NetWorthItemType = 'asset' | 'liability';

// ─── Transaction ──────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  user_id: string;
  transaction_name: string;
  transaction_type: TransactionType;
  expense_category?: ExpenseCategory | null;
  income_category?: IncomeCategory | null;
  amount: number;
  currency: string;
  note?: string | null;
  date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  transaction_name: string;
  transaction_type: TransactionType;
  expense_category?: ExpenseCategory | null;
  income_category?: IncomeCategory | null;
  amount: number | string;
  currency?: string;
  note?: string | null;
  date?: string | null;
}

export interface TransactionUpdate {
  transaction_name?: string | null;
  expense_category?: ExpenseCategory | null;
  income_category?: IncomeCategory | null;
  amount?: number | string | null;
  currency?: string | null;
  note?: string | null;
  date?: string | null;
}

export interface TransactionMeta {
  total_income: number;
  total_expenses: number;
  net: number;
  currency: string;
  count: number;
}

export interface TransactionListParams {
  transaction_type?: TransactionType;
  expense_category?: ExpenseCategory;
  income_category?: IncomeCategory;
  currency?: string;
  skip?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface AnalyticsSummary {
  total_income: number;
  total_expenses: number;
  net_savings?: number;
  net_balance?: number;
  transaction_count?: number;
  currency?: string;
  savings_rate?: number;
  period?: string | { from: string | null; to: string | null } | null;
}

export interface CategoryBreakdownItem {
  category: string;
  transaction_type: TransactionType;
  total: number;
  count: number;
  currency: string;
  percentage?: number;
}

export interface MonthlyDataPoint {
  month: string;
  year: number;
  total_income: number;
  total_expenses: number;
  net: number;
  currency: string;
}

export interface AnalyticsByPeriodParams {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string;
  currency?: string;
}

// ─── Budget Goals ─────────────────────────────────────────────────────────────
export interface BudgetGoal {
  id: string;
  user_id: string;
  name: string;
  transaction_type: TransactionType;
  expense_category?: ExpenseCategory | null;
  income_category?: IncomeCategory | null;
  amount: number;
  period: BudgetPeriod;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetGoalStatus {
  goal: BudgetGoal;
  spent: number;
  remaining: number;
  percentage_used: number;
  is_over_budget: boolean;
  currency: string;
}

export interface BudgetGoalCreate {
  name: string;
  transaction_type: TransactionType;
  expense_category?: ExpenseCategory | null;
  income_category?: IncomeCategory | null;
  amount: number | string;
  period?: BudgetPeriod;
  currency?: string;
}

export interface BudgetGoalUpdate {
  name?: string | null;
  amount?: number | string | null;
  period?: BudgetPeriod | null;
  currency?: string | null;
  is_active?: boolean | null;
}

// ─── Recurring Transactions ───────────────────────────────────────────────────
export interface RecurringTransaction {
  id: string;
  user_id: string;
  transaction_name: string;
  transaction_type: TransactionType;
  expense_category?: ExpenseCategory | null;
  income_category?: IncomeCategory | null;
  amount: number;
  currency: string;
  note?: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  last_triggered?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransactionCreate {
  transaction_name: string;
  transaction_type: TransactionType;
  expense_category?: ExpenseCategory | null;
  income_category?: IncomeCategory | null;
  amount: number | string;
  currency?: string;
  note?: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string | null;
}

export interface RecurringTransactionUpdate {
  transaction_name?: string | null;
  expense_category?: ExpenseCategory | null;
  income_category?: IncomeCategory | null;
  amount?: number | string | null;
  currency?: string | null;
  note?: string | null;
  frequency?: RecurringFrequency | null;
  end_date?: string | null;
  is_active?: boolean | null;
}

// ─── Net Worth ────────────────────────────────────────────────────────────────
export interface NetWorthItem {
  id: string;
  user_id: string;
  name: string;
  item_type: NetWorthItemType;
  value: number;
  currency: string;
  note?: string | null;
  date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSummary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  currency: string;
  items: NetWorthItem[];
}

export interface NetWorthItemCreate {
  name: string;
  item_type: NetWorthItemType;
  value: number | string;
  currency?: string;
  note?: string | null;
  date?: string | null;
}

export interface NetWorthItemUpdate {
  name?: string | null;
  value?: number | string | null;
  currency?: string | null;
  note?: string | null;
  date?: string | null;
}
