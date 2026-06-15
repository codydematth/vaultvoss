import {transactionsApi} from '@/lib/api/transactions';
import {getApiError} from '@/lib/api/client';
import type {TransactionCreate, TransactionListParams, TransactionUpdate} from '@/lib/api/types';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export const TXN_KEYS = {
  all: ['transactions'] as const,
  list: (p?: TransactionListParams) => ['transactions', 'list', p] as const,
  detail: (id: string) => ['transactions', 'detail', id] as const,
  meta: (p?: object) => ['transactions', 'meta', p] as const,
};

export function useTransactions(params?: TransactionListParams) {
  return useQuery({
    queryKey: TXN_KEYS.list(params),
    queryFn: async () => {
      const {data} = await transactionsApi.list(params);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
  });
}

export function useTransactionMeta(params?: object) {
  return useQuery({
    queryKey: TXN_KEYS.meta(params),
    queryFn: async () => {
      const {data} = await transactionsApi.meta(params as any);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: TXN_KEYS.detail(id),
    queryFn: async () => {
      const {data} = await transactionsApi.getById(id);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TransactionCreate) => {
      const {data} = await transactionsApi.create(payload);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({queryKey: TXN_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, payload}: {id: string; payload: TransactionUpdate}) => {
      const {data} = await transactionsApi.update(id, payload);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({queryKey: TXN_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const {data} = await transactionsApi.delete(id);
      if (data.hasError) throw new Error(data.message);
    },
    onSuccess: () => qc.invalidateQueries({queryKey: TXN_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}
