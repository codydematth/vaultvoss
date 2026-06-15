import {apiClient} from './client';
import type {
  ApiResponse,
  RecurringTransaction,
  RecurringTransactionCreate,
  RecurringTransactionUpdate,
} from './types';

export const recurringApi = {
  list: () =>
    apiClient.get<ApiResponse<RecurringTransaction[]>>('/recurring-transactions/'),

  create: (p: RecurringTransactionCreate) =>
    apiClient.post<ApiResponse<RecurringTransaction>>('/recurring-transactions/', p),

  update: (id: string, p: RecurringTransactionUpdate) =>
    apiClient.patch<ApiResponse<RecurringTransaction>>(`/recurring-transactions/${id}`, p),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/recurring-transactions/${id}`),

  trigger: (id: string) =>
    apiClient.post<ApiResponse<Transaction>>(`/recurring-transactions/${id}/trigger`),
};

// Local import to avoid circular — only used for type return value
type Transaction = import('./types').Transaction;
