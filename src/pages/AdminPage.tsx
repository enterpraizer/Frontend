import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Play,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';
import VMStatusBadge from '@/components/ui/VMStatusBadge';

import { useAdminStats, useAdminVMs, useTenantList } from '@/hooks/useAdmin';
import type { VMStatus } from '@/types';

// ─── Colour maps ─────────────────────────────────────────────────────────────

const VM_STATUS_COLORS: Record<string, string> = {
  running: '#22c55e',
  stopped: '#94a3b8',
  pending: '#eab308',
  terminated: '#ef4444',
};

const BAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6',
];

// ─── Skeleton placeholders ────────────────────────────────────────────────────

const ChartSkeleton = () => (
  <Skeleton className="h-[260px] w-full rounded-xl" />
);

const StatSkeleton = () => (
  <Card>
    <CardContent className="p-6 flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-12 w-12 rounded-full" />
    </CardContent>
  </Card>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtBytes(mb: number): string {
  if (mb >= 1_048_576) return `${(mb / 1_048_576).toFixed(1)} TB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
  return `${mb} MB`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminPage = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: vmsData, isLoading: vmsLoading } = useAdminVMs({ limit: 10 });
  const { data: tenantsData } = useTenantList({ limit: 20 });

  // VM status distribution for pie chart
  const vmStatusData = useMemo(() => {
    if (!vmsData?.items) return [];
    const counts: Record<string, number> = {
      running: 0, stopped: 0, pending: 0, terminated: 0,
    };
    vmsData.items.forEach((vm) => {
      if (vm.status in counts) counts[vm.status]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [vmsData]);

  // vCPU per tenant for stacked bar (from tenants list, placeholder vcpu)
  const tenantVcpuData = useMemo(() => {
    if (!tenantsData?.items) return [];
    // We only have tenant names — show as placeholder bars
    return tenantsData.items.slice(0, 8).map((t) => ({
      name: t.name.length > 12 ? t.name.slice(0, 12) + '…' : t.name,
      tenant_id: t.id,
    }));
  }, [tenantsData]);

  const topTenants = stats?.top_tenants_by_vms?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform-wide overview across all tenants.
        </p>
      </div>

      {/* ── SECTION 1: Global StatCards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 7 }).map((_, i) => <StatSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard
              title="Total Tenants"
              value={stats.total_tenants}
              icon={<Building2 className="h-5 w-5" />}
              color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
            />
            <StatCard
              title="Active Tenants"
              value={stats.active_tenants}
              icon={<Users className="h-5 w-5" />}
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatCard
              title="Total VMs"
              value={stats.total_vms}
              icon={<Server className="h-5 w-5" />}
              color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            />
            <StatCard
              title="Running VMs"
              value={stats.running_vms}
              icon={<Play className="h-5 w-5" />}
              color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatCard
              title="vCPU Allocated"
              value={`${stats.total_vcpu_allocated} cores`}
              icon={<Cpu className="h-5 w-5" />}
              color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            />
            <StatCard
              title="RAM Allocated"
              value={fmtBytes(stats.total_ram_mb_allocated)}
              icon={<MemoryStick className="h-5 w-5" />}
              color="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
            />
            <StatCard
              title="Inactive Tenants"
              value={stats.total_tenants - stats.active_tenants}
              icon={<HardDrive className="h-5 w-5" />}
              color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            />
          </>
        ) : null}
      </div>

      {/* ── SECTION 2: Charts ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart A: Top 5 Tenants by VM Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 5 Tenants by VM Count</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <ChartSkeleton />
            ) : topTenants.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topTenants} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="tenant_name"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.length > 10 ? v.slice(0, 10) + '…' : v}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="vm_count" radius={[4, 4, 0, 0]}>
                    {topTenants.map((_, idx) => (
                      <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart B: VM Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">VM Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {vmsLoading ? (
              <ChartSkeleton />
            ) : vmStatusData.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No VMs found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={vmStatusData}
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {vmStatusData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={VM_STATUS_COLORS[entry.name] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart C: Tenant List (stacked placeholder — vcpu not in tenant model) */}
        {tenantVcpuData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tenants Overview</CardTitle>
              <p className="text-xs text-muted-foreground">
                Active tenants registered on the platform
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={tenantVcpuData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={() => ['Tenant', '']}
                  />
                  <Bar dataKey={() => 1} radius={[4, 4, 0, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── SECTION 3: Recent VMs Table ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Recent VMs (last 10)
          </h2>
          <Button variant="link" size="sm" onClick={() => navigate('/admin/vms')}>
            View all →
          </Button>
        </div>
        <Card>
          {vmsLoading ? (
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <Skeleton key={j} className="h-4 flex-1" />
                  ))}
                </div>
              ))}
            </CardContent>
          ) : !vmsData?.items?.length ? (
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No VMs found.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VM Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>vCPU</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vmsData.items.map((vm) => (
                  <TableRow key={vm.id}>
                    <TableCell className="font-medium">{vm.name}</TableCell>
                    <TableCell>
                      <VMStatusBadge status={vm.status as VMStatus} />
                    </TableCell>
                    <TableCell>{vm.vcpu}</TableCell>
                    <TableCell>{Math.round(vm.ram_mb / 1024)} GB</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(vm.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
