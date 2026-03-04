import { apiClient } from './client';
import type { Network, Paginated } from '../types';

export interface NetworkCreate {
  name: string;
  cidr: string;
}

export const networksApi = {
  /** GET /networks */
  list: (params?: { skip?: number; limit?: number }) =>
    apiClient.get<Paginated<Network>>('/networks', { params }).then((r) => r.data),

  /** GET /networks/:id */
  get: (id: string) =>
    apiClient.get<Network>(`/networks/${id}`).then((r) => r.data),

  /** POST /networks */
  create: (payload: NetworkCreate) =>
    apiClient.post<Network>('/networks', payload).then((r) => r.data),

  /** DELETE /networks/:id */
  delete: (id: string) =>
    apiClient.delete<void>(`/networks/${id}`).then((r) => r.data),

  /** POST /networks/:id/attach — attach a VM to this network */
  attachVM: (networkId: string, vmId: string) =>
    apiClient.post<void>(`/networks/${networkId}/attach`, { vm_id: vmId }).then((r) => r.data),

  /** POST /networks/:id/detach — detach a VM from this network */
  detachVM: (networkId: string, vmId: string) =>
    apiClient.post<void>(`/networks/${networkId}/detach`, { vm_id: vmId }).then((r) => r.data),
};
