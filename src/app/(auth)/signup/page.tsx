'use client';

import { useCallback, useRef, useState } from 'react';
import AuthLayout from '@/features/auth/components/layout/AuthLayout';
import AuthRightContainer from '@/features/auth/components/layout/AuthRightContainer';
import CreateAccount from '@/features/auth/components/CreateAccount';
import PersonalDetails from '@/features/auth/components/PersonalDetails';
import CurrentStatus from '@/features/auth/components/CurrentStatus';
import Skills from '@/features/auth/components/Skills';
import WorkingJobDetails from '@/features/auth/components/WorkingJobDetails';
import StudentEducation from '@/features/auth/components/StudentEducation';
import FresherEducationRole from '@/features/auth/components/FresherEducationRole';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { useRouter } from 'next/navigation';
import { RegistrationData } from '@/features/auth/interface';
import ProgressSteps from '@/shared/uiComponents/ProgressSteps';
import { fullRegistrationSchema } from '@/features/auth/schema';
import { RegistrationFailure } from '@/lib/api/auth.service';

const fieldSteps: Record<string, number> = {
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

export default function SignupPage() {
  const router = useRouter();
  const {
    loading,
    currentStep,
    formData,
    register,
    goNext,
    goBack,
    goToStep,
    saveFormData,
    clearErrors,
  } = useRegister();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submissionBanner, setSubmissionBanner] = useState<string | null>(null);
  const [retryData, setRetryData] = useState<RegistrationData | null>(null);
  const submittingRef = useRef(false);

  const handleStepDataChange = useCallback((data: Partial<RegistrationData>) => {
    saveFormData(data);
  }, [saveFormData]);

  const clearServerFieldError = useCallback((field: string) => {
    setServerErrors((previous) => {
      if (!(field in previous)) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }, []);

  const handleNext = (stepData: Partial<RegistrationData>) => {
    const stepErrors = Object.keys(serverErrors).filter((field) => fieldSteps[field] === currentStep);
    if (stepErrors.length) {
      window.requestAnimationFrame(() => {
        const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid?.focus();
      });
      return;
    }
    const savedData = { ...stepData };
    saveFormData(savedData);
    goNext();
  };

  const submitRegistration = async (finalData: RegistrationData) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmissionBanner(null);
    setRetryData(finalData);
    clearErrors();

    const parsed = fullRegistrationSchema.safeParse(finalData);
    if (!parsed.success) {
      const fieldMessages: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] || '');
        if (field && !(field in fieldMessages)) fieldMessages[field] = issue.message;
      }
      setServerErrors((previous) => ({ ...previous, ...fieldMessages }));
      const firstField = parsed.error.issues
        .map((issue) => String(issue.path[0] || ''))
        .find((field) => field in fieldSteps);
      if (firstField) goToStep(fieldSteps[firstField]);
      submittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    const cleanData: RegistrationData = {
      email: parsed.data.email,
      password: parsed.data.password,
      confirmPassword: parsed.data.confirmPassword,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || '',
      phoneNumber: parsed.data.phoneNumber,
      location: parsed.data.location,
      userType: parsed.data.userType,
      status: parsed.data.userType,
      skills: finalData.skills || [],
      ...(parsed.data.userType === 'working' && {
        jobTitle: parsed.data.jobTitle,
        companyName: parsed.data.companyName,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate || undefined,
      }),
      ...(parsed.data.userType === 'student' && {
        collegeName: parsed.data.collegeName,
        degree: parsed.data.degree,
        fieldOfStudy: parsed.data.fieldOfStudy,
        graduationYear: parsed.data.graduationYear,
      }),
      ...(parsed.data.userType === 'fresher' && {
        highestEducation: parsed.data.highestEducation,
        preferredRole: parsed.data.preferredRole,
        cgpa: parsed.data.cgpa || undefined,
      }),
    };

    try {
      await register(cleanData);
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.push('/dashboard');
    } catch (error) {
      const failure = error as RegistrationFailure;
      const fieldErrors = failure?.fieldErrors || [];
      const mappedErrors = mapRegistrationFieldErrors(fieldErrors);
      if (Object.keys(mappedErrors).length) {
        setServerErrors((previous) => ({ ...previous, ...mappedErrors }));
        const firstField = Object.keys(mappedErrors)[0];
        if (firstField) goToStep(fieldSteps[firstField]);
      } else {
        setSubmissionBanner(buildRegistrationFailureBanner(failure, finalData));
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleBack = () => goBack();
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreateAccount
            onNext={handleNext}
            initialData={formData}
            onDataChange={handleStepDataChange}
            serverErrors={serverErrors}
            onClearServerError={clearServerFieldError}
          />
        );
      case 2:
        return (
          <PersonalDetails
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData}
            onDataChange={handleStepDataChange}
            serverErrors={serverErrors}
            onClearServerError={clearServerFieldError}
          />
        );
      case 3:
        return (
          <CurrentStatus
            onNext={handleNext}
            onBack={handleBack}
            initialData={formData}
            onDataChange={handleStepDataChange}
            serverError={serverErrors.userType}
            onClearServerError={() => clearServerFieldError('userType')}
          />
        );
      case 4: {
        const userType = formData.userType || formData.status;
        const props = {
          onNext: handleNext,
          onBack: handleBack,
          initialData: formData,
          onDataChange: handleStepDataChange,
          serverErrors,
          onClearServerError: clearServerFieldError,
        };
        if (userType === 'working') return <WorkingJobDetails {...props} />;
        if (userType === 'student') return <StudentEducation {...props} />;
        if (userType === 'fresher') return <FresherEducationRole {...props} />;
        return <p role="alert" className="text-red-600">Choose a status before continuing.</p>;
      }
      case 5:
        return (
          <Skills
            onNext={(skillsData) => {
              const finalData = { ...formData, skills: skillsData.skills } as RegistrationData;
              void submitRegistration(finalData);
            }}
            onBack={handleBack}
            initialSkills={formData.skills || []}
            onSkillsChange={(skills) => saveFormData({ skills })}
            submitting={isSubmitting || loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AuthLayout>
      <AuthRightContainer>
        <div className="w-full max-w-2xl mx-auto">
          <ProgressSteps currentStep={currentStep} />
          {submissionBanner && (
            <div role="alert" className="mb-4 whitespace-pre-line rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
              <p>{submissionBanner}</p>
              {retryData && (
                <button
                  type="button"
                  onClick={() => void submitRegistration(retryData)}
                  disabled={isSubmitting || loading}
                  className="mt-2 underline disabled:opacity-50"
                >
                  Retry
                </button>
              )}
            </div>
          )}
          {renderStep()}
        </div>
      </AuthRightContainer>

      {(isSubmitting || loading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" aria-live="polite">
          <div className="bg-white p-6 rounded-xl shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-[#4a3728] border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-semibold text-gray-900">Creating your account...</p>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
