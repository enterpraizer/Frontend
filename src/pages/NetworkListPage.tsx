import { formatRelativeMsk } from '@/lib/utils';
import { useState } from 'react';
import { Plus, Network, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import NetworkStatusBadge from '@/components/features/networks/NetworkStatusBadge';
import CreateNetworkModal from '@/components/features/networks/CreateNetworkModal';

import { useNetworkList, useDeleteNetwork } from '@/hooks/useNetworks';
import type { Network as NetworkType } from '@/types';

const PAGE_SIZE = 10;

const RowSkeleton = () => (
  <TableRow>
    {Array.from({ length: 7 }).map((_, i) => (
      <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
    ))}
  </TableRow>
);

const NetworkListPage = () => {
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NetworkType | null>(null);

  const { data, isLoading } = useNetworkList({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  const deleteNetwork = useDeleteNetwork();

  const networks = data?.items ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Сети</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Создать сеть
        </Button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {!isLoading && networks.length === 0 ? (
        <EmptyState
          icon={<Network className="h-12 w-12" />}
          title="Нет сетей"
          description="Создайте сеть для подключения виртуальных машин."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Создать сеть
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>CIDR</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Видимость</TableHead>
                <TableHead>Создана</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <RowSkeleton key={i} />)
                : networks.map((net) => (
                    <TableRow key={net.id}>
                      <TableCell className="font-medium">{net.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {net.cidr}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <NetworkStatusBadge status={net.status} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            net.is_public
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }
                        >
                          {net.is_public ? 'Публичная' : 'Приватная'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatRelativeMsk(net.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={deleteNetwork.isPending}
                            onClick={() => setDeleteTarget(net)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* ── Create modal ─────────────────────────────────────────────────── */}
      <CreateNetworkModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Удалить "${deleteTarget?.name}"?`}
        description="Это навсегда удалит сеть. Подключённые VM потеряют связь."
        confirmLabel="Удалить"
        variant="danger"
        isLoading={deleteNetwork.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteNetwork.mutate(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default NetworkListPage;
