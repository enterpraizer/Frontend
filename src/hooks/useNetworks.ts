import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { networksApi, type NetworkCreate } from '@/api/networks';
import { queryKeys } from '@/api/queryKeys';

interface NetworkListParams {
  limit?: number;
  offset?: number;
}

function errDetail(err: unknown): string {
  const e = err as { response?: { data?: { detail?: string } } };
  return e?.response?.data?.detail ?? 'An unexpected error occurred';
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const useNetworkList = (params?: NetworkListParams) =>
  useQuery({
    queryKey: queryKeys.networks.list(params),
    queryFn: () => networksApi.list({ offset: params?.offset, limit: params?.limit }),
    staleTime: 30_000,
  });

export const useNetwork = (id: string) =>
  useQuery({
    queryKey: queryKeys.networks.detail(id),
    queryFn: () => networksApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  });

// ─── Mutations ───────────────────────────────────────────────────────────────

export const useCreateNetwork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NetworkCreate) => networksApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.networks.all });
      toast.success('Network created successfully');
    },
    onError: (err: unknown) => toast.error(errDetail(err)),
  });
};

export const useDeleteNetwork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => networksApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.networks.all });
      toast.success('Network deleted');
    },
    onError: (err: unknown) => toast.error(errDetail(err)),
  });
};

export const useAttachVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ networkId, vmId }: { networkId: string; vmId: string }) =>
      networksApi.attachVM(networkId, vmId),
    onSuccess: (_data, { networkId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.networks.detail(networkId) });
      qc.invalidateQueries({ queryKey: queryKeys.vms.all });
      toast.success('VM attached to network');
    },
    onError: (err: unknown) => toast.error(errDetail(err)),
  });
};

export const useDetachVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ networkId, vmId }: { networkId: string; vmId: string }) =>
      networksApi.detachVM(networkId, vmId),
    onSuccess: (_data, { networkId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.networks.detail(networkId) });
      qc.invalidateQueries({ queryKey: queryKeys.vms.all });
      toast.success('VM detached from network');
    },
    onError: (err: unknown) => toast.error(errDetail(err)),
  });
};
