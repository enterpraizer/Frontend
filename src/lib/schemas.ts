import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema
  .extend({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const onboardingSchema = z.object({
  tenant_name: z.string().min(2, 'Tenant name must be at least 2 characters'),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const vmCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  flavor: z.string().min(1, 'Flavor is required'),
  image: z.string().min(1, 'Image is required'),
  network_id: z.string().min(1, 'Network is required'),
});
export type VMCreateInput = z.infer<typeof vmCreateSchema>;
