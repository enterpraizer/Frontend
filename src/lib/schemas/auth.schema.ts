import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be at most 50 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Required'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const tenantSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be 3–100 characters')
    .max(100, 'Name must be 3–100 characters'),
});
export type TenantInput = z.infer<typeof tenantSchema>;
