import { apiClient } from './client';
import type { ResourceUsage } from '../types';

export interface VMSummary {
  total: number;
  running: number;
  stopped: number;
  pending: number;
  terminated: number;
}

export interface ActivityEntry {
  id: string;
  action: string;
  resource: string;
  resource_id: string;
  user_id: string;
  tenant_id?: string;
  user_email?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export const dashboardApi = {
  /** GET /dashboard/usage */
  usage: () =>
    apiClient.get<ResourceUsage>('/dashboard/usage').then((r) => r.data),

  /** GET /dashboard/vms-summary */
  vmSummary: () =>
    apiClient.get<VMSummary>('/dashboard/vms-summary').then((r) => r.data),

  /** GET /dashboard/activity */
  activity: () =>
    apiClient.get<ActivityEntry[]>('/dashboard/activity').then((r) => r.data),
};
