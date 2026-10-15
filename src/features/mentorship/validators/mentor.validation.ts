import { DOMAINS } from "@/features/mentorship/constants/mentorship";
import z from "zod";

// Server-side rule: must contain at least one letter or digit
const requiredAlnum = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(200, `${label} is too long`)
    .refine((val) => /[a-zA-Z0-9]/.test(val), `${label} must contain letters or digits`);

// ===== ZOD SCHEMAS =====
export const createMentorSchema = z.object({
  // Step 1
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),

  linkedinUrl: z
    .string()
    .url('Please enter a valid LinkedIn URL')
    .refine(
      (val: any) => val.includes('linkedin.com'),
      'Must be a LinkedIn URL'
    ),

  githubUrl: z
    .string()
    .url('Please enter a valid GitHub URL')
    .refine(
      (val: any) => val.includes('github.com'),
      'Must be a GitHub URL'
    )
    .optional()
    .or(z.literal('')),

  profilePic: z
    .instanceof(File, { message: 'Profile picture is required' })
    .refine(
      (file: any) => file.size <= 5 * 1024 * 1024,
      'Image must be less than 5MB'
    )
    .refine(
      (file: any) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPG, PNG, or WebP allowed'
    ),

  // Step 2
  bio: z
    .string()
    .min(50, 'Bio must be at least 50 characters')
    .max(2000, 'Bio cannot exceed 2000 characters'),

  skills: z
    .array(z.string())
    .min(1, 'Add at least 1 skill')
    .max(20, 'Maximum 20 skills allowed'),

  domains: z
    .array(z.enum(DOMAINS))
    .min(1, 'Select at least 1 domain')
    .max(5, 'Maximum 5 domains allowed'),

  experienceTotal: z
    .number({ invalid_type_error: 'Please select experience' })
    .min(0)
    .max(50),

  currentRole: z.string().min(2, 'Current role is required'),

  // Step 2 — required by the server
  company: requiredAlnum('Company'),
  college: requiredAlnum('College'),
  degree: requiredAlnum('Degree'),
  branch: requiredAlnum('Branch'),
});

// Step-wise schemas for step validation
export const step1Schema = createMentorSchema.pick({
  title: true,
  linkedinUrl: true,
  profilePic: true,
});

export const step2Schema = createMentorSchema.pick({
  bio: true,
  skills: true,
  domains: true,
  experienceTotal: true,
  currentRole: true,
  company: true,
  college: true,
  degree: true,
  branch: true,
});