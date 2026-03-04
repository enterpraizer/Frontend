// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListParams = Record<string, any> | undefined;

export const queryKeys = {
  vms: {
    all: ['vms'] as const,
    list: (params?: ListParams) => ['vms', 'list', params] as const,
    detail: (id: string) => ['vms', id] as const,
  },

  networks: {
    all: ['networks'] as const,
    list: (params?: ListParams) => ['networks', 'list', params] as const,
    detail: (id: string) => ['networks', id] as const,
  },

  dashboard: {
    usage: ['dashboard', 'usage'] as const,
    vmSummary: ['dashboard', 'vms-summary'] as const,
    activity: ['dashboard', 'activity'] as const,
  },

  admin: {
    stats: ['admin', 'stats'] as const,
    tenants: (params?: ListParams) => ['admin', 'tenants', params] as const,
    tenantDetail: (id: string) => ['admin', 'tenants', id] as const,
    tenantQuota: (id: string) => ['admin', 'tenants', id, 'quota'] as const,
    allVMs: (params?: ListParams) => ['admin', 'vms', params] as const,
    users: (params?: ListParams) => ['admin', 'users', params] as const,
  },
} as const;
