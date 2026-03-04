import { useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Play,
  Pause,
  Trash2,
  Plus,
  Search,
  Server,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import VMStatusBadge from '@/components/ui/VMStatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import CreateVMModal from '@/components/features/vms/CreateVMModal';

import { useVMList, useStartVM, useStopVM, useTerminateVM } from '@/hooks/useVMs';
import { useResourceUsage } from '@/hooks/useDashboard';
import { useQuota } from '@/hooks/useQuotas';
import type { VM, VMStatus } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Running', value: 'running' },
  { label: 'Stopped', value: 'stopped' },
  { label: 'Pending', value: 'pending' },
  { label: 'Terminated', value: 'terminated' },
];

// ─── Row skeleton ────────────────────────────────────────────────────────────

const RowSkeleton = () => (
  <TableRow>
    {Array.from({ length: 8 }).map((_, i) => (
      <TableCell key={i}>
        <Skeleton className="h-4 w-full" />
      </TableCell>
    ))}
  </TableRow>
);

// ─── Confirm state type ───────────────────────────────────────────────────────

type ConfirmAction = { type: 'stop' | 'terminate'; vm: VM } | null;

// ─── Component ───────────────────────────────────────────────────────────────

const VMListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchRaw, setSearchRaw] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createOpen, setCreateOpen] = useState(() => searchParams.get('create') === 'true');
  const [confirm, setConfirm] = useState<ConfirmAction>(null);

  const handleSearch = (val: string) => {
    setSearchRaw(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setDebouncedSearch(val); setPage(0); }, 300);
  };

  // Data
  const { data: vmData, isLoading } = useVMList({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const { data: usage } = useResourceUsage();
  const { data: quota } = useQuota();

  const startVM = useStartVM();
  const stopVM = useStopVM();
  const terminateVM = useTerminateVM();

  // Client-side name filter (API may not support it)
  const vms = useMemo(() => {
    if (!vmData?.items) return [];
    if (!debouncedSearch) return vmData.items;
    const q = debouncedSearch.toLowerCase();
    return vmData.items.filter((vm) => vm.name.toLowerCase().includes(q));
  }, [vmData, debouncedSearch]);

  const totalPages = Math.ceil((vmData?.total ?? 0) / PAGE_SIZE);
  const vmsQuotaExceeded = usage ? usage.vms.pct >= 100 : false;

  // Clear ?create=true param once modal is shown
  const openCreate = () => {
    setCreateOpen(true);
    setSearchParams({});
  };

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Virtual Machines</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={openCreate}
                  disabled={vmsQuotaExceeded}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create VM
                </Button>
              </span>
            </TooltipTrigger>
            {vmsQuotaExceeded && (
              <TooltipContent>VM quota exceeded. Contact support to upgrade.</TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name…"
              value={searchRaw}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(0); }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        {!isLoading && vms.length === 0 ? (
          <EmptyState
            icon={<Server className="h-12 w-12" />}
            title="No virtual machines yet"
            description="Create your first VM to get started."
            action={
              <Button onClick={openCreate} disabled={vmsQuotaExceeded}>
                <Plus className="mr-2 h-4 w-4" />
                Create VM
              </Button>
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>vCPU</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>Disk</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => <RowSkeleton key={i} />)
                  : vms.map((vm) => (
                      <TableRow key={vm.id}>
                        <TableCell>
                          <button
                            className="font-medium text-blue-600 hover:underline"
                            onClick={() => navigate(`/vms/${vm.id}`)}
                          >
                            {vm.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          <VMStatusBadge status={vm.status as VMStatus} />
                        </TableCell>
                        <TableCell>{vm.vcpu}</TableCell>
                        <TableCell>{Math.round(vm.ram_mb / 1024)} GB</TableCell>
                        <TableCell>{vm.disk_gb} GB</TableCell>
                        <TableCell className="text-muted-foreground">
                          {vm.ip_address ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(vm.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {/* Start */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={vm.status !== 'stopped' || startVM.isPending}
                                    onClick={() => startVM.mutate(vm.id)}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Start</TooltipContent>
                            </Tooltip>
                            {/* Stop */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={vm.status !== 'running' || stopVM.isPending}
                                    onClick={() => setConfirm({ type: 'stop', vm })}
                                  >
                                    <Pause className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Stop</TooltipContent>
                            </Tooltip>
                            {/* Terminate */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    disabled={vm.status === 'terminated' || terminateVM.isPending}
                                    onClick={() => setConfirm({ type: 'terminate', vm })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Terminate</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, vmData?.total ?? 0)}{' '}
              of {vmData?.total ?? 0}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* ── Create VM modal ─────────────────────────────────────────────── */}
        {createOpen && usage && quota && (
          <CreateVMModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            currentUsage={usage}
            quota={quota}
          />
        )}

        {/* ── Confirm dialogs ──────────────────────────────────────────────── */}
        <ConfirmDialog
          open={confirm?.type === 'stop'}
          title={`Stop "${confirm?.vm.name}"?`}
          description="The VM will be gracefully shut down. You can restart it later."
          confirmLabel="Stop VM"
          isLoading={stopVM.isPending}
          onConfirm={() => { if (confirm) { stopVM.mutate(confirm.vm.id); setConfirm(null); } }}
          onCancel={() => setConfirm(null)}
        />
        <ConfirmDialog
          open={confirm?.type === 'terminate'}
          title={`Terminate "${confirm?.vm.name}"?`}
          description="This action is irreversible. All data on the VM will be destroyed."
          confirmLabel="Terminate"
          isLoading={terminateVM.isPending}
          variant="danger"
          onConfirm={() => { if (confirm) { terminateVM.mutate(confirm.vm.id); setConfirm(null); } }}
          onCancel={() => setConfirm(null)}
        />
      </div>
    </TooltipProvider>
  );
};

export default VMListPage;

