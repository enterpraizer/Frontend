import { z } from 'zod';

export const profileSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  avatar_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, 'Required'),
    new_password: z.string().min(8, 'Min 8 characters'),
    confirm_new_password: z.string().min(1, 'Required'),
  })
  .refine((d) => d.new_password === d.confirm_new_password, {
    message: 'Passwords do not match',
    path: ['confirm_new_password'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
