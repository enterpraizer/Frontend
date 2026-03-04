import { apiClient } from './client';
import type { ResourceUsage } from '../types';

export const dashboardApi = {
  /** GET /dashboard/usage */
  usage: () =>
    apiClient.get<ResourceUsage>('/dashboard/usage').then((r) => r.data),
};
