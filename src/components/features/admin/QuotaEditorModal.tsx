import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { quotaUpdateSchema, type QuotaUpdateFormValues } from '@/lib/schemas/admin.schema';
import { useUpdateQuota } from '@/hooks/useAdmin';
import type { Tenant, Quota, ResourceUsage } from '@/types';

interface QuotaEditorModalProps {
  tenant: Tenant;
  quota: Quota;
  usage: ResourceUsage;
  open: boolean;
  onClose: () => void;
}

// ─── Field row helper ────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  usedLabel: string;
  currentMin: number;
  exceeded: boolean;
  error?: string;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & { name: string };
}

const QuotaField = ({ id, label, usedLabel, currentMin, exceeded, error, inputProps }: FieldProps) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-baseline">
      <Label htmlFor={id}>{label}</Label>
      <span className="text-xs text-muted-foreground">{usedLabel}</span>
    </div>
    <Input id={id} type="number" min={currentMin} {...inputProps}
      className={exceeded ? 'border-destructive' : ''}
    />
    {exceeded && (
      <p className="flex items-center gap-1 text-xs text-destructive">
        <AlertTriangle className="h-3 w-3" />
        Cannot set below current usage ({currentMin})
      </p>
    )}
    {error && !exceeded && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

const QuotaEditorModal = ({ tenant, quota, usage, open, onClose }: QuotaEditorModalProps) => {
  const updateQuota = useUpdateQuota(tenant.id);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuotaUpdateFormValues>({
    resolver: zodResolver(quotaUpdateSchema),
    defaultValues: {
      max_vcpu: quota.max_vcpu,
      max_ram_mb: quota.max_ram_mb,
      max_disk_gb: quota.max_disk_gb,
      max_vms: quota.max_vms,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        max_vcpu: quota.max_vcpu,
        max_ram_mb: quota.max_ram_mb,
        max_disk_gb: quota.max_disk_gb,
        max_vms: quota.max_vms,
      });
    }
  }, [open, quota, reset]);

  const vals = watch();

  const vcpuExceeded  = (vals.max_vcpu  ?? 0) < usage.vcpu.used;
  const ramExceeded   = (vals.max_ram_mb ?? 0) < usage.ram_mb.used;
  const diskExceeded  = (vals.max_disk_gb ?? 0) < usage.disk_gb.used;
  const vmsExceeded   = (vals.max_vms    ?? 0) < usage.vms.used;
  const anyExceeded   = vcpuExceeded || ramExceeded || diskExceeded || vmsExceeded;

  const onSubmit = async (values: QuotaUpdateFormValues) => {
    await updateQuota.mutateAsync(values);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Quota — {tenant.name}</DialogTitle>
        </DialogHeader>

        {/* Usage context */}
        <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm space-y-1">
          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Current usage
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <span>vCPU: <strong>{usage.vcpu.used}</strong> / {quota.max_vcpu} cores</span>
            <span>RAM: <strong>{Math.round(usage.ram_mb.used / 1024)}</strong> / {Math.round(quota.max_ram_mb / 1024)} GB</span>
            <span>Disk: <strong>{usage.disk_gb.used}</strong> / {quota.max_disk_gb} GB</span>
            <span>VMs: <strong>{usage.vms.used}</strong> / {quota.max_vms}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <QuotaField
            id="max_vcpu"
            label="Max vCPU (cores)"
            usedLabel={`Currently using ${usage.vcpu.used} cores`}
            currentMin={usage.vcpu.used}
            exceeded={vcpuExceeded}
            error={errors.max_vcpu?.message}
            inputProps={register('max_vcpu', { valueAsNumber: true })}
          />
          <QuotaField
            id="max_ram_mb"
            label="Max RAM (MB)"
            usedLabel={`Currently using ${usage.ram_mb.used} MB`}
            currentMin={usage.ram_mb.used}
            exceeded={ramExceeded}
            error={errors.max_ram_mb?.message}
            inputProps={register('max_ram_mb', { valueAsNumber: true })}
          />
          <QuotaField
            id="max_disk_gb"
            label="Max Disk (GB)"
            usedLabel={`Currently using ${usage.disk_gb.used} GB`}
            currentMin={usage.disk_gb.used}
            exceeded={diskExceeded}
            error={errors.max_disk_gb?.message}
            inputProps={register('max_disk_gb', { valueAsNumber: true })}
          />
          <QuotaField
            id="max_vms"
            label="Max VMs"
            usedLabel={`Currently using ${usage.vms.used} VMs`}
            currentMin={usage.vms.used}
            exceeded={vmsExceeded}
            error={errors.max_vms?.message}
            inputProps={register('max_vms', { valueAsNumber: true })}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={anyExceeded || updateQuota.isPending}>
              {updateQuota.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              ) : (
                'Save Quota'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuotaEditorModal;
