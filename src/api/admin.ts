import { apiClient } from './client';
import type { Tenant, VM, User, AdminStats, Quota, Paginated, ResourceUsage } from '../types';

export const adminApi = {
  // ── Stats ─────────────────────────────────────────────────────────────────

  /** GET /admin/stats */
  stats: () =>
    apiClient.get<AdminStats>('/admin/stats').then((r) => r.data),

  // ── Tenants ───────────────────────────────────────────────────────────────

  /** GET /admin/tenants */
  listTenants: (params?: { offset?: number; limit?: number }) =>
    apiClient.get<Paginated<Tenant>>('/admin/tenants', { params }).then((r) => r.data),

  /** GET /admin/tenants/:id */
  getTenant: (id: string) =>
    apiClient.get<Tenant>(`/admin/tenants/${id}`).then((r) => r.data),

  /** GET /admin/tenants/:id/quota */
  getTenantQuota: (id: string) =>
    apiClient.get<Quota>(`/admin/tenants/${id}/quota`).then((r) => r.data),

  /** PATCH /admin/tenants/:id/quota */
  updateTenantQuota: (id: string, quota: Partial<Quota>) =>
    apiClient.patch<Quota>(`/admin/tenants/${id}/quota`, quota).then((r) => r.data),

  /** PATCH /admin/tenants/:id?is_active=true */
  activateTenant: (id: string) =>
    apiClient.patch<Tenant>(`/admin/tenants/${id}`, null, { params: { is_active: true } }).then((r) => r.data),

  /** PATCH /admin/tenants/:id?is_active=false */
  deactivateTenant: (id: string) =>
    apiClient.patch<Tenant>(`/admin/tenants/${id}`, null, { params: { is_active: false } }).then((r) => r.data),

  /** GET /admin/tenants/:id/quota — returns quota + usage */
  getTenantUsage: (id: string) =>
    apiClient.get<ResourceUsage>(`/admin/tenants/${id}/quota`).then((r) => r.data),

  // ── VMs ───────────────────────────────────────────────────────────────────

  /** GET /admin/vms */
  listVMs: (params?: { offset?: number; limit?: number; tenant_id?: string; status?: string }) =>
    apiClient.get<Paginated<VM>>('/admin/vms', { params }).then((r) => r.data),

  // ── Users ─────────────────────────────────────────────────────────────────

  /** GET /users */
  listUsers: (params?: { offset?: number; limit?: number }) =>
    apiClient.get<Paginated<User>>('/users', { params }).then((r) => r.data),

  /** GET /admin/activity */
  listActivity: (params?: {
    offset?: number;
    limit?: number;
    tenant_id?: string;
    action?: string;
    from?: string;
    to?: string;
  }) =>
    apiClient
      .get<{ items: import('./dashboard').ActivityEntry[]; total: number }>(
        '/admin/activity',
        { params }
      )
      .then((r) => r.data),
};
