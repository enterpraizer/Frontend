import { formatRelativeMsk } from '@/lib/utils';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Trash2, ArrowLeft, Cpu, HardDrive, MemoryStick, Link2, Unlink, Sparkles, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import VMStatusBadge from '@/components/ui/VMStatusBadge';
import ResourceGauge from '@/components/ui/ResourceGauge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import VMSuggestionCard from '@/components/features/vms/VMSuggestionCard';

import { useVM, useStartVM, useStopVM, useTerminateVM, useVMSuggestions, useAcceptSuggestion, useDismissSuggestion, useTriggerAnalyze } from '@/hooks/useVMs';
import { useNetworkList, useAttachVM, useDetachVM } from '@/hooks/useNetworks';
import { useQuota } from '@/hooks/useQuotas';
import type { VMStatus } from '@/types';

// ─── Detail row ──────────────────────────────────────────────────────────────

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-medium break-all">{value}</p>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const VMDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vm, isLoading } = useVM(id);
  const { data: networks } = useNetworkList({ limit: 100 });
  const { data: quota } = useQuota();

  const startVM    = useStartVM();
  const stopVM     = useStopVM();
  const terminateVM = useTerminateVM();
  const attachVM   = useAttachVM();
  const detachVM   = useDetachVM();

  const { data: suggestions } = useVMSuggestions(id);
  const acceptSuggestion  = useAcceptSuggestion(id);
  const dismissSuggestion = useDismissSuggestion(id);
  const triggerAnalyze    = useTriggerAnalyze(id);

  // Cooldown state: if last trigger returned remaining_sec > 0 store it locally
  const cooldownSec = (triggerAnalyze.data?.cooldown_remaining_sec ?? 0) > 0
    ? triggerAnalyze.data!.cooldown_remaining_sec
    : 0;

  const pendingSuggestions = suggestions?.filter((s) => s.status === 'pending') ?? [];

  const [confirmStop, setConfirmStop]           = useState(false);
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState('');

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!vm) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">VM не найдена.</p>
        <Button variant="outline" onClick={() => navigate('/vms')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад к VM
        </Button>
      </div>
    );
  }

  const handleTerminate = () => {
    terminateVM.mutate(vm.id, { onSuccess: () => navigate('/vms') });
  };

  const handleAttach = () => {
    if (!selectedNetworkId) return;
    attachVM.mutate({ networkId: selectedNetworkId, vmId: vm.id });
    setSelectedNetworkId('');
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── Back link ──────────────────────────────────────────────────── */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate('/vms')}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Виртуальные машины
        </Button>

        {/* ── TOP: name + status + actions ──────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{vm.name}</h1>
            <VMStatusBadge status={vm.status as VMStatus} />
          </div>

          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={vm.status !== 'stopped' || startVM.isPending}
                    onClick={() => startVM.mutate(vm.id)}
                  >
                    <Play className="mr-1.5 h-4 w-4" />
                    Запустить
                  </Button>
                </span>
              </TooltipTrigger>
              {vm.status !== 'stopped' && (
                <TooltipContent>Доступно только в остановленном состоянии</TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={vm.status !== 'running' || stopVM.isPending}
                    onClick={() => setConfirmStop(true)}
                  >
                    <Pause className="mr-1.5 h-4 w-4" />
                    Остановить
                  </Button>
                </span>
              </TooltipTrigger>
              {vm.status !== 'running' && (
                <TooltipContent>Доступно только в запущенном состоянии</TooltipContent>
              )}
            </Tooltip>

            <Button
              variant="destructive"
              size="sm"
              disabled={vm.status === 'terminated' || terminateVM.isPending}
              onClick={() => setConfirmTerminate(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Удалить
            </Button>
          </div>
        </div>

        {/* ── AI SUGGESTIONS ────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Pending suggestion cards */}
          {pendingSuggestions.map((s) => (
            <VMSuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={() => acceptSuggestion.mutate(s.id)}
              onDismiss={() => dismissSuggestion.mutate(s.id)}
              isAccepting={acceptSuggestion.isPending && acceptSuggestion.variables === s.id}
              isDismissing={dismissSuggestion.isPending && dismissSuggestion.variables === s.id}
            />
          ))}

          {/* Trigger-analyze button (hidden if VM is not running) */}
          {vm.status === 'running' && (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 px-4 py-3">
              <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-violet-900 dark:text-violet-200">
                  Запросить анализ ИИ
                </p>
                <p className="text-xs text-violet-600 dark:text-violet-400">
                  {cooldownSec > 0
                    ? `Доступно через ${Math.floor(cooldownSec / 3600)}ч ${Math.floor((cooldownSec % 3600) / 60)}мин.`
                    : 'ИИ проанализирует нагрузку и предложит оптимизацию (1 раз в сутки)'}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30"
                      disabled={triggerAnalyze.isPending || cooldownSec > 0}
                      onClick={() => triggerAnalyze.mutate()}
                    >
                      {triggerAnalyze.isPending
                        ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Анализируем…</>
                        : <><Sparkles className="mr-1.5 h-3.5 w-3.5" />Анализировать</>
                      }
                    </Button>
                  </span>
                </TooltipTrigger>
                {cooldownSec > 0 && (
                  <TooltipContent>
                    Анализ уже выполнялся сегодня. Следующий доступен через{' '}
                    {Math.floor(cooldownSec / 3600)}ч {Math.floor((cooldownSec % 3600) / 60)}мин.
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          )}
        </div>

        {/* ── DETAILS CARD ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Детали</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <DetailRow label="ID VM" value={<code className="text-xs">{vm.id}</code>} />
              <DetailRow label="ID арендатора" value={<code className="text-xs">{vm.tenant_id}</code>} />
              <DetailRow label="vCPU" value={`${vm.vcpu} ядр${vm.vcpu === 1 ? 'о' : vm.vcpu < 5 ? 'а' : ''}`} />
              <DetailRow label="RAM" value={`${Math.round(vm.ram_mb / 1024)} GB`} />
              <DetailRow label="Диск" value={`${vm.disk_gb} GB`} />
              <DetailRow label="IP адрес" value={vm.ip_address ?? <span className="text-muted-foreground">—</span>} />
              <DetailRow
                label="ID контейнера"
                value={
                  vm.container_id ? (
                    <code className="text-xs">{vm.container_id.slice(0, 20)}…</code>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <DetailRow
                label="Создана"
                value={formatRelativeMsk(vm.created_at)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── RESOURCE ALLOCATION ───────────────────────────────────────── */}
        {quota && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Выделенные ресурсы</CardTitle>
              <p className="text-xs text-muted-foreground">Доля этой VM от вашей квоты</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <ResourceGauge
                label="vCPU"
                used={vm.vcpu}
                max={quota.max_vcpu}
                unit=" cores"
                icon={<Cpu className="h-4 w-4" />}
              />
              <ResourceGauge
                label="RAM"
                used={Math.round(vm.ram_mb / 1024)}
                max={Math.round(quota.max_ram_mb / 1024)}
                unit=" GB"
                icon={<MemoryStick className="h-4 w-4" />}
              />
              <ResourceGauge
                label="Disk"
                used={vm.disk_gb}
                max={quota.max_disk_gb}
                unit=" GB"
                icon={<HardDrive className="h-4 w-4" />}
              />
            </CardContent>
          </Card>
        )}

        {/* ── NETWORKS CARD ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Сети</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Attached networks list */}
            {networks?.items && networks.items.length > 0 ? (
              <div className="divide-y rounded-md border">
                {networks.items.map((net) => (
                  <div
                    key={net.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{net.name}</p>
                        <Badge
                          variant="outline"
                          className="mt-0.5 font-mono text-xs"
                        >
                          {net.cidr}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={detachVM.isPending}
                      onClick={() => detachVM.mutate({ networkId: net.id, vmId: vm.id })}
                    >
                      <Unlink className="mr-1.5 h-3.5 w-3.5" />
                      Отключить
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">Нет подключённых сетей.</span>
            )}

            {/* Attach dropdown */}
            <div className="flex gap-2">
              <Select value={selectedNetworkId} onValueChange={setSelectedNetworkId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Выберите сеть для подключения…" />
                </SelectTrigger>
                <SelectContent>
                  {networks?.items?.map((net) => (
                    <SelectItem key={net.id} value={net.id}>
                      {net.name} — {net.cidr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!selectedNetworkId || attachVM.isPending}
                onClick={handleAttach}
              >
                <Link2 className="mr-1.5 h-4 w-4" />
                Подключить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Confirm dialogs ───────────────────────────────────────────── */}
        <ConfirmDialog
          open={confirmStop}
          title={`Остановить "${vm.name}"?`}
          description="VM будет корректно завершена. Вы сможете запустить её снова."
          confirmLabel="Остановить"
          isLoading={stopVM.isPending}
          onConfirm={() => { stopVM.mutate(vm.id); setConfirmStop(false); }}
          onCancel={() => setConfirmStop(false)}
        />
        <ConfirmDialog
          open={confirmTerminate}
          title={`Удалить "${vm.name}"?`}
          description="Это действие необратимо. VM и все её данные будут уничтожены."
          confirmLabel="Удалить"
          variant="danger"
          isLoading={terminateVM.isPending}
          onConfirm={handleTerminate}
          onCancel={() => setConfirmTerminate(false)}
        />
      </div>
    </TooltipProvider>
  );
};

export default VMDetailPage;
