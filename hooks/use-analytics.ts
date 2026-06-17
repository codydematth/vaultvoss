import { transactionsApi } from "@/lib/api/transactions";
import type {
  AnalyticsByPeriodParams,
  CategoryBreakdownItem,
  MonthlyDataPoint,
  Transaction,
} from "@/lib/api/types";
import { useCurrency } from "@/lib/currency-context";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const ANALYTICS_KEYS = {
  all: ["analytics"] as const,
  summary: (p?: AnalyticsByPeriodParams) =>
    ["analytics", "summary", p] as const,
  byCategory: (p?: AnalyticsByPeriodParams) =>
    ["analytics", "by-category", p] as const,
  monthly: (p?: object) => ["analytics", "monthly", p] as const,
  rawTransactions: () => ["analytics", "raw-transactions"] as const,
};

function filterTransactions(
  txns: Transaction[],
  params?: AnalyticsByPeriodParams,
) {
  if (!params) return txns;

  let start: Date | null = null;
  let end: Date | null = null;

  // Only apply date filtering if the caller actually wants a period
  const hasDateFilter = !!(
    params.start_date ||
    params.end_date ||
    params.period
  );

  if (params.start_date) {
    start = new Date(params.start_date);
  }
  if (params.end_date) {
    end = new Date(params.end_date);
  }

  if (params.period && !start) {
    const now = new Date();
    if (params.period === "daily") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (params.period === "weekly") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
    } else if (params.period === "monthly") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (params.period === "yearly") {
      start = new Date(now.getFullYear(), 0, 1);
    }
  }

  if (!hasDateFilter) {
    return txns;
  }

  return txns.filter((t) => {
    const dateStr = t.date || t.created_at;
    if (!dateStr) return false;

    const tDate = new Date(dateStr);
    if (isNaN(tDate.getTime())) return false; // invalid date

    if (start && tDate < start) return false;
    if (end && tDate > end) return false;
    return true;
  });
}

/**
 * Shared hook that fetches all transactions once and caches them.
 * All analytics hooks derive their data from this single cache.
 */
function useRawTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ANALYTICS_KEYS.rawTransactions(),
    queryFn: async () => {
      try {
        const { data } = await transactionsApi.list({ limit: 100 });

        if (data.hasError) {
          console.error("[RAW TXNS] API hasError:", data.message);
          throw new Error(data.message);
        }

        const txns = data.data || [];
        return txns;
      } catch (err: any) {
        throw err;
      }
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAnalyticsSummary(params?: AnalyticsByPeriodParams) {
  const { currency: preferredCurrency, convert } = useCurrency();
  const { data: rawTxns, isLoading, error } = useRawTransactions();

  const summary = useMemo(() => {
    if (!rawTxns) {
      return undefined;
    }

    const filtered = filterTransactions(rawTxns, params);

    // ... rest of your existing code ...

    let total_income = 0;
    let total_expenses = 0;

    for (const t of filtered) {
      const itemCurrency = t.currency || "USD";
      const convertedAmount = convert(
        t.amount,
        itemCurrency,
        preferredCurrency,
      );

      if (t.transaction_type === "income") {
        total_income += convertedAmount;
      } else if (t.transaction_type === "expense") {
        total_expenses += convertedAmount;
      }
    }

    const net_balance = total_income - total_expenses;

    return {
      total_income,
      total_expenses,
      net_savings: net_balance,
      net_balance,
      transaction_count: filtered.length,
      savings_rate: total_income > 0 ? net_balance / total_income : 0,
      currency: preferredCurrency,
    };
  }, [rawTxns, params, preferredCurrency, convert]);

  return { data: summary, isLoading, error };
}

export function useAnalyticsByCategory(params?: AnalyticsByPeriodParams) {
  const { currency: preferredCurrency, convert } = useCurrency();
  const { data: rawTxns, isLoading, error } = useRawTransactions();

  const categoryData = useMemo(() => {
    if (!rawTxns) return undefined;

    const filtered = filterTransactions(rawTxns, params);

    const expenseMap: Record<string, { total: number; count: number }> = {};
    const incomeMap: Record<string, { total: number; count: number }> = {};

    let totalExpense = 0;
    let totalIncome = 0;

    for (const t of filtered) {
      const itemCurrency = t.currency || "USD";
      const convertedAmount = convert(
        t.amount,
        itemCurrency,
        preferredCurrency,
      );

      if (t.transaction_type === "expense") {
        const cat = t.expense_category || "Other";
        if (!expenseMap[cat]) expenseMap[cat] = { total: 0, count: 0 };
        expenseMap[cat].total += convertedAmount;
        expenseMap[cat].count += 1;
        totalExpense += convertedAmount;
      } else if (t.transaction_type === "income") {
        const cat = t.income_category || "Other";
        if (!incomeMap[cat]) incomeMap[cat] = { total: 0, count: 0 };
        incomeMap[cat].total += convertedAmount;
        incomeMap[cat].count += 1;
        totalIncome += convertedAmount;
      }
    }

    const expenses: CategoryBreakdownItem[] = Object.entries(expenseMap).map(
      ([category, info]) => ({
        category,
        transaction_type: "expense",
        total: info.total,
        count: info.count,
        currency: preferredCurrency,
        percentage: totalExpense > 0 ? (info.total / totalExpense) * 100 : 0,
      }),
    );

    const income: CategoryBreakdownItem[] = Object.entries(incomeMap).map(
      ([category, info]) => ({
        category,
        transaction_type: "income",
        total: info.total,
        count: info.count,
        currency: preferredCurrency,
        percentage: totalIncome > 0 ? (info.total / totalIncome) * 100 : 0,
      }),
    );

    return { expenses, income };
  }, [rawTxns, params, preferredCurrency, convert]);

  return { data: categoryData, isLoading, error };
}

export function useAnalyticsMonthly(params?: {
  months?: number;
  currency?: string;
}) {
  const { currency: preferredCurrency, convert } = useCurrency();
  const monthsLimit = params?.months ?? 6;
  const { data: rawTxns, isLoading, error } = useRawTransactions();

  const monthlyData = useMemo(() => {
    if (!rawTxns) return undefined;

    const monthlyGroups: Record<
      string,
      { total_income: number; total_expenses: number }
    > = {};

    for (const t of rawTxns) {
      const dateStr = t.date || t.created_at;
      if (!dateStr) continue;

      const date = new Date(dateStr);
      const year = date.getFullYear();
      const monthNum = date.getMonth();

      const key = `${year}-${String(monthNum + 1).padStart(2, "0")}`;

      if (!monthlyGroups[key]) {
        monthlyGroups[key] = { total_income: 0, total_expenses: 0 };
      }

      const itemCurrency = t.currency || "USD";
      const convertedAmount = convert(
        t.amount,
        itemCurrency,
        preferredCurrency,
      );

      if (t.transaction_type === "income") {
        monthlyGroups[key].total_income += convertedAmount;
      } else if (t.transaction_type === "expense") {
        monthlyGroups[key].total_expenses += convertedAmount;
      }
    }

    const sortedKeys = Object.keys(monthlyGroups).sort();

    const result: MonthlyDataPoint[] = sortedKeys.map((key) => {
      const [yearStr, monthStr] = key.split("-");
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthIdx = parseInt(monthStr, 10) - 1;
      const monthName = monthNames[monthIdx] || monthStr;

      const info = monthlyGroups[key];
      return {
        month: monthName,
        year: parseInt(yearStr, 10),
        total_income: info.total_income,
        total_expenses: info.total_expenses,
        net: info.total_income - info.total_expenses,
        currency: preferredCurrency,
      };
    });

    return result.slice(-monthsLimit);
  }, [rawTxns, preferredCurrency, convert, monthsLimit]);

  return { data: monthlyData, isLoading, error };
}
