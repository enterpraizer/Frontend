// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  tenant_id: string | null;
  is_active: boolean;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ─── Tenant ──────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
}

// ─── VM ──────────────────────────────────────────────────────────────────────

export type VMStatus = 'pending' | 'running' | 'stopped' | 'terminated';

export interface VM {
  id: string;
  tenant_id: string;
  name: string;
  status: VMStatus;
  vcpu: number;
  ram_mb: number;
  disk_gb: number;
  ip_address: string | null;
  container_id: string | null;
  created_at: string;
}

export interface VMCreate {
  name: string;
  vcpu: number;
  ram_mb: number;
  disk_gb: number;
}

// ─── Network ─────────────────────────────────────────────────────────────────

export interface Network {
  id: string;
  tenant_id: string;
  name: string;
  cidr: string;
  status: string;
  is_public: boolean;
  created_at: string;
}

// ─── Dashboard / Usage ───────────────────────────────────────────────────────

export interface UsageMetric {
  used: number;
  max: number;
  pct: number;
}

export interface ResourceUsage {
  vcpu: UsageMetric;
  ram_mb: UsageMetric;
  disk_gb: UsageMetric;
  vms: UsageMetric;
}

// ─── Quota ───────────────────────────────────────────────────────────────────

export interface Quota {
  max_vcpu: number;
  max_ram_mb: number;
  max_disk_gb: number;
  max_vms: number;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_tenants: number;
  active_tenants: number;
  total_vms: number;
  running_vms: number;
  total_vcpu_allocated: number;
  total_ram_mb_allocated: number;
  top_tenants_by_vms: Array<{ tenant_name: string; vm_count: number }>;
}

// ─── Generic ─────────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface ApiError {
  detail: string;
  resource?: string;
  requested?: number;
  available?: number;
}
