import {useQuery} from '@tanstack/react-query';
import {fetchEnums, FALLBACK_ENUMS, type EnumValues} from '@/lib/api/enums';

/**
 * Fetches enum values (categories, types, etc.) from the backend's OpenAPI spec.
 * Values are cached for 1 hour and served stale while revalidating.
 * Returns the fallback hardcoded values while loading or on error.
 */
export function useEnums(): EnumValues & {isLoading: boolean} {
  const {data, isLoading} = useQuery({
    queryKey: ['enums'],
    queryFn: fetchEnums,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  });

  return {
    ...(data ?? FALLBACK_ENUMS),
    isLoading,
  };
}
