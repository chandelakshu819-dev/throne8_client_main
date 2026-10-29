import { RegistrationFailure } from '@/lib/api/auth.service';
import { RegistrationData } from '@/features/auth/interface';

export const fieldSteps: Record<string, number> = {
  email: 1,
  password: 1,
  confirmPassword: 1,
  firstName: 2,
  lastName: 2,
  phoneNumber: 2,
  location: 2,
  userType: 3,
  jobTitle: 4,
  companyName: 4,
  startDate: 4,
  endDate: 4,
  collegeName: 4,
  degree: 4,
  fieldOfStudy: 4,
  graduationYear: 4,
  highestEducation: 4,
  preferredRole: 4,
  cgpa: 4,
};

export function mapRegistrationFieldErrors(
  fieldErrors: RegistrationFailure['fieldErrors']
): Record<string, string> {
  return (fieldErrors || []).reduce<Record<string, string>>((mappedErrors, fieldError) => {
    if (Object.prototype.hasOwnProperty.call(fieldSteps, fieldError.field)) {
      mappedErrors[fieldError.field] = fieldError.message;
    }
    return mappedErrors;
  }, {});
}

export function buildRegistrationFailureBanner(
  failure: RegistrationFailure,
  submittedData: RegistrationData
): string {
  const errorMessages = (failure.statusCode === 400 || failure.statusCode === 409)
    ? (Array.isArray(failure.errors)
      ? failure.errors.filter((message) => typeof message === 'string' && message.trim()).slice(0, 3)
      : [])
    : [];
  const submittedValues = Object.values(submittedData)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  const redactSubmittedValues = (message: string) => submittedValues.reduce((safeMessage, value) => {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safeMessage.replace(new RegExp(escapedValue, 'gi'), '[redacted]');
  }, message);

  return [failure.message || 'Registration failed. Please retry.', ...errorMessages]
    .map(redactSubmittedValues)
    .join('\n');
}
