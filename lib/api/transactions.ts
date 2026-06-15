import {apiClient} from './client';
import type {
  ApiResponse,
  Transaction,
  TransactionCreate,
  TransactionListParams,
  TransactionMeta,
  TransactionUpdate,
} from './types';

export const transactionsApi = {
  list: (params?: TransactionListParams) =>
    apiClient.get<ApiResponse<Transaction[]>>('/transactions/', {params}),

  meta: (params?: Omit<TransactionListParams, 'skip' | 'limit'>) =>
    apiClient.get<ApiResponse<TransactionMeta>>('/transactions/meta', {params}),

  create: (p: TransactionCreate) =>
    apiClient.post<ApiResponse<Transaction>>('/transactions/', p),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`),

  update: (id: string, p: TransactionUpdate) =>
    apiClient.patch<ApiResponse<Transaction>>(`/transactions/${id}`, p),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/transactions/${id}`),
};
