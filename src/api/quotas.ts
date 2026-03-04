import { apiClient } from './client';
import type { Quota } from '../types';

export const quotasApi = {
  /** GET /quotas/me — current tenant's quota + usage */
  get: () => apiClient.get<Quota>('/quotas/me').then((r) => r.data),
};
