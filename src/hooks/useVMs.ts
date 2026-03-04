import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vmsApi } from '../api/vms';
import type { VMCreate } from '../types';
import { QUERY_KEYS } from '../lib/constants';

export const useVMs = (params?: { skip?: number; limit?: number }) =>
  useQuery({ queryKey: [...QUERY_KEYS.vms, params], queryFn: () => vmsApi.list(params) });

export const useVM = (id: string) =>
  useQuery({ queryKey: QUERY_KEYS.vm(id), queryFn: () => vmsApi.get(id), enabled: !!id });

export const useCreateVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VMCreate) => vmsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.vms }),
  });
};

export const useStartVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vmsApi.start(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.vms });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.vm(id) });
    },
  });
};

export const useStopVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vmsApi.stop(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.vms });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.vm(id) });
    },
  });
};

export const useDeleteVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vmsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.vms }),
  });
};
