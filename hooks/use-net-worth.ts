import {netWorthApi} from '@/lib/api/net-worth';
import {getApiError} from '@/lib/api/client';
import type {NetWorthItemCreate, NetWorthItemUpdate, NetWorthItem, NetWorthSummary} from '@/lib/api/types';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useCurrency} from '@/lib/currency-context';
import {useMemo} from 'react';

export const NET_WORTH_KEYS = {
  all: ['net-worth'] as const,
  list: () => ['net-worth', 'list'] as const,
  detail: (id: string) => ['net-worth', 'detail', id] as const,
};

export function useNetWorth() {
  const {currency: preferredCurrency, convert} = useCurrency();

  const {data: rawItems, isLoading, error, refetch} = useQuery<NetWorthItem[]>({
    queryKey: NET_WORTH_KEYS.list(),
    queryFn: async () => {
      const {data} = await netWorthApi.list();
      if (data.hasError) throw new Error(data.message);
      
      const items = (data.data || []) as unknown as NetWorthItem[];
      return items.map((item) => ({
        ...item,
        value: typeof item.value === 'string' ? parseFloat(item.value as string) : (item.value ?? 0),
      }));
    },
  });

  const summary = useMemo((): NetWorthSummary | undefined => {
    if (!rawItems) return undefined;

    let total_assets = 0;
    let total_liabilities = 0;

    for (const item of rawItems) {
      const itemCurrency = item.currency || 'USD';
      const convertedVal = convert(item.value, itemCurrency, preferredCurrency);

      if (item.item_type === 'asset') {
        total_assets += convertedVal;
      } else if (item.item_type === 'liability') {
        total_liabilities += convertedVal;
      }
    }

    return {
      total_assets,
      total_liabilities,
      net_worth: total_assets - total_liabilities,
      currency: preferredCurrency,
      items: rawItems,
    };
  }, [rawItems, preferredCurrency, convert]);

  return {data: summary, isLoading, error, refetch};
}

export function useNetWorthItem(itemId: string) {
  return useQuery<NetWorthItem>({
    queryKey: NET_WORTH_KEYS.detail(itemId),
    queryFn: async () => {
      const {data} = await netWorthApi.get(itemId);
      if (data.hasError) throw new Error(data.message);
      const item = data.data;
      if (!item) throw new Error('Item not found');
      return {
        ...item,
        value: typeof item.value === 'string' ? parseFloat(item.value) : (item.value ?? 0),
      };
    },
    enabled: !!itemId,
  });
}

export function useCreateNetWorthItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NetWorthItemCreate) => {
      const {data} = await netWorthApi.create(payload);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({queryKey: NET_WORTH_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useSnapshotNetWorth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const {data} = await netWorthApi.snapshot();
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({queryKey: NET_WORTH_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useUpdateNetWorthItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, payload}: {id: string; payload: NetWorthItemUpdate}) => {
      const {data} = await netWorthApi.update(id, payload);
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({queryKey: NET_WORTH_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}

export function useDeleteNetWorthItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const {data} = await netWorthApi.delete(id);
      if (data.hasError) throw new Error(data.message);
    },
    onSuccess: () => qc.invalidateQueries({queryKey: NET_WORTH_KEYS.all}),
    onError: (err) => { throw new Error(getApiError(err)); },
  });
}
