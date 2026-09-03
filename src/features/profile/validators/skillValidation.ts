import { z } from 'zod';

export const createSkillSchema = z.object({
    skillName: z.string()
        .min(2, 'Skill name must be at least 2 characters')
        .max(100, 'Skill name must be less than 100 characters')
        .trim(),

    skillStrength: z.enum(['beginner', 'intermediate', 'advanced', 'expert'], {
        errorMap: () => ({ message: 'Invalid skill strength' })
    }),

    yearsOfExperience: z.number()
        .int('Years must be a whole number')
        .min(1, 'Minimum 1 year required')
        .max(50, 'Maximum 50 years allowed')
});

export type CreateSkillFormData = z.infer<typeof createSkillSchema>;