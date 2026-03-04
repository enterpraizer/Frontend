import { z } from 'zod';

export const vmCreateSchema = z.object({
  name: z.string().min(3, 'Min 3 chars').max(100, 'Max 100 chars'),
  vcpu: z
    .number()
    .int()
    .min(1, 'Min 1 vCPU')
    .max(32, 'Max 32 vCPU'),
  ram_mb: z
    .number()
    .int()
    .min(512, 'Min 512 MB')
    .max(65536, 'Max 65536 MB'),
  disk_gb: z
    .number()
    .int()
    .min(10, 'Min 10 GB')
    .max(500, 'Max 500 GB'),
});

export type VMCreateFormValues = z.infer<typeof vmCreateSchema>;

