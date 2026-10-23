import * as z from 'zod';

// Login par sirf basic checks. Password strength rules (uppercase, special char,
// "123" etc.) sirf signup / reset password me hone chahiye.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
    .max(255, { message: 'Email is too long (max 255 characters)' })
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .max(128, { message: 'Password is too long (max 128 characters)' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;