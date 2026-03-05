import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings2, Power, PowerOff, ChevronRight, Building2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import QuotaEditorModal from '@/components/features/admin/QuotaEditorModal';

import { useTenantList, useToggleTenantActive, useTenantQuota, useTenantUsage } from '@/hooks/useAdmin';
import type { Tenant } from '@/types';

const PAGE_SIZE = 15;

// ─── Mini inline bar ─────────────────────────────────────────────────────────

const MiniBar = ({ pct }: { pct: number }) => {
  const color = pct >= 100 ? 'bg-red-500' : pct >= 85 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8">{pct}%</span>
    </div>
  );
};

// ─── Row that lazily loads quota+usage only when needed ───────────────────────

interface TenantRowProps {
  tenant: Tenant;
  onEditQuota: (t: Tenant) => void;
  onToggle: (t: Tenant) => void;
}

const TenantRow = ({ tenant, onEditQuota, onToggle }: TenantRowProps) => {
  const navigate = useNavigate();
  const { data: quota } = useTenantQuota(tenant.id);
  const { data: usage } = useTenantUsage(tenant.id);

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{tenant.name}</p>
          <Badge variant="outline" className="mt-0.5 font-mono text-xs">
            {tenant.slug}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground font-mono">
        {tenant.owner_id.slice(0, 8)}…
      </TableCell>
      <TableCell>
        <Badge
          className={
            tenant.is_active
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-red-100 text-red-700 border-red-200'
          }
        >
          {tenant.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell>
        {quota && usage ? (
          <span className="text-sm">
            {usage.vms.used}/{quota.max_vms}
          </span>
        ) : (
          <Skeleton className="h-4 w-10" />
        )}
      </TableCell>
      <TableCell>
        {usage ? (
          <MiniBar pct={usage.vcpu.pct} />
        ) : (
          <Skeleton className="h-2 w-24" />
        )}
      </TableCell>
      <TableCell>
        {usage ? (
          <MiniBar pct={usage.ram_mb.pct} />
        ) : (
          <Skeleton className="h-2 w-24" />
        )}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEditQuota(tenant)}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Изменить квоту</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={tenant.is_active ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-600'}
                onClick={() => onToggle(tenant)}
              >
                {tenant.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tenant.is_active ? 'Деактивировать' : 'Активировать'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Details</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminTenantsPage = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Tenant | null>(null);

  const { data, isLoading } = useTenantList({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  const toggleActive = useToggleTenantActive();

  // Fetch quota+usage for the selected tenant (for QuotaEditorModal)
  const { data: editQuota } = useTenantQuota(editTenant?.id ?? '');
  const { data: editUsage } = useTenantUsage(editTenant?.id ?? '');

  const tenants = useMemo(() => {
    if (!data?.items) return [];
    if (!search) return data.items;
    const q = search.toLowerCase();
    return data.items.filter(
      (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Управление арендаторами</h1>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск по имени или слагу…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>

        {/* Table */}
        {!isLoading && tenants.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-12 w-12" />}
            title="Арендаторы не найдены"
            description="Ни один арендатор не соответствует вашему поиску."
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя / Слаг</TableHead>
                  <TableHead>ID владельца</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>VM</TableHead>
                  <TableHead>vCPU</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : tenants.map((t) => (
                      <TenantRow
                        key={t.id}
                        tenant={t}
                        onEditQuota={setEditTenant}
                        onToggle={setToggleTarget}
                      />
                    ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Показано {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)}{' '}
              из {data?.total ?? 0}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Назад
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Далее
              </Button>
            </div>
          </div>
        )}

        {/* Quota Editor Modal */}
        {editTenant && editQuota && editUsage && (
          <QuotaEditorModal
            open={!!editTenant}
            tenant={editTenant}
            quota={editQuota}
            usage={editUsage}
            onClose={() => setEditTenant(null)}
          />
        )}

        {/* Toggle confirm */}
        <ConfirmDialog
          open={!!toggleTarget}
          title={`${toggleTarget?.is_active ? 'Деактивировать' : 'Активировать'} "${toggleTarget?.name}"?`}
          description={
            toggleTarget?.is_active
              ? 'Арендатор и его пользователи потеряют доступ к платформе.'
              : 'Доступ к платформе для арендатора и его пользователей будет восстановлен.'
          }
          confirmLabel={toggleTarget?.is_active ? 'Деактивировать' : 'Активировать'}
          variant={toggleTarget?.is_active ? 'danger' : 'default'}
          isLoading={toggleActive.isPending}
          onConfirm={() => {
            if (toggleTarget) {
              toggleActive.mutate({ id: toggleTarget.id, active: !toggleTarget.is_active });
              setToggleTarget(null);
            }
          }}
          onCancel={() => setToggleTarget(null)}
        />
      </div>
    </TooltipProvider>
  );
};

export default AdminTenantsPage;
