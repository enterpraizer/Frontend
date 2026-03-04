import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, Pause, Trash2, Server } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
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

import { useAdminVMs, useTenantList } from '@/hooks/useAdmin';
import { useStopVM, useTerminateVM } from '@/hooks/useVMs';
import type { VM, VMStatus } from '@/types';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = ['all', 'running', 'stopped', 'pending', 'terminated'];

// Deterministic colour per tenant name
const TENANT_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];
function tenantColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TENANT_COLORS[h % TENANT_COLORS.length];
}

type ConfirmAction = { type: 'stop' | 'terminate'; vm: VM } | null;

const RowSkeleton = () => (
  <TableRow>
    {Array.from({ length: 9 }).map((_, i) => (
      <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
    ))}
  </TableRow>
);

const AdminVMsPage = () => {
  const navigate = useNavigate();
  const [page, setPage]           = useState(0);
  const [tenantFilter, setTenantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]       = useState('');
  const [confirm, setConfirm]     = useState<ConfirmAction>(null);

  const { data, isLoading } = useAdminVMs({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    tenant_id: tenantFilter === 'all' ? undefined : tenantFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const { data: tenantsData } = useTenantList({ limit: 100 });

  const stopVM      = useStopVM();
  const terminateVM = useTerminateVM();

  // Build tenant name map
  const tenantMap = useMemo(() => {
    const m: Record<string, string> = {};
    tenantsData?.items?.forEach((t) => { m[t.id] = t.name; });
    return m;
  }, [tenantsData]);

  // Client-side name search
  const vms = useMemo(() => {
    if (!data?.items) return [];
    if (!search) return data.items;
    const q = search.toLowerCase();
    return data.items.filter((vm) => vm.name.toLowerCase().includes(q));
  }, [data, search]);

  const total         = data?.total ?? 0;
  const totalPages    = Math.ceil(total / PAGE_SIZE);
  const tenantCount   = tenantsData?.total ?? 0;
  const runningCount  = vms.filter((v) => v.status === 'running').length;

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Virtual Machines</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing <strong>{total}</strong> VMs across{' '}
              <strong>{tenantCount}</strong> tenants —{' '}
              <span className="text-green-600 font-medium">{runningCount} running</span>
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by VM name…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <Select value={tenantFilter} onValueChange={(v) => { setTenantFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {tenantsData?.items?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {!isLoading && vms.length === 0 ? (
          <EmptyState
            icon={<Server className="h-12 w-12" />}
            title="No VMs found"
            description="Try adjusting your filters."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>VM Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>vCPU</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>Disk</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Container ID</TableHead>
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
                        <Badge className={`text-xs font-medium ${tenantColor(vm.tenant_id)}`}>
                          {tenantMap[vm.tenant_id] ?? vm.tenant_id.slice(0, 8) + '…'}
                        </Badge>
                      </TableCell>
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
                      <TableCell>
                        {vm.container_id ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded cursor-default">
                                {vm.container_id.slice(0, 12)}
                              </code>
                            </TooltipTrigger>
                            <TooltipContent className="font-mono text-xs">
                              {vm.container_id}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(vm.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="icon" variant="ghost"
                                  disabled={vm.status !== 'running' || stopVM.isPending}
                                  onClick={() => setConfirm({ type: 'stop', vm })}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Force Stop</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="icon" variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  disabled={vm.status === 'terminated' || terminateVM.isPending}
                                  onClick={() => setConfirm({ type: 'terminate', vm })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Force Terminate</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Confirm dialogs */}
        <ConfirmDialog
          open={confirm?.type === 'stop'}
          title={`Force Stop "${confirm?.vm.name}"?`}
          description="This will immediately halt the VM. The tenant will be notified."
          confirmLabel="Force Stop"
          isLoading={stopVM.isPending}
          onConfirm={() => { if (confirm) { stopVM.mutate(confirm.vm.id); setConfirm(null); } }}
          onCancel={() => setConfirm(null)}
        />
        <ConfirmDialog
          open={confirm?.type === 'terminate'}
          title={`Force Terminate "${confirm?.vm.name}"?`}
          description="This will permanently destroy the VM and all its data. This cannot be undone."
          confirmLabel="Force Terminate"
          variant="danger"
          isLoading={terminateVM.isPending}
          onConfirm={() => { if (confirm) { terminateVM.mutate(confirm.vm.id); setConfirm(null); } }}
          onCancel={() => setConfirm(null)}
        />
      </div>
    </TooltipProvider>
  );
};

export default AdminVMsPage;
