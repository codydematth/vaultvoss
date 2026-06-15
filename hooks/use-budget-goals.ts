import {budgetGoalsApi} from '@/lib/api/budget-goals';
import {getApiError} from '@/lib/api/client';
import type {BudgetGoalCreate, BudgetGoalUpdate} from '@/lib/api/types';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

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
  return useQuery({
    queryKey: BUDGET_KEYS.status(goalId),
    queryFn: async () => {
      const {data} = await budgetGoalsApi.getStatus(goalId);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    enabled: !!goalId,
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
