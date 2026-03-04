export const APP_NAME = 'Cloud Console';

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export const VM_STATUSES = ['running', 'stopped', 'error', 'pending'] as const;
export type VMStatus = (typeof VM_STATUSES)[number];

export const QUERY_KEYS = {
  vms: ['vms'] as const,
  vm: (id: string) => ['vms', id] as const,
  networks: ['networks'] as const,
  network: (id: string) => ['networks', id] as const,
  quotas: ['quotas'] as const,
  tenants: ['tenants'] as const,
  tenant: (id: string) => ['tenants', id] as const,
  auditLogs: ['audit-logs'] as const,
} as const;
