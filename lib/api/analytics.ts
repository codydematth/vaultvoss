import {apiClient} from './client';
import type {
  AnalyticsByPeriodParams,
  AnalyticsSummary,
  ApiResponse,
  CategoryBreakdownResponse,
  MonthlyDataPoint,
} from './types';

export const analyticsApi = {
  summary: (params?: AnalyticsByPeriodParams) =>
    apiClient.get<ApiResponse<AnalyticsSummary>>('/analytics/summary', {params}),

  byCategory: (params?: AnalyticsByPeriodParams) =>
    apiClient.get<ApiResponse<CategoryBreakdownResponse>>('/analytics/by-category', {params}),

  monthly: (params?: {months?: number; currency?: string}) =>
    apiClient.get<ApiResponse<MonthlyDataPoint[]>>('/analytics/monthly', {params}),
};
