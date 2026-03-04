import { apiClient } from './client';
import type { Tenant, VM, User, AdminStats, Quota, Paginated, ResourceUsage } from '../types';

export const adminApi = {
  // ── Stats ─────────────────────────────────────────────────────────────────

  /** GET /admin/stats */
  stats: () =>
    apiClient.get<AdminStats>('/admin/stats').then((r) => r.data),

  // ── Tenants ───────────────────────────────────────────────────────────────

  /** GET /admin/tenants */
  listTenants: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<Paginated<Tenant>>('/admin/tenants', { params }).then((r) => r.data),

  /** GET /admin/tenants/:id */
  getTenant: (id: string) =>
    apiClient.get<Tenant>(`/admin/tenants/${id}`).then((r) => r.data),

  /** GET /admin/tenants/:id/quota */
  getTenantQuota: (id: string) =>
    apiClient.get<Quota>(`/admin/tenants/${id}/quota`).then((r) => r.data),

  /** PUT /admin/tenants/:id/quota */
  updateTenantQuota: (id: string, quota: Partial<Quota>) =>
    apiClient.put<Quota>(`/admin/tenants/${id}/quota`, quota).then((r) => r.data),

  /** PATCH /admin/tenants/:id/activate */
  activateTenant: (id: string) =>
    apiClient.patch<Tenant>(`/admin/tenants/${id}/activate`).then((r) => r.data),

  /** PATCH /admin/tenants/:id/deactivate */
  deactivateTenant: (id: string) =>
    apiClient.patch<Tenant>(`/admin/tenants/${id}/deactivate`).then((r) => r.data),

  /** GET /admin/tenants/:id/usage */
  getTenantUsage: (id: string) =>
    apiClient.get<ResourceUsage>(`/admin/tenants/${id}/usage`).then((r) => r.data),

  // ── VMs ───────────────────────────────────────────────────────────────────

  /** GET /admin/vms */
  listVMs: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<Paginated<VM>>('/admin/vms', { params }).then((r) => r.data),

  // ── Users ─────────────────────────────────────────────────────────────────

  /** GET /admin/users */
  listUsers: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<Paginated<User>>('/admin/users', { params }).then((r) => r.data),
};
