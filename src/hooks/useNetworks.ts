import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { networksApi, type NetworkCreate } from '../api/networks';
import { QUERY_KEYS } from '../lib/constants';

export const useNetworks = (params?: { skip?: number; limit?: number }) =>
  useQuery({ queryKey: [...QUERY_KEYS.networks, params], queryFn: () => networksApi.list(params) });

export const useNetwork = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.network(id),
    queryFn: () => networksApi.get(id),
    enabled: !!id,
  });

export const useCreateNetwork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NetworkCreate) => networksApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.networks }),
  });
};

export const useDeleteNetwork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => networksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.networks }),
  });
};
