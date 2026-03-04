import { z } from 'zod';

export const quotaUpdateSchema = z.object({
  max_vcpu: z.number().int().min(1, 'Min 1').max(512, 'Max 512').optional(),
  max_ram_mb: z.number().int().min(1024, 'Min 1024 MB').max(1_048_576, 'Max 1 TB').optional(),
  max_disk_gb: z.number().int().min(10, 'Min 10 GB').max(10_000, 'Max 10 TB').optional(),
  max_vms: z.number().int().min(1, 'Min 1').max(100, 'Max 100').optional(),
});

export type QuotaUpdateFormValues = z.infer<typeof quotaUpdateSchema>;
