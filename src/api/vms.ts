import { apiClient } from './client';
import type { VM, VMCreate, VMSuggestResponse, AISuggestion, Paginated, TriggerAnalyzeResponse } from '../types';

export const vmsApi = {
  /** GET /vms */
  list: (params?: { offset?: number; limit?: number; status_filter?: string }) =>
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

  /** POST /vms/suggest — AI-powered VM config recommendation */
  suggest: (description: string) =>
    apiClient.post<VMSuggestResponse>('/vms/suggest', { description }).then((r) => r.data),

  /** GET /vms/:id/suggestions */
  listSuggestions: (vmId: string) =>
    apiClient.get<AISuggestion[]>(`/vms/${vmId}/suggestions`).then((r) => r.data),

  /** POST /vms/:vmId/suggestions/:suggestionId/accept */
  acceptSuggestion: (vmId: string, suggestionId: string) =>
    apiClient.post<VM>(`/vms/${vmId}/suggestions/${suggestionId}/accept`).then((r) => r.data),

  /** POST /vms/:vmId/suggestions/:suggestionId/dismiss */
  dismissSuggestion: (vmId: string, suggestionId: string) =>
    apiClient.post<AISuggestion>(`/vms/${vmId}/suggestions/${suggestionId}/dismiss`).then((r) => r.data),

  /** POST /vms/:vmId/trigger-analyze — manually trigger AI analysis (once per 24h) */
  triggerAnalyze: (vmId: string) =>
    apiClient.post<TriggerAnalyzeResponse>(`/vms/${vmId}/trigger-analyze`).then((r) => r.data),
};
