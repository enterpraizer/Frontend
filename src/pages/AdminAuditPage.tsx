import { useState, useMemo } from 'react';
import { Download, ChevronDown, ChevronRight, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import EmptyState from '@/components/ui/EmptyState';

import { useAdminActivity } from '@/hooks/useAdmin';
import { useTenantList } from '@/hooks/useAdmin';
import type { ActivityEntry } from '@/api/dashboard';

const PAGE_SIZE = 20;

// ─── Action colour map ────────────────────────────────────────────────────────

function actionBadgeClass(action: string): string {
  const a = action.toLowerCase();
  if (a.includes('create') || a.includes('register')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (a.includes('delete') || a.includes('terminat')) return 'bg-red-100 text-red-700 border-red-200';
  if (a.includes('stop') || a.includes('deactivat')) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (a.includes('start') || a.includes('activat')) return 'bg-green-100 text-green-700 border-green-200';
  if (a.includes('update') || a.includes('patch') || a.includes('edit')) return 'bg-violet-100 text-violet-700 border-violet-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

const ACTION_OPTIONS = [
  { label: 'Все действия', value: 'all' },
  { label: 'vm.create', value: 'vm.create' },
  { label: 'vm.start', value: 'vm.start' },
  { label: 'vm.stop', value: 'vm.stop' },
  { label: 'vm.terminate', value: 'vm.terminate' },
  { label: 'vm.delete', value: 'vm.delete' },
  { label: 'network.create', value: 'network.create' },
  { label: 'network.delete', value: 'network.delete' },
  { label: 'tenant.create', value: 'tenant.create' },
  { label: 'user.register', value: 'user.register' },
  { label: 'quota.update', value: 'quota.update' },
];

// ─── CSV export helper ────────────────────────────────────────────────────────

function exportCSV(entries: ActivityEntry[]) {
  const header = ['Временная метка', 'Арендатор', 'Пользователь', 'Действие', 'Ресурс', 'ID ресурса'];
  const rows = entries.map((e) => [
    new Date(e.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', hour12: false }).replace(',', ''),
    e.tenant_id ?? '',
    e.user_email ?? e.user_id,
    e.action,
    e.resource_type,
    e.resource_id,
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' }).split('.').reverse().join('-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Expandable details cell ─────────────────────────────────────────────────

const DetailsCell = ({ details }: { details?: Record<string, unknown> }) => {
  const [open, setOpen] = useState(false);
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  return (
    <div>
      <button
        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {open ? 'Скрыть' : 'Показать'}
      </button>
      {open && (
        <pre className="mt-1 rounded bg-muted px-2 py-1.5 text-xs font-mono overflow-x-auto max-w-xs">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminAuditPage = () => {
  const [page, setPage]           = useState(0);
  const [tenantFilter, setTenant] = useState('all');
  const [actionFilter, setAction] = useState('all');
  const [from, setFrom]           = useState('');
  const [to, setTo]               = useState('');
  const [nameSearch, setSearch]   = useState('');

  const { data, isLoading } = useAdminActivity({
    offset: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    tenant_id: tenantFilter === 'all' ? undefined : tenantFilter,
    action: actionFilter === 'all' ? undefined : actionFilter,
    from: from || undefined,
    to: to || undefined,
  });

  const { data: tenantsData } = useTenantList({ limit: 100 });

  const tenantMap = useMemo(() => {
    const m: Record<string, string> = {};
    tenantsData?.items?.forEach((t) => { m[t.id] = t.name; });
    return m;
  }, [tenantsData]);

  const entries = useMemo(() => {
    if (!data?.items) return [];
    if (!nameSearch) return data.items;
    const q = nameSearch.toLowerCase();
    return data.items.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        e.resource_type.toLowerCase().includes(q) ||
        (e.user_email ?? '').toLowerCase().includes(q)
    );
  }, [data, nameSearch]);

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExport = () => {
    if (data?.items) exportCSV(data.items);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Журнал аудита</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-wide activity across all tenants
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!data?.items?.length}>
          <Download className="mr-2 h-4 w-4" />
          Экспорт CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search action, resource, user…"
            value={nameSearch}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Tenant */}
        <Select value={tenantFilter} onValueChange={(v) => { setTenant(v); setPage(0); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все арендаторы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все арендаторы</SelectItem>
            {tenantsData?.items?.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Action */}
        <Select value={actionFilter} onValueChange={(v) => { setAction(v); setPage(0); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все действия" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Date range */}
        <Input
          type="date"
          className="w-40"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(0); }}
          title="С даты"
        />
        <Input
          type="date"
          className="w-40"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(0); }}
          title="По дату"
        />
        {(from || to || tenantFilter !== 'all' || actionFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFrom(''); setTo(''); setTenant('all'); setAction('all'); setPage(0); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {!isLoading && entries.length === 0 ? (
        <EmptyState
          title="Нет записей аудита"
          description="Нет активности, соответствующей вашим фильтрам."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Временная метка</TableHead>
                <TableHead>Арендатор</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Ресурс</TableHead>
                <TableHead>ID ресурса</TableHead>
                <TableHead>Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', dateStyle: 'short', timeStyle: 'medium' })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.tenant_id
                          ? (tenantMap[entry.tenant_id] ?? entry.tenant_id.slice(0, 8) + '…')
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.user_email ?? (
                          <code className="text-xs">{entry.user_id.slice(0, 8)}…</code>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs font-mono ${actionBadgeClass(entry.action)}`}>
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{entry.resource_type}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {entry.resource_id.slice(0, 12)}…
                        </code>
                      </TableCell>
                      <TableCell>
                        <DetailsCell details={entry.details} />
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
          <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} из {total}</span>
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
    </div>
  );
};

export default AdminAuditPage;
