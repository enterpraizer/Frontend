import { z } from 'zod';

const IPV4_CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/;

export const networkCreateSchema = z.object({
  name: z.string().min(3, 'Min 3 chars').max(100, 'Max 100 chars'),
  cidr: z
    .string()
    .min(1, 'Required')
    .regex(IPV4_CIDR_REGEX, 'Must be a valid CIDR, e.g. 192.168.1.0/24'),
  is_public: z.boolean(),
});

export type NetworkCreateFormValues = z.infer<typeof networkCreateSchema>;
