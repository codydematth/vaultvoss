import {analyticsApi} from '@/lib/api/analytics';
import type {AnalyticsByPeriodParams} from '@/lib/api/types';
import {useQuery} from '@tanstack/react-query';

export const ANALYTICS_KEYS = {
  all: ['analytics'] as const,
  summary: (p?: AnalyticsByPeriodParams) => ['analytics', 'summary', p] as const,
  byCategory: (p?: AnalyticsByPeriodParams) => ['analytics', 'by-category', p] as const,
  monthly: (p?: object) => ['analytics', 'monthly', p] as const,
};

export function useAnalyticsSummary(params?: AnalyticsByPeriodParams) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.summary(params),
    queryFn: async () => {
      const {data} = await analyticsApi.summary(params);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
  });
}

export function useAnalyticsByCategory(params?: AnalyticsByPeriodParams) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.byCategory(params),
    queryFn: async () => {
      const {data} = await analyticsApi.byCategory(params);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
  });
}

export function useAnalyticsMonthly(params?: {months?: number; currency?: string}) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.monthly(params),
    queryFn: async () => {
      const {data} = await analyticsApi.monthly(params);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
  });
}
