import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8000';

// ─── Mock data ────────────────────────────────────────────────────────────────

export const mockTokens = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
};

export const mockUser = {
  id: 'user-1',
  email: 'alice@example.com',
  username: 'alice',
  role: 'user' as const,
  tenant_id: 'tenant-1',
  is_active: true,
  first_name: 'Alice',
  last_name: 'Smith',
  avatar_url: undefined,
};

export const mockVMs = {
  items: [
    {
      id: 'vm-1',
      tenant_id: 'tenant-1',
      name: 'my-first-vm',
      status: 'running' as const,
      vcpu: 2,
      ram_mb: 2048,
      disk_gb: 50,
      ip_address: '10.0.0.1',
      container_id: 'abc123def456',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
  total: 1,
};

export const mockResourceUsage = {
  vcpu:    { used: 4,    max: 8,    pct: 50 },
  ram_mb:  { used: 8192, max: 16384, pct: 50 },
  disk_gb: { used: 100,  max: 200,  pct: 50 },
  vms:     { used: 2,    max: 4,    pct: 50 },
};

export const mockResourceUsageExceeded = {
  vcpu:    { used: 8,    max: 8,    pct: 100 },
  ram_mb:  { used: 8192, max: 16384, pct: 50 },
  disk_gb: { used: 100,  max: 200,  pct: 50 },
  vms:     { used: 2,    max: 4,    pct: 50 },
};

export const mockVMSummary = { total: 5, running: 3, stopped: 2, pending: 0 };

export const mockAdminStats = {
  total_tenants: 10,
  active_tenants: 8,
  total_vms: 42,
  running_vms: 20,
  total_vcpu_allocated: 80,
  total_ram_mb_allocated: 163840,
  top_tenants_by_vms: [
    { tenant_name: 'Alpha Corp', vm_count: 8 },
    { tenant_name: 'Beta Inc',   vm_count: 6 },
  ],
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

let vmCreateCallCount = 0;

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/token`, () =>
    HttpResponse.json(mockTokens)
  ),

  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json(mockUser)
  ),

  http.post(`${BASE}/auth/register`, () =>
    HttpResponse.json({ message: 'Registration successful' }, { status: 201 })
  ),

  // VMs
  http.get(`${BASE}/vms`, () =>
    HttpResponse.json(mockVMs)
  ),

  http.post(`${BASE}/vms`, () => {
    vmCreateCallCount += 1;
    if (vmCreateCallCount % 2 === 0) {
      // Even calls return 429 quota exceeded
      return HttpResponse.json(
        { detail: 'Quota exceeded', resource: 'vms', requested: 1, available: 0 },
        { status: 429 }
      );
    }
    return HttpResponse.json({
      id: 'vm-new',
      tenant_id: 'tenant-1',
      name: 'new-vm',
      status: 'pending',
      vcpu: 2,
      ram_mb: 2048,
      disk_gb: 50,
      ip_address: null,
      container_id: null,
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Dashboard
  http.get(`${BASE}/dashboard/usage`, () =>
    HttpResponse.json(mockResourceUsage)
  ),

  http.get(`${BASE}/dashboard/vms-summary`, () =>
    HttpResponse.json(mockVMSummary)
  ),

  http.get(`${BASE}/dashboard/activity`, () =>
    HttpResponse.json([])
  ),

  // Admin
  http.get(`${BASE}/admin/stats`, () =>
    HttpResponse.json(mockAdminStats)
  ),
];
