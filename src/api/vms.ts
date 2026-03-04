import { apiClient } from './client';
import type { VM, VMCreate, Paginated } from '../types';

export const vmsApi = {
  /** GET /vms */
  list: (params?: { offset?: number; limit?: number }) =>
    apiClient.get<Paginated<VM>>('/vms', { params }).then((r) => r.data),

  /** GET /vms/:id */
  get: (id: string) =>
    apiClient.get<VM>(`/vms/${id}`).then((r) => r.data),

  /** POST /vms */
  create: (payload: VMCreate) =>
    apiClient.post<VM>('/vms', payload).then((r) => r.data),

  /** POST /vms/:id/start */
  start: (id: string) =>
    apiClient.post<VM>(`/vms/${id}/start`).then((r) => r.data),

  /** POST /vms/:id/stop */
  stop: (id: string) =>
    apiClient.post<VM>(`/vms/${id}/stop`).then((r) => r.data),

  /** DELETE /vms/:id — terminate (stop + remove) the VM */
  terminate: (id: string) =>
    apiClient.delete<void>(`/vms/${id}`).then((r) => r.data),
};
