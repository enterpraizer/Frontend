import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  HardDrive,
  Server,
  Play,
  Pause,
  Plus,
  AlertTriangle,
  Activity,
  MemoryStick,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import ResourceGauge from '@/components/ui/ResourceGauge';
import StatCard from '@/components/ui/StatCard';

import { useResourceUsage, useVMSummary, useActivityLog } from '@/hooks/useDashboard';
import { useAuthStore } from '@/store/authStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Skeleton helpers ────────────────────────────────────────────────────────

const GaugeSkeleton = () => (
  <Card>
    <CardContent className="p-6 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-10" />
    </CardContent>
  </Card>
);

const StatSkeleton = () => (
  <Card>
    <CardContent className="p-6 flex justify-between items-start">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-12 w-12 rounded-full" />
    </CardContent>
  </Card>
);

// ─── Main component ───────────────────────────────────────────────────────────

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: usage, isLoading: usageLoading } = useResourceUsage();
  const { data: summary, isLoading: summaryLoading } = useVMSummary();
  const { data: activity, isLoading: activityLoading } = useActivityLog();

  // Detect any resource at 100 %
  const exceededResources = useMemo(() => {
    if (!usage) return [];
    return (
      [
        { key: 'vcpu', label: 'vCPU', metric: usage.vcpu },
        { key: 'ram', label: 'RAM', metric: usage.ram_mb },
        { key: 'disk', label: 'Disk', metric: usage.disk_gb },
        { key: 'vms', label: 'VMs', metric: usage.vms },
      ] as const
    ).filter(({ metric }) => metric.pct >= 100);
  }, [usage]);

  const tenantSlug = user?.tenant_id ?? '—';

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* ── Quota exceeded banners ─────────────────────────────────────── */}
      {exceededResources.map(({ key, label }) => (
        <Alert variant="destructive" key={key}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Quota Exceeded</AlertTitle>
          <AlertDescription>
            You have reached your <strong>{label}</strong> quota. Contact support to upgrade.
          </AlertDescription>
        </Alert>
      ))}

      {/* ── SECTION 1 — Welcome header ─────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, {user?.username ?? 'there'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {formatDate()} &nbsp;·&nbsp; Workspace:{' '}
          <span className="font-medium text-foreground">{tenantSlug}</span>
        </p>
      </div>

      {/* ── SECTION 2 — Resource Usage ─────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Resource Usage
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {usageLoading || !usage ? (
            <>
              <GaugeSkeleton />
              <GaugeSkeleton />
              <GaugeSkeleton />
              <GaugeSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <ResourceGauge
                    label="vCPU"
                    used={usage.vcpu.used}
                    max={usage.vcpu.max}
                    unit=" cores"
                    icon={<Cpu className="h-4 w-4" />}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <ResourceGauge
                    label="RAM"
                    used={Math.round(usage.ram_mb.used / 1024)}
                    max={Math.round(usage.ram_mb.max / 1024)}
                    unit=" GB"
                    icon={<MemoryStick className="h-4 w-4" />}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <ResourceGauge
                    label="Disk"
                    used={usage.disk_gb.used}
                    max={usage.disk_gb.max}
                    unit=" GB"
                    icon={<HardDrive className="h-4 w-4" />}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <ResourceGauge
                    label="VMs"
                    used={usage.vms.used}
                    max={usage.vms.max}
                    unit=""
                    icon={<Server className="h-4 w-4" />}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* ── SECTION 3 — VM Status Summary ─────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Virtual Machines
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summaryLoading || !summary ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total VMs"
                value={summary.total}
                icon={<Server className="h-5 w-5" />}
                color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard
                title="Running"
                value={summary.running}
                icon={<Play className="h-5 w-5" />}
                color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
              <StatCard
                title="Stopped"
                value={summary.stopped}
                icon={<Pause className="h-5 w-5" />}
                color="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              />
            </>
          )}
        </div>
      </section>

      {/* ── SECTION 4 — Recent Activity ────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            Recent Activity
          </h2>
          <button
            onClick={() => navigate('/admin/audit')}
            className="text-xs text-blue-500 hover:underline"
          >
            View all →
          </button>
        </div>

        <Card>
          {activityLoading ? (
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          ) : !activity || activity.length === 0 ? (
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No recent activity.
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-2 pt-4 px-6">
                <div className="grid grid-cols-[1fr_1fr_1fr_2fr] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Time</span>
                  <span>Action</span>
                  <span>Resource</span>
                  <span>Details</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-4">
                <div className="divide-y">
                  {activity.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[1fr_1fr_1fr_2fr] py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground text-xs">
                        {formatTime(entry.created_at)}
                      </span>
                      <span className="font-medium">{entry.action}</span>
                      <span className="text-muted-foreground">{entry.resource}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {entry.resource_id}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </section>

      {/* ── Floating action button (mobile only) ───────────────────────── */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        onClick={() => navigate('/vms?create=true')}
        aria-label="Create VM"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default DashboardPage;

