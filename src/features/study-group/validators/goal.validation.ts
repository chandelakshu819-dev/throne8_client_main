import { z } from 'zod';

const goalBaseSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z.string()
    .max(1000)
    .trim()
    .optional()
    .or(z.literal('')),
  targetHours: z.number({
    required_error: 'Target hours is required',
    invalid_type_error: 'Target hours must be a number',
  }).min(1, 'At least 1 hour required').max(10000),
  startDate: z.string({
    required_error: 'Start date is required',
  }).min(1, 'Start date is required'),
  endDate: z.string({
    required_error: 'End date is required',
  }).min(1, 'End date is required'),
  category: z.string().max(50).trim().optional().or(z.literal('')),
  tags: z.array(z.string().trim()).max(10).optional(),
});

export const createGoalSchema = goalBaseSchema.refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateGoalSchema = goalBaseSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'At least one field required' }
);