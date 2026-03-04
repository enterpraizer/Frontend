import { useQuery } from '@tanstack/react-query';
import { quotasApi } from '@/api/quotas';

export const useQuota = () =>
  useQuery({
    queryKey: ['quotas', 'me'],
    queryFn: quotasApi.get,
    staleTime: 60_000,
  });
