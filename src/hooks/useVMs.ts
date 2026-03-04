import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vmsApi } from '@/api/vms';
import { queryKeys } from '@/api/queryKeys';
import type { VMCreate, ApiError } from '@/types';

interface VMListParams {
  limit?: number;
  offset?: number;
  status?: string;
}

function toApiError(err: unknown): ApiError {
  const e = err as { response?: { data?: ApiError; status?: number } };
  return {
    detail: e?.response?.data?.detail ?? 'An unexpected error occurred',
    resource: e?.response?.data?.resource,
    requested: e?.response?.data?.requested,
    available: e?.response?.data?.available,
  };
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const useVMList = (params?: VMListParams) =>
  useQuery({
    queryKey: queryKeys.vms.list(params),
    queryFn: () => vmsApi.list({ offset: params?.offset, limit: params?.limit }),
    staleTime: 30_000,
  });

export const useVM = (id: string) =>
  useQuery({
    queryKey: queryKeys.vms.detail(id),
    queryFn: () => vmsApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  });

// ─── Mutations ───────────────────────────────────────────────────────────────

export const useCreateVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VMCreate) => vmsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vms.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.usage });
      toast.success('VM created successfully');
    },
    onError: (err: unknown) => {
      const apiErr = toApiError(err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429 && apiErr.resource) {
        toast.error(
          `Quota exceeded for ${apiErr.resource}: ${apiErr.available ?? 0} available`
        );
      } else {
        toast.error(apiErr.detail);
      }
    },
  });
};

export const useStartVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vmsApi.start(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.vms.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.vms.all });
      toast.success('VM started');
    },
    onError: (err: unknown) => toast.error(toApiError(err).detail),
  });
};

export const useStopVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vmsApi.stop(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.vms.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.vms.all });
      toast.success('VM stopped');
    },
    onError: (err: unknown) => toast.error(toApiError(err).detail),
  });
};

export const useTerminateVM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vmsApi.terminate(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.vms.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.vms.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.usage });
      toast.success('VM terminated');
    },
    onError: (err: unknown) => toast.error(toApiError(err).detail),
  });
};
