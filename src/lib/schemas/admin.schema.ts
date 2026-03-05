import { z } from 'zod';

export const quotaUpdateSchema = z
  .object({
    max_vcpu: z.number().int().min(1, 'Min 1').max(512, 'Max 512').optional(),
    max_ram_mb: z.number().int().min(1024, 'Min 1024 MB').max(1_048_576, 'Max 1 TB').optional(),
    max_disk_gb: z.number().int().min(10, 'Min 10 GB').max(10_000, 'Max 10 TB').optional(),
    max_vms: z.number().int().min(1, 'Min 1').max(1000, 'Max 1000').optional(),
  })
  .superRefine((vals, ctx) => {
    const vms = vals.max_vms ?? 0;
    const vcpu = vals.max_vcpu ?? 0;
    const ram = vals.max_ram_mb ?? 0;

    if (vms > 0 && vcpu > 0 && vms > vcpu) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Количество VM (${vms}) не может превышать количество vCPU (${vcpu}) — каждая VM требует минимум 1 vCPU. Увеличьте vCPU до ${vms} или уменьшите Max VMs до ${vcpu}.`,
        path: ['max_vms'],
      });
    }

    if (vms > 0 && ram > 0 && ram < vms * 512) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `RAM (${ram} MB) недостаточно для ${vms} VM — каждая VM требует минимум 512 MB. Увеличьте RAM до ${vms * 512} MB или уменьшите Max VMs.`,
        path: ['max_ram_mb'],
      });
    }
  });

export type QuotaUpdateFormValues = z.infer<typeof quotaUpdateSchema>;
