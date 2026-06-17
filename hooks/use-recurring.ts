import {recurringApi} from '@/lib/api/recurring';
import {getApiError} from '@/lib/api/client';
import type {RecurringTransactionCreate, RecurringTransactionUpdate} from '@/lib/api/types';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {syncAllRecurringReminders} from '@/lib/notifications';

export const RECURRING_KEYS = {
  all: ['recurring'] as const,
  list: () => ['recurring', 'list'] as const,
  detail: (id: string) => ['recurring', 'detail', id] as const,
};

export function useRecurringTransactions() {
  return useQuery({
    queryKey: RECURRING_KEYS.list(),
    queryFn: async () => {
      const {data} = await recurringApi.list();
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
  });
}

export function useRecurringTransaction(id: string) {
  return useQuery({
    queryKey: RECURRING_KEYS.detail(id),
    queryFn: async () => {
      const {data} = await recurringApi.get(id);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    enabled: !!id,
  });
}

async function syncReminders() {
  try {
    const {data} = await recurringApi.list();
    if (data.data) {
      await syncAllRecurringReminders(data.data);
    }
  } catch (err) {
    console.error('Failed to sync recurring reminders after mutation:', err);
  }
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecurringTransactionCreate) => {
      const {data} = await recurringApi.create(payload);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: RECURRING_KEYS.all});
      await syncReminders();
    },
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, payload}: {id: string; payload: RecurringTransactionUpdate}) => {
      const {data} = await recurringApi.update(id, payload);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: RECURRING_KEYS.all});
      await syncReminders();
    },
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const {data} = await recurringApi.delete(id);
      if (data.hasError) throw new Error(data.message);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: RECURRING_KEYS.all});
      await syncReminders();
    },
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useTriggerRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const {data} = await recurringApi.trigger(id);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: RECURRING_KEYS.all});
      await qc.invalidateQueries({queryKey: ['transactions']});
      await syncReminders();
    },
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}
