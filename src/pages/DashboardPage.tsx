import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import {
  Bot,
  CheckCircle2,
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import ResourceGauge from '@/components/ui/ResourceGauge';
import StatCard from '@/components/ui/StatCard';

import { useResourceUsage, useVMSummary, useActivityLog } from '@/hooks/useDashboard';
import { useVMList } from '@/hooks/useVMs';
import { vmsApi } from '@/api/vms';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/store/authStore';
import type { VM, VmSuggestion } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' })).getHours();
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function formatDate(): string {
  return new Date().toLocaleDateString('ru-RU', {
    timeZone: 'Europe/Moscow',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
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

// ─── AI Suggestion badge row (one per VM) ────────────────────────────────────

function pluralRu(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

const VMAISuggestionRow = ({ vm }: { vm: VM }) => {
  const navigate = useNavigate();
  const { data: suggestions } = useQueries({
    queries: [{ queryKey: queryKeys.vms.suggestions(vm.id), queryFn: () => vmsApi.listSuggestions(vm.id), staleTime: 5 * 60 * 1000 }],
  })[0] ?? {};
  const count = (suggestions as VmSuggestion[] | undefined)?.filter((s) => s.status === 'pending').length ?? 0;
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(`/vms/${vm.id}`)}
      className="flex w-full items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-left transition-colors hover:bg-amber-100 dark:hover:bg-amber-950/30"
    >
      <div className="flex items-center gap-2.5">
        <Bot className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium">{vm.name}</span>
      </div>
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100">
        {pluralRu(count, 'рекомендация ИИ', 'рекомендации ИИ', 'рекомендаций ИИ')}
      </Badge>
    </button>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: usage, isLoading: usageLoading } = useResourceUsage();
  const { data: summary, isLoading: summaryLoading } = useVMSummary();
  const { data: activity, isLoading: activityLoading } = useActivityLog();
  const { data: vmList } = useVMList({ limit: 100 });

  // Aggregate pending suggestions for all VMs in parallel (uses cache from VMAISuggestionRow)
  const vmIds = vmList?.items.map((v) => v.id) ?? [];
  const suggestionResults = useQueries({
    queries: vmIds.map((vmId) => ({
      queryKey: queryKeys.vms.suggestions(vmId),
      queryFn: () => vmsApi.listSuggestions(vmId),
      staleTime: 5 * 60 * 1000,
      enabled: vmIds.length > 0,
    })),
  });
  const suggestionsLoading = suggestionResults.some((r) => r.isLoading);
  const totalPendingSuggestions = suggestionResults.reduce(
    (sum, r) =>
      sum + ((r.data as VmSuggestion[] | undefined)?.filter((s) => s.status === 'pending').length ?? 0),
    0
  );

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
          <AlertTitle>Квота исчерпана</AlertTitle>
          <AlertDescription>
            Вы достигли лимита <strong>{label}</strong>. Обратитесь в поддержку для увеличения.
          </AlertDescription>
        </Alert>
      ))}

      {/* ── SECTION 1 — Welcome header ─────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}, {user?.username ?? 'there'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {formatDate()} &nbsp;·&nbsp; Рабочее пространство:{' '}
          <span className="font-medium text-foreground">{tenantSlug}</span>
        </p>
      </div>

      {/* ── SECTION 2 — Resource Usage ─────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Использование ресурсов
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
          Виртуальные машины
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
                title="Всего VM"
                value={summary.total}
                icon={<Server className="h-5 w-5" />}
                color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <StatCard
                title="Запущено"
                value={summary.running}
                icon={<Play className="h-5 w-5" />}
                color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
              <StatCard
                title="Остановлено"
                value={summary.stopped}
                icon={<Pause className="h-5 w-5" />}
                color="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              />
            </>
          )}
        </div>
      </section>

      {/* ── SECTION 4 — AI Suggestions ────────────────────────────────── */}
      {vmList && vmList.items.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Bot className="h-4 w-4" />
            Рекомендации ИИ
          </h2>
          {suggestionsLoading ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 animate-pulse">
              Загружаем рекомендации…
            </div>
          ) : totalPendingSuggestions === 0 ? (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Нет активных рекомендаций — все VM работают оптимально.
            </div>
          ) : (
            <div className="space-y-2">
              {vmList.items.map((vm) => (
                <VMAISuggestionRow key={vm.id} vm={vm} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── SECTION 5 — Recent Activity ────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            Последние действия
          </h2>
          <button
            onClick={() => navigate('/admin/audit')}
            className="text-xs text-blue-500 hover:underline"
          >
            Показать все →
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
              Нет последних действий.
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-2 pt-4 px-6">
                <div className="grid grid-cols-[1fr_1fr_1fr_2fr] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Время</span>
                  <span>Действие</span>
                  <span>Ресурс</span>
                  <span>Детали</span>
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
                      <span className="text-muted-foreground">{entry.resource_type}</span>
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
        aria-label="Создать VM"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default DashboardPage;

