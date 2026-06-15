import {netWorthApi} from '@/lib/api/net-worth';
import {getApiError} from '@/lib/api/client';
import type {NetWorthItemCreate, NetWorthItemUpdate} from '@/lib/api/types';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export const NET_WORTH_KEYS = {
  all: ['net-worth'] as const,
  list: () => ['net-worth', 'list'] as const,
};

export function useNetWorth() {
  return useQuery({
    queryKey: NET_WORTH_KEYS.list(),
    queryFn: async () => {
      const {data} = await netWorthApi.list();
      if (data.hasError) throw new Error(data.message);
      return data.data;
    },
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
