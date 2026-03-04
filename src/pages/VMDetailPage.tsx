import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Play, Pause, Trash2, ArrowLeft, Cpu, HardDrive, MemoryStick, Link2, Unlink } from 'lucide-react';

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

import { useVM, useStartVM, useStopVM, useTerminateVM } from '@/hooks/useVMs';
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
        <p className="text-muted-foreground">VM not found.</p>
        <Button variant="outline" onClick={() => navigate('/vms')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to VMs
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
          Virtual Machines
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
                    Start
                  </Button>
                </span>
              </TooltipTrigger>
              {vm.status !== 'stopped' && (
                <TooltipContent>Only available when stopped</TooltipContent>
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
                    Stop
                  </Button>
                </span>
              </TooltipTrigger>
              {vm.status !== 'running' && (
                <TooltipContent>Only available when running</TooltipContent>
              )}
            </Tooltip>

            <Button
              variant="destructive"
              size="sm"
              disabled={vm.status === 'terminated' || terminateVM.isPending}
              onClick={() => setConfirmTerminate(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Terminate
            </Button>
          </div>
        </div>

        {/* ── DETAILS CARD ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <DetailRow label="VM ID" value={<code className="text-xs">{vm.id}</code>} />
              <DetailRow label="Tenant ID" value={<code className="text-xs">{vm.tenant_id}</code>} />
              <DetailRow label="vCPU" value={`${vm.vcpu} core${vm.vcpu !== 1 ? 's' : ''}`} />
              <DetailRow label="RAM" value={`${Math.round(vm.ram_mb / 1024)} GB`} />
              <DetailRow label="Disk" value={`${vm.disk_gb} GB`} />
              <DetailRow label="IP Address" value={vm.ip_address ?? <span className="text-muted-foreground">—</span>} />
              <DetailRow
                label="Container ID"
                value={
                  vm.container_id ? (
                    <code className="text-xs">{vm.container_id.slice(0, 20)}…</code>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <DetailRow
                label="Created"
                value={formatDistanceToNow(new Date(vm.created_at), { addSuffix: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── RESOURCE ALLOCATION ───────────────────────────────────────── */}
        {quota && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resource Allocation</CardTitle>
              <p className="text-xs text-muted-foreground">This VM's share of your quota</p>
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
            <CardTitle className="text-base">Networks</CardTitle>
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
                      Detach
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No networks attached.</p>
            )}

            {/* Attach dropdown */}
            <div className="flex gap-2">
              <Select value={selectedNetworkId} onValueChange={setSelectedNetworkId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a network to attach…" />
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
                Attach
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Confirm dialogs ───────────────────────────────────────────── */}
        <ConfirmDialog
          open={confirmStop}
          title={`Stop "${vm.name}"?`}
          description="The VM will be gracefully shut down. You can restart it later."
          confirmLabel="Stop VM"
          isLoading={stopVM.isPending}
          onConfirm={() => { stopVM.mutate(vm.id); setConfirmStop(false); }}
          onCancel={() => setConfirmStop(false)}
        />
        <ConfirmDialog
          open={confirmTerminate}
          title={`Terminate "${vm.name}"?`}
          description="This will permanently destroy the VM and all its data. This action cannot be undone."
          confirmLabel="Terminate"
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
