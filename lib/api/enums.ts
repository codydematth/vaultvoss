import {apiClient} from './client';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EnumValues {
  expense_categories: string[];
  income_categories: string[];
  transaction_types: string[];
  budget_periods: string[];
  recurring_frequencies: string[];
  net_worth_item_types: string[];
}

// ─── Fallbacks (used while the API is loading or if it fails) ─────────────────
export const FALLBACK_ENUMS: EnumValues = {
  expense_categories: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Gift', 'Miscellaneous', 'Betting', 'Other'],
  income_categories: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'],
  transaction_types: ['income', 'expense'],
  budget_periods: ['weekly', 'monthly', 'yearly'],
  recurring_frequencies: ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'],
  net_worth_item_types: ['asset', 'liability'],
};

// Map from OpenAPI schema name → our key
const SCHEMA_KEY_MAP: Record<string, keyof EnumValues> = {
  ExpenseCategory: 'expense_categories',
  IncomeCategory: 'income_categories',
  TransactionType: 'transaction_types',
  BudgetPeriod: 'budget_periods',
  RecurringFrequency: 'recurring_frequencies',
  NetWorthItemType: 'net_worth_item_types',
};

// ─── Fetch enums from the OpenAPI spec ────────────────────────────────────────
export async function fetchEnums(): Promise<EnumValues> {
  const {data} = await apiClient.get('/openapi.json');
  const schemas = data?.components?.schemas;
  if (!schemas) return FALLBACK_ENUMS;

  const result = {...FALLBACK_ENUMS};

  for (const [schemaName, key] of Object.entries(SCHEMA_KEY_MAP)) {
    const schema = schemas[schemaName];
    if (schema?.enum && Array.isArray(schema.enum)) {
      result[key] = schema.enum;
    }
  }

  return result;
}
