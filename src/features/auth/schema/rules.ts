import { z } from 'zod';

export const PASSWORD_SPECIAL_CHARACTERS = '@$!%*?&';
export const PASSWORD_SPECIAL_PATTERN = /[@$!%*?&]/;
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  digit: /\d/,
  special: PASSWORD_SPECIAL_PATTERN,
} as const;

export const NAME_PATTERN = /^[\p{L} .'-]+$/u;
export const LOCATION_PATTERN = /^[\p{L} ,.-]+$/u;
export const SAFE_TEXT_PATTERN = /^[^\p{Cc}<>]+$/u;
export const GRADUATION_YEAR_MIN = 2020;
export const GRADUATION_YEAR_MAX = 2035;
export const MIN_JOB_DURATION_MONTHS = 1;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/[\s().-]/g, '');
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    if (/^[1-9]\d{7,14}$/.test(digits)) return `+${digits}`;
  } else if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  throw new Error('Enter a valid phone number with a country code, or a 10-digit Indian mobile number.');
}

export const emailRule = z.string().trim().toLowerCase().email('Enter a valid email like name@example.com');
export const passwordRule = z.string()
  .min(PASSWORD_RULES.minLength, 'Password needs at least 8 characters, one uppercase, one lowercase, one number and one of @$!%*?&')
  .max(PASSWORD_RULES.maxLength, 'Password cannot exceed 128 characters')
  .regex(PASSWORD_RULES.uppercase, 'Password needs at least one uppercase letter')
  .regex(PASSWORD_RULES.lowercase, 'Password needs at least one lowercase letter')
  .regex(PASSWORD_RULES.digit, 'Password needs at least one number')
  .regex(PASSWORD_RULES.special, 'Password needs one of these characters: @$!%*?&');

export const confirmPasswordRule = z.string().min(1, 'Confirm your password');
export const firstNameRule = z.string().trim().min(2, 'First name must be at least 2 characters')
  .max(50, 'First name cannot exceed 50 characters').regex(NAME_PATTERN, 'Use letters, spaces, hyphens, apostrophes or periods');
export const lastNameRule = z.string().trim().optional().or(z.literal(''))
  .refine((value) => !value || (value.length >= 2 && value.length <= 50 && NAME_PATTERN.test(value)),
    'Last name must be 2-50 characters and use letters, spaces, hyphens, apostrophes or periods');
export const phoneRule = z.string().trim()
  .refine((value) => {
    try {
      normalizePhone(value);
      return true;
    } catch {
      return false;
    }
  }, 'Enter a valid phone number with a country code, or a 10-digit Indian mobile number')
  .transform(normalizePhone);
export const locationRule = z.string().trim().min(2, 'Location must be at least 2 characters')
  .max(100, 'Location cannot exceed 100 characters').regex(LOCATION_PATTERN, 'Use letters, spaces, commas, periods or hyphens');

export const freeTextRule = (label: string, minLength = 2, maxLength = 100) =>
  z.string().trim()
    .min(minLength, `${label} must be at least ${minLength} characters`)
    .max(maxLength, `${label} cannot exceed ${maxLength} characters`)
    .regex(SAFE_TEXT_PATTERN, `Enter ${label.toLowerCase()} without HTML or control characters`);

export const companyNameRule = freeTextRule('Company name');

export const graduationYearRule = z.string().trim()
  .regex(/^\d{4}$/, 'Enter a four-digit graduation year')
  .refine((value) => Number(value) >= GRADUATION_YEAR_MIN && Number(value) <= GRADUATION_YEAR_MAX,
    `Graduation year must be between ${GRADUATION_YEAR_MIN} and ${GRADUATION_YEAR_MAX}`);

export const cgpaRule = z.string().optional().nullable().or(z.literal(''))
  .refine((value) => !value || /^(\d{1,2}(\.\d{1,2})?|10(\.0{1,2})?)$/.test(value),
    'Enter CGPA in the accepted numeric format (for example, 8.50)');

const dateValue = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const isValidDateString = (value: string): boolean => {
  const date = dateValue(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
};

const utcToday = (): string => new Date().toISOString().slice(0, 10);
const startDateMinimum = (): string => {
  const today = new Date();
  return new Date(Date.UTC(
    today.getUTCFullYear() - 50,
    today.getUTCMonth(),
    today.getUTCDate()
  )).toISOString().slice(0, 10);
};

export const startDateRule = z.string().trim()
  .refine(isValidDateString, 'Enter a valid start date')
  .refine((value) => value <= utcToday(), 'Start date cannot be in the future')
  .refine((value) => value >= startDateMinimum(), 'Start date cannot be more than 50 years ago');

export const endDateRule = z.string().trim().optional().nullable().or(z.literal(''))
  .refine((value) => !value || isValidDateString(value), 'Enter a valid end date')
  .refine((value) => !value || dateValue(value) <= new Date(), 'End date cannot be in the future');

export function getMonthsDifference(startDate: string, endDate: string): number {
  const start = dateValue(startDate);
  const end = dateValue(endDate);
  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12
    + end.getUTCMonth() - start.getUTCMonth();
}
