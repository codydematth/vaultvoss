import {apiClient} from './client';
import type {
  ApiResponse,
  NetWorthItem,
  NetWorthItemCreate,
  NetWorthItemUpdate,
  NetWorthSummary,
} from './types';

export const netWorthApi = {
  list: () =>
    apiClient.get<ApiResponse<NetWorthItem[]>>('/net-worth/'),

  create: (p: NetWorthItemCreate) =>
    apiClient.post<ApiResponse<NetWorthItem>>('/net-worth/', p),

  snapshot: () =>
    apiClient.get<ApiResponse<NetWorthSummary>>('/net-worth/snapshot'),

  get: (itemId: string) =>
    apiClient.get<ApiResponse<NetWorthItem>>(`/net-worth/${itemId}`),

  update: (itemId: string, p: NetWorthItemUpdate) =>
    apiClient.patch<ApiResponse<NetWorthItem>>(`/net-worth/${itemId}`, p),

  delete: (itemId: string) =>
    apiClient.delete<ApiResponse<null>>(`/net-worth/${itemId}`),
};
