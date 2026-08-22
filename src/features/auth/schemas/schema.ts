// import * as z from 'zod';
// // Stronger schema
// export const schema = z.object({
//     // Email validation (EXACT SERVER MATCH)
//     email: z
//         .string()
//         .min(1, { message: 'Email is required' })
//         .email({ message: 'Please enter a valid email address' })
//         .toLowerCase()
//         .max(255, { message: 'Email is too long (max 255 characters)' })
//         .refine((email) => {
//             // Block test/demo emails
//             const blockedDomains = ['example.com', 'test.com', 'demo.com'];
//             const domain = email.split('@')[1];
//             return !blockedDomains.includes(domain);
//         }, {
//             message: 'Test or demo emails are not allowed',
//         })
//         .refine((email) => {
//             // Email format validation
//             return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//         }, {
//             message: 'Invalid email format',
//         }),

//     // Password validation (EXACT SERVER MATCH)
//     password: z
//         .string()
//         .min(8, { message: 'Password must be at least 8 characters long' })
//         .max(128, { message: 'Password is too long (max 128 characters)' })
//         .regex(/[A-Z]/, {
//             message: 'Password must contain at least one uppercase letter (A-Z)'
//         })
//         .regex(/[a-z]/, {
//             message: 'Password must contain at least one lowercase letter (a-z)'
//         })
//         .regex(/[0-9]/, {
//             message: 'Password must contain at least one number (0-9)'
//         })
//         .regex(/[@$!%*?&#^()_+\-=\[\]{}|;:,.<>]/, {
//             message: 'Password must contain at least one special character (@$!%*?&#^()_+-=[]{}|;:,.<>)'
//         })
//         .refine((pwd) => !/\s/.test(pwd), {
//             message: 'Password cannot contain spaces'
//         })
//         .refine((pwd) => !pwd.toLowerCase().includes('password'), {
//             message: 'Password cannot contain the word "password"',
//         })
//         .refine((pwd) => !pwd.toLowerCase().includes('123'), {
//             message: 'Avoid common sequences like "123"',
//         }),

//     // Confirm Password validation
//     confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),

// }).refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ['confirmPassword'],
// });

// export const fresherEducationSchema = z.object({
//     highestEducation: z
//         .string()
//         .min(1, { message: 'Highest education is required' })
//         .max(100, { message: 'Education name too long' }),

//     preferredRole: z
//         .string()
//         .min(1, { message: 'Preferred job role is required' })
//         .max(100, { message: 'Role name too long' }),

//     cgpa: z
//         .string()
//         .optional()
//         .refine((val) => {
//             if (!val || val.trim() === '') return true; // Optional
//             return /^\d+(\.\d{1,2})?$/.test(val); // Valid decimal
//         }, {
//             message: 'CGPA must be a valid number (e.g., 8.5)'
//         })
//         .refine((val) => {
//             if (!val || val.trim() === '') return true;
//             const num = parseFloat(val);
//             return num >= 0 && num <= 10;
//         }, {
//             message: 'CGPA must be between 0.00 and 10.00'
//         }),
// });


// // Validation Schema (Server match)
// export const personalDetailsSchema = z.object({
//     firstName: z
//         .string()
//         .min(2, { message: 'First name must be at least 2 characters' })
//         .max(50, { message: 'First name cannot exceed 50 characters' })
//         .regex(/^[a-zA-Z\s\-']+$/, {
//             message: 'First name can only contain letters, spaces, hyphens, and apostrophes'
//         })
//         .refine((val) => val.trim().length > 0, {
//             message: 'First name cannot be empty or just spaces'
//         }),

//     lastName: z
//         .string()
//         .min(2, { message: 'Last name must be at least 2 characters' })
//         .max(50, { message: 'Last name cannot exceed 50 characters' })
//         .regex(/^[a-zA-Z\s\-']+$/, {
//             message: 'Last name can only contain letters, spaces, hyphens, and apostrophes'
//         })
//         .refine((val) => val.trim().length > 0, {
//             message: 'Last name cannot be empty or just spaces'
//         }),

//     phone: z
//         .string()
//         .regex(/^\+?[1-9]\d{1,14}$/, {
//             message: 'Invalid phone number format (E.164 format required, e.g., +919876543210)'
//         })
//         .refine((val) => val.length >= 10, {
//             message: 'Phone number must be at least 10 digits'
//         }),

//     location: z
//         .string()
//         .min(2, { message: 'Location must be at least 2 characters' })
//         .max(100, { message: 'Location cannot exceed 100 characters' })
//         .regex(/^[A-Z][a-zA-Z\s\-]+$/, {
//             message: 'Location must start with a capital letter and contain only letters, spaces, and hyphens'
//         })
//         .refine((val) => val.trim().length > 0, {
//             message: 'Location cannot be empty'
//         }),
// });

// export const studentEducationSchema = z.object({
//   collegeName: z
//     .string()
//     .min(3, { message: 'College name must be at least 3 characters' })
//     .max(200, { message: 'College name cannot exceed 200 characters' })
//     .refine((val) => val.trim().length > 0, {
//       message: 'College name cannot be empty'
//     }),

//   degree: z
//     .string()
//     .min(1, { message: 'Degree is required (e.g., B.Tech, B.Sc)' })
//     .max(50, { message: 'Degree name too long' }),

//   fieldOfStudy: z
//     .string()
//     .min(2, { message: 'Field of study must be at least 2 characters' })
//     .max(100, { message: 'Field of study name too long' }),

