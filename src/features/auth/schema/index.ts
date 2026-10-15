import { z } from 'zod';
import {
  cgpaRule,
  companyNameRule,
  confirmPasswordRule,
  emailRule,
  endDateRule,
  firstNameRule,
  freeTextRule,
  getMonthsDifference,
  graduationYearRule,
  lastNameRule,
  locationRule,
  MIN_JOB_DURATION_MONTHS,
  passwordRule,
  phoneRule,
  startDateRule,
} from './rules';

const accountFields = {
  email: emailRule,
  password: passwordRule,
  confirmPassword: confirmPasswordRule,
};

export const schema = z.object(accountFields).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const personalDetailsSchema = z.object({
  firstName: firstNameRule,
  lastName: lastNameRule,
  phone: phoneRule,
  location: locationRule,
});

export const currentStatusSchema = z.object({
  userType: z.enum(['working', 'student', 'fresher'], {
    errorMap: () => ({ message: 'Choose your current status to continue' }),
  }),
});

export const currentJobSchema = z.object({
  jobTitle: freeTextRule('Job title'),
  companyName: companyNameRule,
  startDate: startDateRule,
  endDate: endDateRule,
}).superRefine((data, context) => {
  if (!data.endDate) return;
  if (data.endDate < data.startDate) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date cannot be before start date' });
  } else if (getMonthsDifference(data.startDate, data.endDate) < MIN_JOB_DURATION_MONTHS) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Minimum job duration is 1 month' });
  }
});

export const studentEducationSchema = z.object({
  collegeName: freeTextRule('College name', 3),
  degree: freeTextRule('Degree'),
  fieldOfStudy: freeTextRule('Field of study'),
  graduationYear: graduationYearRule,
});

export const fresherEducationSchema = z.object({
  highestEducation: freeTextRule('Highest education'),
  preferredRole: freeTextRule('Preferred role'),
  cgpa: cgpaRule,
});

const commonRegistrationFields = {
  ...accountFields,
  firstName: firstNameRule,
  lastName: lastNameRule,
  phoneNumber: phoneRule,
  location: locationRule,
  userType: currentStatusSchema.shape.userType,
};

export const fullRegistrationSchema = z.object({
  ...commonRegistrationFields,
  jobTitle: freeTextRule('Job title').optional(),
  companyName: companyNameRule.optional(),
  startDate: startDateRule.optional(),
  endDate: endDateRule,
  collegeName: freeTextRule('College name', 3).optional(),
  degree: freeTextRule('Degree').optional(),
  fieldOfStudy: freeTextRule('Field of study').optional(),
  graduationYear: graduationYearRule.optional(),
  highestEducation: freeTextRule('Highest education').optional(),
  preferredRole: freeTextRule('Preferred role').optional(),
  cgpa: cgpaRule,
}).superRefine((data, context) => {
  if (data.password !== data.confirmPassword) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: 'Passwords do not match' });
  }
  if (data.userType === 'working') {
    for (const field of ['jobTitle', 'companyName', 'startDate'] as const) {
      if (!data[field]) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required` });
    }
    if (data.startDate && data.endDate) {
      if (data.endDate < data.startDate) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date cannot be before start date' });
      } else if (getMonthsDifference(data.startDate, data.endDate) < MIN_JOB_DURATION_MONTHS) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'Minimum job duration is 1 month' });
      }
    }
  } else if (data.userType === 'student') {
    for (const field of ['collegeName', 'degree', 'fieldOfStudy', 'graduationYear'] as const) {
      if (!data[field]) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required` });
    }
  } else {
    for (const field of ['highestEducation', 'preferredRole'] as const) {
      if (!data[field]) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required` });
    }
  }
});

export const loginSchema = z.object({
  email: z.string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
    .toLowerCase()
    .max(255, { message: 'Email is too long (max 255 characters)' })
    .refine((email) => !['example.com', 'test.com', 'demo.com'].includes(email.split('@')[1]), {
      message: 'Test or demo emails are not allowed',
    })
    .refine((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), {
      message: 'Invalid email format',
    }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(128, { message: 'Password is too long (max 128 characters)' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter (A-Z)' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter (a-z)' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number (0-9)' })
    .regex(/[@$!%*?&#^()_+\-=\[\]{}|;:,.<>]/, {
      message: 'Password must contain at least one special character (@$!%*?&#^()_+-=[]{}|;:,.<>)',
    })
    .refine((password) => !/\s/.test(password), { message: 'Password cannot contain spaces' })
    .refine((password) => !password.toLowerCase().includes('password'), {
      message: 'Password cannot contain the word "password"',
    })
    .refine((password) => !password.toLowerCase().includes('123'), {
      message: 'Avoid common sequences like "123"',
    }),
});

export type CurrentJobFormData = z.infer<typeof currentJobSchema>;
export type StudentEducationFormData = z.infer<typeof studentEducationSchema>;
export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;
export type FormData = z.infer<typeof schema>;
export type FresherEducationFormData = z.infer<typeof fresherEducationSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
