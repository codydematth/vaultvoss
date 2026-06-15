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
    apiClient.get<ApiResponse<NetWorthSummary>>('/net-worth/'),

  create: (p: NetWorthItemCreate) =>
    apiClient.post<ApiResponse<NetWorthItem>>('/net-worth/', p),

  snapshot: () =>
    apiClient.post<ApiResponse<NetWorthSummary>>('/net-worth/snapshot'),

  update: (itemId: string, p: NetWorthItemUpdate) =>
    apiClient.patch<ApiResponse<NetWorthItem>>(`/net-worth/${itemId}`, p),

  delete: (itemId: string) =>
    apiClient.delete<ApiResponse<null>>(`/net-worth/${itemId}`),
};
