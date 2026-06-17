import {budgetGoalsApi} from '@/lib/api/budget-goals';
import {transactionsApi} from '@/lib/api/transactions';
import {getApiError} from '@/lib/api/client';
import type {BudgetGoalCreate, BudgetGoalUpdate, BudgetGoalStatus} from '@/lib/api/types';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useCurrency} from '@/lib/currency-context';

export const BUDGET_KEYS = {
  all: ['budget-goals'] as const,
  list: () => ['budget-goals', 'list'] as const,
  status: (id: string) => ['budget-goals', 'status', id] as const,
};

export function useBudgetGoals() {
  return useQuery({
    queryKey: BUDGET_KEYS.list(),
    queryFn: async () => {
      const {data} = await budgetGoalsApi.list();
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
  });
}

export function useBudgetGoalStatus(goalId: string) {
  const {convert, rates, currency: preferredCurrency} = useCurrency();

  return useQuery<BudgetGoalStatus>({
    queryKey: [...BUDGET_KEYS.status(goalId), rates, preferredCurrency],
    queryFn: async () => {
      // 1. Fetch the goal details
      const {data: goalData} = await budgetGoalsApi.list();
      if (goalData.hasError) throw new Error(goalData.message);
      const goal = goalData.data?.find((g) => g.id === goalId);
      if (!goal) throw new Error('Goal not found');

      // 2. Fetch recent transactions
      const {data: txData} = await transactionsApi.list({limit: 1000});
      if (txData.hasError) throw new Error(txData.message);
      const txns = txData.data || [];

      // 3. Compute period bounds
      const now = new Date();
      let start = new Date();
      let end = new Date();

      if (goal.period === 'weekly') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 7);
      } else if (goal.period === 'monthly') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else if (goal.period === 'yearly') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
      }

      // 4. Filter and aggregate transactions in the correct currency
      let spent = 0;
      for (const t of txns) {
        if (t.transaction_type !== goal.transaction_type) continue;
        
        // Match category
        if (goal.transaction_type === 'expense' && goal.expense_category) {
          if (t.expense_category !== goal.expense_category) continue;
        } else if (goal.transaction_type === 'income' && goal.income_category) {
          if (t.income_category !== goal.income_category) continue;
        }

        const dateStr = t.date || t.created_at;
        if (!dateStr) continue;
        const tDate = new Date(dateStr);
        if (tDate >= start && tDate < end) {
          const converted = convert(t.amount, t.currency || 'USD', goal.currency || 'USD');
          spent += converted;
        }
      }

      const remaining = goal.amount - spent;
      const percentage_used = goal.amount > 0 ? (spent / goal.amount) * 100 : 0;
      const is_over_budget = spent > goal.amount;

      return {
        goal,
        spent,
        remaining,
        percentage_used,
        is_over_budget,
        currency: goal.currency,
      };
    },
    enabled: !!goalId,
  });
}

export function useAllBudgetGoalsStatus() {
  const {convert, rates, currency: preferredCurrency} = useCurrency();

  return useQuery<BudgetGoalStatus[]>({
    queryKey: [...BUDGET_KEYS.all, 'statuses', rates, preferredCurrency],
    queryFn: async () => {
      // 1. Fetch all goals
      const {data: goalData} = await budgetGoalsApi.list();
      if (goalData.hasError) throw new Error(goalData.message);
      const goals = goalData.data || [];

      if (goals.length === 0) return [];

      // 2. Fetch recent transactions
      const {data: txData} = await transactionsApi.list({limit: 1000});
      if (txData.hasError) throw new Error(txData.message);
      const txns = txData.data || [];

      const now = new Date();

      return goals.map((goal) => {
        const gNow = new Date(now);
        let start = new Date();
        let end = new Date();

        if (goal.period === 'weekly') {
          const day = gNow.getDay();
          const diff = gNow.getDate() - day + (day === 0 ? -6 : 1);
          start = new Date(gNow.setDate(diff));
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(start.getDate() + 7);
        } else if (goal.period === 'monthly') {
          start = new Date(gNow.getFullYear(), gNow.getMonth(), 1);
          end = new Date(gNow.getFullYear(), gNow.getMonth() + 1, 1);
        } else if (goal.period === 'yearly') {
          start = new Date(gNow.getFullYear(), 0, 1);
          end = new Date(gNow.getFullYear() + 1, 0, 1);
        }

        // Filter and aggregate transactions in the correct currency
        let spent = 0;
        for (const t of txns) {
          if (t.transaction_type !== goal.transaction_type) continue;
          
          // Match category
          if (goal.transaction_type === 'expense' && goal.expense_category) {
            if (t.expense_category !== goal.expense_category) continue;
          } else if (goal.transaction_type === 'income' && goal.income_category) {
            if (t.income_category !== goal.income_category) continue;
          }

          const dateStr = t.date || t.created_at;
          if (!dateStr) continue;
          const tDate = new Date(dateStr);
          if (tDate >= start && tDate < end) {
            const converted = convert(t.amount, t.currency || 'USD', goal.currency || 'USD');
            spent += converted;
          }
        }

        const remaining = goal.amount - spent;
        const percentage_used = goal.amount > 0 ? (spent / goal.amount) * 100 : 0;
        const is_over_budget = spent > goal.amount;

        return {
          goal,
          spent,
          remaining,
          percentage_used,
          is_over_budget,
          currency: goal.currency,
        };
      });
    },
  });
}

export function useCreateBudgetGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BudgetGoalCreate) => {
      const {data} = await budgetGoalsApi.create(payload);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({queryKey: BUDGET_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useUpdateBudgetGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, payload}: {id: string; payload: BudgetGoalUpdate}) => {
      const {data} = await budgetGoalsApi.update(id, payload);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({queryKey: BUDGET_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useDeleteBudgetGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const {data} = await budgetGoalsApi.delete(id);
      if (data.hasError) throw new Error(data.message);
    },
    onSuccess: () => qc.invalidateQueries({queryKey: BUDGET_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}
