import {apiClient} from './client';
import type {
  AnalyticsByPeriodParams,
  AnalyticsSummary,
  ApiResponse,
  CategoryBreakdownItem,
  MonthlyDataPoint,
} from './types';

export const analyticsApi = {
  summary: (params?: AnalyticsByPeriodParams) =>
    apiClient.get<ApiResponse<AnalyticsSummary>>('/analytics/summary', {params}),

  byCategory: (params?: AnalyticsByPeriodParams) =>
    apiClient.get<ApiResponse<CategoryBreakdownItem[]>>('/analytics/by-category', {params}),

  monthly: (params?: {months?: number; currency?: string}) =>
    apiClient.get<ApiResponse<MonthlyDataPoint[]>>('/analytics/monthly', {params}),
};
