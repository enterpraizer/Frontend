import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';
import type { Quota } from '@/types';

interface AdminListParams {
  skip?: number;
  limit?: number;
}

function errDetail(err: unknown): string {
  const e = err as { response?: { data?: { detail?: string } } };
  return e?.response?.data?.detail ?? 'An unexpected error occurred';
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export const useAdminStats = () =>
  useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: adminApi.stats,
    staleTime: 60_000,
  });

// ─── Tenants ─────────────────────────────────────────────────────────────────

export const useTenantList = (params?: AdminListParams) =>
  useQuery({
    queryKey: queryKeys.admin.tenants(params),
    queryFn: () => adminApi.listTenants(params),
    staleTime: 30_000,
  });

export const useTenantDetail = (id: string) =>
  useQuery({
    queryKey: queryKeys.admin.tenantDetail(id),
    queryFn: () => adminApi.getTenant(id),
    enabled: !!id,
    staleTime: 30_000,
  });

export const useTenantQuota = (id: string) =>
  useQuery({
    queryKey: queryKeys.admin.tenantQuota(id),
    queryFn: () => adminApi.getTenantQuota(id),
    enabled: !!id,
  });

export const useUpdateQuota = (tenantId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quota: Partial<Quota>) => adminApi.updateTenantQuota(tenantId, quota),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.tenantQuota(tenantId) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.tenantDetail(tenantId) });
      toast.success('Quota updated');
    },
    onError: (err: unknown) => toast.error(errDetail(err)),
  });
};

export const useToggleTenantActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? adminApi.activateTenant(id) : adminApi.deactivateTenant(id),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.tenantDetail(id) });
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast.success('Tenant status updated');
    },
    onError: (err: unknown) => toast.error(errDetail(err)),
  });
};

// ─── Admin VMs ───────────────────────────────────────────────────────────────

export const useAdminVMs = (params?: AdminListParams) =>
  useQuery({
    queryKey: queryKeys.admin.allVMs(params),
    queryFn: () => adminApi.listVMs(params),
    staleTime: 30_000,
  });

export const useTenantUsage = (id: string) =>
  useQuery({
    queryKey: ['admin', 'tenants', id, 'usage'] as const,
    queryFn: () => adminApi.getTenantUsage(id),
    enabled: !!id,
    staleTime: 30_000,
  });

export const useTenantVMs = (tenantId: string, params?: AdminListParams) =>
  useQuery({
    queryKey: ['admin', 'tenants', tenantId, 'vms', params] as const,
    queryFn: () => adminApi.listVMs({ ...params, tenant_id: tenantId } as Parameters<typeof adminApi.listVMs>[0]),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

// ─── Admin Users ─────────────────────────────────────────────────────────────

export const useAdminUsers = (params?: AdminListParams) =>
  useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: () => adminApi.listUsers(params),
    staleTime: 60_000,
  });
