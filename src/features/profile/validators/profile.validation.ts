import { z } from 'zod';

export const updateProfileSchema = z.object({
    firstName: z.string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name cannot exceed 50 characters')
        .regex(/^[a-zA-Z\s\-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
        .optional()
        .or(z.literal('')),

    lastName: z.string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name cannot exceed 50 characters')
        .regex(/^[a-zA-Z\s\-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
        .optional()
        .or(z.literal('')),

    pronouns: z.string().optional(),

    headline: z.string()
        .min(1, 'Headline is required')
        .optional(),

    currentPosition: z.string().optional().or(z.literal('')),

    company: z.string().optional().or(z.literal('')),

    location: z.string()
        .min(2, 'Location must be at least 2 characters')
        .max(100, 'Location cannot exceed 100 characters')
        .optional()
        .or(z.literal('')),

    education: z.string().optional().or(z.literal('')),

    contactInfo: z.string().optional().or(z.literal('')),
}).refine(
    (data) => data.firstName || data.lastName || data.headline || data.location,
    {
        message: 'At least one field must be filled',
    }
);

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;