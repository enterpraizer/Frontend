import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vmsApi } from '@/api/vms';
import { queryKeys } from '@/api/queryKeys';
import type { VM, VMCreate, VMSuggestResponse, VmSuggestion, ApiError } from '@/types';

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
    queryFn: () =>
      vmsApi.list({
        offset: params?.offset,
        limit: params?.limit,
        status_filter: params?.status,
      }),
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

// ─── Suggestions ─────────────────────────────────────────────────────────────

/** POST /vms/suggest — AI-powered config recommendation */
export const useSuggestVM = () => {
  const mutation = useMutation<VMSuggestResponse, Error, { description: string }>({
    mutationFn: ({ description }) => vmsApi.suggest(description),
    onError: () => toast.error('Сервис рекомендаций недоступен'),
  });

  return {
    ...mutation,
    /** Resolved suggestion or null when not yet fetched / after reset */
    suggestion: (mutation.data ?? null) as VMSuggestResponse | null,
  };
};

/** GET /vms/{vmId}/suggestions — auto-refetches every 5 minutes */
export const useVMSuggestions = (vmId: string) =>
  useQuery({
    queryKey: queryKeys.vms.suggestions(vmId),
    queryFn: () => vmsApi.listSuggestions(vmId),
    enabled: !!vmId,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

function makeOptimisticRemove(suggestionId: string) {
  return (old: VmSuggestion[] | undefined) =>
    old?.filter((s) => s.id !== suggestionId) ?? [];
}

/** POST /vms/{vmId}/suggestions/{id}/accept — optimistic removal + cache invalidation + success toast */
export const useAcceptSuggestion = (vmId: string) => {
  const qc = useQueryClient();
  const key = queryKeys.vms.suggestions(vmId);
  const vmKey = queryKeys.vms.detail(vmId);
  return useMutation({
    mutationFn: (suggestionId: string) => vmsApi.acceptSuggestion(vmId, suggestionId),
    onMutate: async (suggestionId) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<VmSuggestion[]>(key);
      const prevVm = qc.getQueryData<VM>(vmKey);
      qc.setQueryData<VmSuggestion[]>(key, makeOptimisticRemove(suggestionId));
      return { previous, prevVm };
    },
    onSuccess: (updatedVm, _id, ctx) => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: vmKey });
      qc.invalidateQueries({ queryKey: queryKeys.vms.all });

      // Build a human-readable diff between old and new config
      const prev = ctx?.prevVm;
      const changes: string[] = [];
      if (prev) {
        if (updatedVm.vcpu !== prev.vcpu)
          changes.push(`vCPU: ${prev.vcpu} → ${updatedVm.vcpu}`);
        if (updatedVm.ram_mb !== prev.ram_mb)
          changes.push(`RAM: ${prev.ram_mb} МБ → ${updatedVm.ram_mb} МБ`);
        if (updatedVm.disk_gb !== prev.disk_gb)
          changes.push(`Диск: ${prev.disk_gb} ГБ → ${updatedVm.disk_gb} ГБ`);
      }

      if (changes.length > 0) {
        toast.success('✅ Рекомендация применена', {
          description: changes.join('  •  '),
          duration: 6000,
        });
      } else {
        toast.success('✅ Рекомендация применена');
      }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error('Не удалось применить рекомендацию');
    },
  });
};

/** POST /vms/{vmId}/suggestions/{id}/dismiss — optimistic removal + cache invalidation */
export const useDismissSuggestion = (vmId: string) => {
  const qc = useQueryClient();
  const key = queryKeys.vms.suggestions(vmId);
  return useMutation({
    mutationFn: (suggestionId: string) => vmsApi.dismissSuggestion(vmId, suggestionId),
    onMutate: async (suggestionId) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<VmSuggestion[]>(key);
      qc.setQueryData<VmSuggestion[]>(key, makeOptimisticRemove(suggestionId));
      return { previous };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error('Не удалось отклонить рекомендацию');
    },
  });
};

/** POST /vms/{vmId}/trigger-analyze — manual AI analysis, rate-limited 1/day */
export const useTriggerAnalyze = (vmId: string) => {
  const qc = useQueryClient();
  const key = queryKeys.vms.suggestions(vmId);
  return useMutation({
    mutationFn: () => vmsApi.triggerAnalyze(vmId),
    onSuccess: (data) => {
      // Refresh suggestions list if a new suggestion was created
      if (data.suggestion) {
        qc.invalidateQueries({ queryKey: key });
      }
      if (data.cooldown_remaining_sec > 0) {
        toast.warning(data.message, { duration: 5000 });
      } else if (data.suggestion) {
        toast.success(data.message, { duration: 5000 });
      } else {
        toast.info(data.message, { duration: 5000 });
      }
    },
    onError: () => toast.error('Не удалось запустить анализ ИИ'),
  });
};
