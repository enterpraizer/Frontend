import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Building2, Settings2, Power, PowerOff } from 'lucide-react';
import { Cpu, HardDrive, Server, MemoryStick } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ResourceGauge from '@/components/ui/ResourceGauge';
import VMStatusBadge from '@/components/ui/VMStatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import QuotaEditorModal from '@/components/features/admin/QuotaEditorModal';

import {
  useTenantDetail,
  useTenantQuota,
  useTenantUsage,
  useAdminVMs,
  useToggleTenantActive,
} from '@/hooks/useAdmin';
import type { VMStatus } from '@/types';

// ─── Detail row ──────────────────────────────────────────────────────────────

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="text-sm font-medium">{value}</div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminTenantDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: tenant, isLoading: tenantLoading } = useTenantDetail(id);
  const { data: quota, isLoading: quotaLoading } = useTenantQuota(id);
  const { data: usage } = useTenantUsage(id);
  const { data: vmsData, isLoading: vmsLoading } = useAdminVMs({ limit: 10 });

  const toggleActive = useToggleTenantActive();

  const [quotaOpen, setQuotaOpen] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState(false);

  // Filter VMs for this tenant (admin VMs endpoint may not filter by tenant)
  const tenantVMs = vmsData?.items?.filter((vm) => vm.tenant_id === id) ?? [];

  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">Tenant not found.</p>
        <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/admin/tenants')}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Tenant Management
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
            <Badge variant="outline" className="mt-0.5 font-mono text-xs">{tenant.slug}</Badge>
          </div>
          <Badge
            className={
              tenant.is_active
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-red-100 text-red-700 border-red-200'
            }
          >
            {tenant.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setQuotaOpen(true)}>
            <Settings2 className="mr-1.5 h-4 w-4" />
            Edit Quota
          </Button>
          <Button
            variant={tenant.is_active ? 'destructive' : 'default'}
            size="sm"
            onClick={() => setToggleConfirm(true)}
          >
            {tenant.is_active
              ? <><PowerOff className="mr-1.5 h-4 w-4" />Deactivate</>
              : <><Power className="mr-1.5 h-4 w-4" />Activate</>
            }
          </Button>
        </div>
      </div>

      {/* Tenant info card */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tenant Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <DetailRow label="Tenant ID" value={<code className="text-xs">{tenant.id}</code>} />
            <DetailRow label="Owner ID" value={<code className="text-xs">{tenant.owner_id}</code>} />
            <DetailRow label="Slug" value={<code className="text-xs">{tenant.slug}</code>} />
            <DetailRow
              label="Created"
              value={formatDistanceToNow(new Date(tenant.created_at), { addSuffix: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quota + Usage card */}
      <Card>
        <CardHeader><CardTitle className="text-base">Resource Quota & Usage</CardTitle></CardHeader>
        <CardContent>
          {quotaLoading || !quota ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-5">
              <ResourceGauge
                label="vCPU"
                used={usage?.vcpu.used ?? 0}
                max={quota.max_vcpu}
                unit=" cores"
                icon={<Cpu className="h-4 w-4" />}
              />
              <ResourceGauge
                label="RAM"
                used={Math.round((usage?.ram_mb.used ?? 0) / 1024)}
                max={Math.round(quota.max_ram_mb / 1024)}
                unit=" GB"
                icon={<MemoryStick className="h-4 w-4" />}
              />
              <ResourceGauge
                label="Disk"
                used={usage?.disk_gb.used ?? 0}
                max={quota.max_disk_gb}
                unit=" GB"
                icon={<HardDrive className="h-4 w-4" />}
              />
              <ResourceGauge
                label="VMs"
                used={usage?.vms.used ?? 0}
                max={quota.max_vms}
                unit=""
                icon={<Server className="h-4 w-4" />}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent VMs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Tenant VMs
          </h2>
          <Button variant="link" size="sm" onClick={() => navigate('/admin/vms')}>
            View all VMs →
          </Button>
        </div>
        <Card>
          {vmsLoading ? (
            <CardContent className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  {Array.from({ length: 5 }).map((__, j) => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
              ))}
            </CardContent>
          ) : tenantVMs.length === 0 ? (
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No VMs for this tenant.
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>vCPU</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantVMs.map((vm) => (
                  <TableRow key={vm.id}>
                    <TableCell className="font-medium">{vm.name}</TableCell>
                    <TableCell><VMStatusBadge status={vm.status as VMStatus} /></TableCell>
                    <TableCell>{vm.vcpu}</TableCell>
                    <TableCell>{Math.round(vm.ram_mb / 1024)} GB</TableCell>
                    <TableCell className="text-muted-foreground">{vm.ip_address ?? '—'}</TableCell>
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

      {/* Quota editor */}
      {quotaOpen && quota && usage && (
        <QuotaEditorModal
          open={quotaOpen}
          tenant={tenant}
          quota={quota}
          usage={usage}
          onClose={() => setQuotaOpen(false)}
        />
      )}

      {/* Toggle confirm */}
      <ConfirmDialog
        open={toggleConfirm}
        title={`${tenant.is_active ? 'Deactivate' : 'Activate'} "${tenant.name}"?`}
        description={
          tenant.is_active
            ? 'This will block the tenant and all their users from the platform.'
            : 'This will restore access for the tenant and their users.'
        }
        confirmLabel={tenant.is_active ? 'Deactivate' : 'Activate'}
        variant={tenant.is_active ? 'danger' : 'default'}
        isLoading={toggleActive.isPending}
        onConfirm={() => {
          toggleActive.mutate(
            { id: tenant.id, active: !tenant.is_active },
            { onSuccess: () => setToggleConfirm(false) }
          );
        }}
        onCancel={() => setToggleConfirm(false)}
      />
    </div>
  );
};

export default AdminTenantDetailPage;
