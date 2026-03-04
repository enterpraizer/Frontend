import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import type { Quota } from '../types';
import { QUERY_KEYS } from '../lib/constants';

export const useAdminStats = () =>
  useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats });

export const useAdminTenants = (params?: { skip?: number; limit?: number }) =>
  useQuery({ queryKey: [...QUERY_KEYS.tenants, params], queryFn: () => adminApi.listTenants(params) });

export const useAdminTenant = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.tenant(id),
    queryFn: () => adminApi.getTenant(id),
    enabled: !!id,
  });

export const useAdminTenantQuota = (id: string) =>
  useQuery({
    queryKey: [...QUERY_KEYS.tenant(id), 'quota'],
    queryFn: () => adminApi.getTenantQuota(id),
    enabled: !!id,
  });

export const useUpdateTenantQuota = (tenantId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quota: Partial<Quota>) => adminApi.updateTenantQuota(tenantId, quota),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...QUERY_KEYS.tenant(tenantId), 'quota'] }),
  });
};

export const useAdminVMs = (params?: { skip?: number; limit?: number }) =>
  useQuery({ queryKey: [...QUERY_KEYS.vms, 'admin', params], queryFn: () => adminApi.listVMs(params) });

export const useAuditLogs = () =>
  useQuery({ queryKey: QUERY_KEYS.auditLogs, queryFn: () => adminApi.listVMs() });
