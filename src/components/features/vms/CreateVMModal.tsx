import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
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

import { vmCreateSchema, type VMCreateFormValues } from '@/lib/schemas/vm.schema';
import { useCreateVM, useSuggestVM } from '@/hooks/useVMs';
import type { ResourceUsage, Quota } from '@/types';
import AISuggestionCard from './AISuggestionCard';

// ─── RAM options ─────────────────────────────────────────────────────────────

const RAM_OPTIONS = [
  { label: '512 MB', value: 512 },
  { label: '1 GB', value: 1024 },
  { label: '2 GB', value: 2048 },
  { label: '4 GB', value: 4096 },
  { label: '8 GB', value: 8192 },
  { label: '16 GB', value: 16384 },
  { label: '32 GB', value: 32768 },
  { label: '64 GB', value: 65536 },
];

// ─── Mini progress bar ────────────────────────────────────────────────────────

interface MiniBarProps {
  used: number;
  max: number;
}

const MiniBar = ({ used, max }: MiniBarProps) => {
  const pct = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;
  const color =
    pct >= 100 ? 'bg-red-500' : pct >= 85 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface CreateVMModalProps {
  open: boolean;
  onClose: () => void;
  currentUsage: ResourceUsage;
  quota: Quota;
}

// ─── Component ───────────────────────────────────────────────────────────────

const CreateVMModal = ({ open, onClose, currentUsage, quota }: CreateVMModalProps) => {
  const navigate = useNavigate();
  const createVM = useCreateVM();
  const suggestVM = useSuggestVM();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VMCreateFormValues>({
    resolver: zodResolver(vmCreateSchema),
    defaultValues: { name: '', vcpu: 1, ram_mb: 1024, disk_gb: 20 },
  });

  const [description, setDescription] = useState('');

  // Reset form + suggestion when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setDescription('');
      suggestVM.reset();
    }
  // suggestVM.reset is stable; eslint-disable-next-line exhaustive-deps is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  const suggestion = suggestVM.suggestion;

  const handleSuggest = () => {
    if (!description.trim()) return;
    suggestVM.reset();
    suggestVM.mutate({ description });
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    setValue('vcpu', suggestion.vcpu);
    setValue('ram_mb', suggestion.ram_mb);
    setValue('disk_gb', suggestion.disk_gb);
    suggestVM.reset();
  };

  const handleDismissSuggestion = () => {
    suggestVM.reset();
  };

  const vcpuVal = watch('vcpu') || 0;
  const ramVal = watch('ram_mb') || 0;
  const diskVal = watch('disk_gb') || 0;

  // Available resources
  const availVcpu = quota.max_vcpu - currentUsage.vcpu.used;
  const availRamMb = quota.max_ram_mb - currentUsage.ram_mb.used;
  const availDiskGb = quota.max_disk_gb - currentUsage.disk_gb.used;

  // Post-creation preview
  const previewVcpu = currentUsage.vcpu.used + (Number(vcpuVal) || 0);
  const previewRam = Math.round((currentUsage.ram_mb.used + (Number(ramVal) || 0)) / 1024);
  const previewDisk = currentUsage.disk_gb.used + (Number(diskVal) || 0);
  const maxRamGb = Math.round(quota.max_ram_mb / 1024);

  // Quota exceeded checks
  const vcpuExceeded = Number(vcpuVal) > availVcpu;
  const ramExceeded = Number(ramVal) > availRamMb;
  const diskExceeded = Number(diskVal) > availDiskGb;
  const anyExceeded = vcpuExceeded || ramExceeded || diskExceeded;

  const exceededTooltip = [
    vcpuExceeded && 'vCPU',
    ramExceeded && 'RAM',
    diskExceeded && 'Disk',
  ]
    .filter(Boolean)
    .join(', ');

  const onSubmit = async (values: VMCreateFormValues) => {
    const vm = await createVM.mutateAsync(values);
    onClose();
    navigate(`/vms/${vm.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Virtual Machine</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="vm-name">Name</Label>
            <Input
              id="vm-name"
              placeholder="my-web-server"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* vCPU */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label htmlFor="vm-vcpu">vCPU</Label>
              <span className="text-xs text-muted-foreground">
                Available: <strong>{availVcpu}</strong> cores
              </span>
            </div>
            <Input
              id="vm-vcpu"
              type="number"
              min={1}
              max={Math.min(32, availVcpu)}
              {...register('vcpu', { valueAsNumber: true })}
              onBlur={(e) => {
                const val = parseInt(e.target.value) || 1;
                const maxVal = Math.min(32, availVcpu);
                if (val > maxVal) setValue('vcpu', maxVal, { shouldValidate: true });
                else if (val < 1) setValue('vcpu', 1, { shouldValidate: true });
              }}
              className={vcpuExceeded ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">Максимум: {Math.min(32, availVcpu)} ядер доступно</p>
            {errors.vcpu && (
              <p className="text-xs text-destructive">{errors.vcpu.message}</p>
            )}
            {vcpuExceeded && (
              <p className="text-xs text-destructive">Превышает доступную квоту vCPU ({availVcpu} ядер)</p>
            )}
          </div>

          {/* RAM */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label>RAM</Label>
              <span className="text-xs text-muted-foreground">
                Available: <strong>{Math.round(availRamMb / 1024)}</strong> GB
              </span>
            </div>
            <Controller
              name="ram_mb"
              control={control}
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger className={ramExceeded ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select RAM" />
                  </SelectTrigger>
                  <SelectContent>
                    {RAM_OPTIONS.filter((opt) => opt.value <= availRamMb).map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">Максимум: {Math.round(availRamMb / 1024)} GB доступно</p>
            {errors.ram_mb && (
              <p className="text-xs text-destructive">{errors.ram_mb.message}</p>
            )}
            {ramExceeded && (
              <p className="text-xs text-destructive">Превышает доступную квоту RAM ({Math.round(availRamMb / 1024)} GB)</p>
            )}
          </div>

          {/* Disk */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label htmlFor="vm-disk">Disk (GB)</Label>
              <span className="text-xs text-muted-foreground">
                Available: <strong>{availDiskGb}</strong> GB
              </span>
            </div>
            <Input
              id="vm-disk"
              type="number"
              min={10}
              max={Math.min(500, availDiskGb)}
              {...register('disk_gb', { valueAsNumber: true })}
              onBlur={(e) => {
                const val = parseInt(e.target.value) || 10;
                const maxVal = Math.min(500, availDiskGb);
                if (val > maxVal) setValue('disk_gb', maxVal, { shouldValidate: true });
                else if (val < 10) setValue('disk_gb', 10, { shouldValidate: true });
              }}
              className={diskExceeded ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">Максимум: {Math.min(500, availDiskGb)} GB доступно</p>
            {errors.disk_gb && (
              <p className="text-xs text-destructive">{errors.disk_gb.message}</p>
            )}
            {diskExceeded && (
              <p className="text-xs text-destructive">Превышает доступную квоту диска ({availDiskGb} GB)</p>
            )}
          </div>


          {/* AI Suggestion Section */}
          <div className="rounded-md border border-dashed border-violet-300 dark:border-violet-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">
                <Sparkles className="h-4 w-4" />
                Описание проекта
              </div>
              <Badge
                variant="outline"
                className="text-xs border-violet-300 text-violet-500 dark:border-violet-700 dark:text-violet-400"
              >
                AI-powered
              </Badge>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vm-description" className="text-muted-foreground text-xs">
                Опишите ваш проект (необязательно)
              </Label>
              <textarea
                id="vm-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Например: Django веб-приложение с PostgreSQL, ~100 пользователей в день"
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-right text-xs text-muted-foreground">{description.length}/1000</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950/30"
              disabled={!description.trim() || suggestVM.isPending}
              onClick={handleSuggest}
            >
              {suggestVM.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Анализируем…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  ✨ Получить рекомендацию ИИ
                </>
              )}
            </Button>
            {suggestion && (
              <AISuggestionCard
                vcpu={suggestion.vcpu}
                ram_mb={suggestion.ram_mb}
                disk_gb={suggestion.disk_gb}
                reasoning={suggestion.reasoning}
                confidence={suggestion.confidence}
                onAccept={handleApplySuggestion}
                onDismiss={handleDismissSuggestion}
              />
            )}
          </div>

          {/* Live quota preview */}
          <div className="rounded-md border bg-muted/40 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              After creation
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>vCPU</span>
                  <span className={vcpuExceeded ? 'text-destructive font-medium' : ''}>
                    {previewVcpu}/{quota.max_vcpu}
                  </span>
                </div>
                <MiniBar used={previewVcpu} max={quota.max_vcpu} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>RAM</span>
                  <span className={ramExceeded ? 'text-destructive font-medium' : ''}>
                    {previewRam}/{maxRamGb} GB
                  </span>
                </div>
                <MiniBar
                  used={currentUsage.ram_mb.used + (Number(ramVal) || 0)}
                  max={quota.max_ram_mb}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Disk</span>
                  <span className={diskExceeded ? 'text-destructive font-medium' : ''}>
                    {previewDisk}/{quota.max_disk_gb} GB
                  </span>
                </div>
                <MiniBar used={previewDisk} max={quota.max_disk_gb} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={anyExceeded ? 0 : -1}>
                    <Button
                      type="submit"
                      disabled={anyExceeded || createVM.isPending}
                    >
                      {createVM.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating…
                        </>
                      ) : (
                        'Create VM'
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {anyExceeded && (
                  <TooltipContent>
                    {exceededTooltip} quota exceeded
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVMModal;
