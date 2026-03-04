import { useQuery } from '@tanstack/react-query';
import { quotasApi } from '../api/quotas';
import { QUERY_KEYS } from '../lib/constants';

export const useQuota = () =>
  useQuery({ queryKey: QUERY_KEYS.quotas, queryFn: quotasApi.get });