//   graduationYear: z
//     .string()
//     .regex(/^\d{4}$/, { message: 'Graduation year must be a 4-digit year (e.g., 2025)' })
//     .refine((year) => {
//       const y = parseInt(year);
//       return y >= 1950 && y <= 2035;
//     }, {
//       message: 'Graduation year must be between 1950 and 2035'
//     }),
// });

// export const currentJobSchema = z.object({
//   jobTitle: z
//     .string()
//     .min(1, { message: 'Please select a job title' }),

//   companyName: z
//     .string()
//     .min(1, { message: 'Please select a company' }),

//   startDate: z
//     .string()
//     .min(1, { message: 'Start date is required' })
//     .refine((date) => {
//       const selected = new Date(date);
//       const today = new Date();
//       return selected <= today;
//     }, {
//       message: 'Start date cannot be in the future'
//     }),

//   endDate: z
//     .string()
//     .optional()
//     .refine((date) => {
//       if (!date) return true;
//       const selected = new Date(date);
//       const today = new Date();
//       return selected <= today;
//     }, {
//       message: 'End date cannot be in the future'
//     }),
// }).refine((data) => {
//   if (!data.endDate) return true;

//   const start = new Date(data.startDate);
//   const end = new Date(data.endDate);

//   if (end < start) return false;

//   const monthsDiff = getMonthsDifference(data.startDate, data.endDate);
//   return monthsDiff >= 1;
// }, {
//   message: 'End date must be after start date, with minimum 1 month job duration',
//   path: ['endDate'],
// });

// // Helper function for date validation
// const getMonthsDifference = (startDate: string, endDate: string): number => {
//   const start = new Date(startDate);
//   const end = new Date(endDate);
//   return (end.getFullYear() - start.getFullYear()) * 12 +
//     (end.getMonth() - start.getMonth());
// };

// export type CurrentJobFormData = z.infer<typeof currentJobSchema>;
// export type StudentEducationFormData = z.infer<typeof studentEducationSchema>;
// export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;
// export type FormData = z.infer<typeof schema>;
// export type FresherEducationFormData = z.infer<typeof fresherEducationSchema>;






import * as z from 'zod';

// Relaxed schema
export const schema = z.object({
    email: z
        .string()
        .min(1, { message: 'Email is required' })
        .email({ message: 'Please enter a valid email address' })
        .toLowerCase()
        .max(255, { message: 'Email is too long (max 255 characters)' }),

    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters long' })
        .max(128, { message: 'Password is too long (max 128 characters)' })
        .refine((pwd) => !/\s/.test(pwd), {
            message: 'Password cannot contain spaces'
        }),

    confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),

}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export const fresherEducationSchema = z.object({
    highestEducation: z
        .string()
        .min(1, { message: 'Highest education is required' })
        .max(100, { message: 'Education name too long' }),

    preferredRole: z
        .string()
        .min(1, { message: 'Preferred job role is required' })
        .max(100, { message: 'Role name too long' }),

    cgpa: z
        .string()
        .optional()
        .refine((val) => {
            if (!val || val.trim() === '') return true;
            return /^\d+(\.\d{1,2})?$/.test(val);
        }, {
            message: 'CGPA must be a valid number (e.g., 8.5)'
        })
        .refine((val) => {
            if (!val || val.trim() === '') return true;
            const num = parseFloat(val);
            return num >= 0 && num <= 10;
        }, {
            message: 'CGPA must be between 0.00 and 10.00'
        }),
});

// Validation Schema (relaxed)
export const personalDetailsSchema = z.object({
    firstName: z
        .string()
        .min(1, { message: 'First name is required' })
        .max(50, { message: 'First name cannot exceed 50 characters' }),

    lastName: z
        .string()
        .min(1, { message: 'Last name is required' })
        .max(50, { message: 'Last name cannot exceed 50 characters' }),

    phone: z
        .string()
        .min(10, { message: 'Phone number must be at least 10 digits' })
        .max(15, { message: 'Phone number is too long' }),

    location: z
        .string()
        .min(1, { message: 'Location is required' })
        .max(100, { message: 'Location cannot exceed 100 characters' }),
});

export const studentEducationSchema = z.object({
  collegeName: z
    .string()
    .min(1, { message: 'College name is required' })
    .max(200, { message: 'College name cannot exceed 200 characters' }),

  degree: z
    .string()
    .min(1, { message: 'Degree is required (e.g., B.Tech, B.Sc)' })
    .max(50, { message: 'Degree name too long' }),

  fieldOfStudy: z
    .string()
    .min(1, { message: 'Field of study is required' })
    .max(100, { message: 'Field of study name too long' }),

  graduationYear: z
    .string()
    .regex(/^\d{4}$/, { message: 'Graduation year must be a 4-digit year (e.g., 2025)' })
    .refine((year) => {
      const y = parseInt(year);
      return y >= 1950 && y <= 2035;
    }, {
      message: 'Graduation year must be between 1950 and 2035'
    }),
});

export const currentJobSchema = z.object({
  jobTitle: z
    .string()
    .min(1, { message: 'Please select a job title' }),

  companyName: z
    .string()
    .min(1, { message: 'Please select a company' }),

  startDate: z
    .string()
    .min(1, { message: 'Start date is required' }),

  endDate: z
    .string()
    .optional(),
}).refine((data) => {
  if (!data.endDate) return true;
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export type CurrentJobFormData = z.infer<typeof currentJobSchema>;
export type StudentEducationFormData = z.infer<typeof studentEducationSchema>;
export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;
export type FormData = z.infer<typeof schema>;
export type FresherEducationFormData = z.infer<typeof fresherEducationSchema>;