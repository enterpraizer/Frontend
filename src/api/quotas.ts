import { apiClient } from './client';
import type { Quota, ResourceUsage } from '../types';

export const quotasApi = {
  /** GET /dashboard/usage — returns usage summary; extract max values as Quota */
  get: () =>
    apiClient.get<ResourceUsage>('/dashboard/usage').then((r) => ({
      max_vcpu: r.data.vcpu.max,
      max_ram_mb: r.data.ram_mb.max,
      max_disk_gb: r.data.disk_gb.max,
      max_vms: r.data.vms.max,
    } as Quota)),
};
