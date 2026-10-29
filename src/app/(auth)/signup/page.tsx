'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/features/auth/components/layout/AuthLayout';
import AuthRightContainer from '@/features/auth/components/layout/AuthRightContainer';

import CreateAccount from '@/features/auth/components/CreateAccount';
import PersonalDetails from '@/features/auth/components/PersonalDetails';
import CurrentStatus from '@/features/auth/components/CurrentStatus';
import Skills from '@/features/auth/components/Skills';
import WorkingJobDetails from '@/features/auth/components/WorkingJobDetails';
import StudentEducation from '@/features/auth/components/StudentEducation';
import FresherEducationRole from '@/features/auth/components/FresherEducationRole';
import OTPVerificationForm from '@/features/auth/components/OTPVerificationForm';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { HOME_PATH } from '@/config/launch';
import { RegistrationData } from '@/features/auth/interface';
import ProgressSteps from '@/shared/uiComponents/ProgressSteps';
import { fullRegistrationSchema } from '@/features/auth/schema';
import AuthService, { RegistrationFailure } from '@/lib/api/auth.service';
import {
  mapRegistrationFieldErrors,
  buildRegistrationFailureBanner,
} from '@/features/auth/utils/mapRegistrationFieldErrors';

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


export default function SignupPage() {
  const router = useRouter();
  const {
    loading,
    currentStep,
    formData,
    register,
    goToStep,
    goNext,
    goBack,
    saveFormData,
    clearErrors,
  } = useRegister();

  // ---------- Registration submit state ----------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submissionBanner, setSubmissionBanner] = useState<string | null>(null);
  const [retryData, setRetryData] = useState<RegistrationData | null>(null);
  // Single-flight guard: prevents duplicate registration calls on rapid clicks
  const submittingRef = useRef(false);

  // ---------- Email OTP verification state ----------
  const [flowStage, setFlowStage] = useState<'form' | 'otp' | 'success'>('form');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>(600);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');

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

  // ---------- Step 1: account details -> send OTP ----------
  const handleStep1Next = async (step1Data: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const normalizedEmail = (step1Data.email || '').trim().toLowerCase();

    // Save Step 1 fields to the form store
    saveFormData({
      email: normalizedEmail,
      password: step1Data.password,
      confirmPassword: step1Data.confirmPassword,
    });
    setStep1Error(null);

    // This exact email is already verified and the token is still held: skip OTP
    if (verifiedEmail === normalizedEmail && verificationToken) {
      goNext();
      return;
    }

    // Email changed after a previous verification: drop the stale token
    if (verifiedEmail && verifiedEmail !== normalizedEmail) {
      setVerificationToken('');
      setVerifiedEmail('');
      saveFormData({ verificationToken: undefined });
    }

    setIsSendingOtp(true);
    try {
      console.log('📧 [SIGNUP_STEP1] Sending registration OTP to:', normalizedEmail);
      const res = await AuthService.sendRegistrationOtp({
        email: normalizedEmail,
        firstName: formData.firstName,
      });

      const expiresIn = res?.data?.expiresIn || 600;
      setOtpExpiresIn(expiresIn);
      setRegisteredEmail(normalizedEmail);
      setOtpNotice(res?.message || 'Verification code sent to your email');
      setFlowStage('otp');
    } catch (err: any) {
      console.error('❌ [SIGNUP_STEP1] Failed to send OTP:', err);
      setStep1Error(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ---------- Steps 2-4: normal form navigation ----------
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

    const savedData = { ...stepData } as Partial<RegistrationData> & { phone?: string };

    // Step 2 form uses "phone"; the registration payload uses "phoneNumber"
    if (currentStep === 2 && savedData.phone) {
      savedData.phoneNumber = savedData.phone;
      delete savedData.phone;
    }

    saveFormData(savedData);
    goNext();
  };

  const handleBack = () => goBack();

  // ---------- OTP stage handlers ----------
  const handleOTPSubmit = async (otp: string) => {
    const targetEmail = registeredEmail || formData.email;
    if (!targetEmail) {
      throw new Error('Email address not found. Please try again.');
    }

    try {
      setIsVerifyingOtp(true);
      const res = await AuthService.verifyRegistrationOtp({
        email: targetEmail,
        otp,
      });

      // Backend response: { status, data: { email, verificationToken, expiresIn }, message }
      const token = res?.data?.verificationToken || res?.verificationToken;
      if (!token) {
        throw new Error('Verification token not received from server.');
      }

      console.log('✅ [SIGNUP_OTP] Verification successful, token received');
      const cleanEmail = targetEmail.trim().toLowerCase();
      setVerificationToken(token);
      setVerifiedEmail(cleanEmail);
      saveFormData({
        email: cleanEmail,
        verificationToken: token,
      });

      // Advance to Step 2 (Personal Details)
      setFlowStage('form');
      goToStep(2);
    } catch (error: any) {
      console.error('❌ [SIGNUP_OTP] Verification failed:', error);
      throw error;
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOTP = async () => {
    const targetEmail = registeredEmail || formData.email;
    if (!targetEmail) {
      throw new Error('Email not found.');
    }
    try {
      const res = await AuthService.resendRegistrationOtp({
        email: targetEmail,
        firstName: formData.firstName,
      });
      setOtpNotice(res?.message || 'A new verification code has been sent to your email.');
    } catch (err: any) {
      console.error('❌ [SIGNUP_OTP] Resend failed:', err);
      throw err;
    }
  };

  const handleBackFromOtp = () => {
    setFlowStage('form');
  };

  // ---------- Final step: validate + register ----------
  const submitRegistration = async (finalData: RegistrationData) => {
    if (submittingRef.current) return;

    // Registration requires the token issued after OTP verification
    const token = verificationToken || formData.verificationToken;
    if (!token) {
      setStep1Error('Please verify your email before creating your account.');
      goToStep(1);
      return;
    }

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
      verificationToken: token,
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

      // Brief delay for token/user hydration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Show the success screen, then go home
      setFlowStage('success');
      setTimeout(() => {
        router.push(HOME_PATH);
      }, 1500);
    } catch (error) {
      const failure = error as RegistrationFailure;

      // 401 from /register means the email-verification token expired or was already used
      if (failure?.statusCode === 401) {
        setVerificationToken('');
        setVerifiedEmail('');
        saveFormData({ verificationToken: undefined });
        setStep1Error(
          failure.message || 'Email verification expired. Please verify your email again.'
        );
        goToStep(1);
        return;
      }

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreateAccount
            onNext={handleStep1Next}
            initialData={formData}
            onDataChange={handleStepDataChange}
            serverErrors={serverErrors}
            onClearServerError={clearServerFieldError}
            isLoading={isSendingOtp}
            serverError={step1Error}
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
            isLoading={isSubmitting || loading}
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
          {/* Form steps */}
          {flowStage === 'form' && (
            <>
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
            </>
          )}

          {/* OTP verification stage */}
          {flowStage === 'otp' && (
            <div className="w-full max-w-md mx-auto space-y-4">
              {otpNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs text-center font-medium">
                  {otpNotice}
                </div>
              )}
              <OTPVerificationForm
                email={registeredEmail || formData.email || ''}
                onOTPSubmit={handleOTPSubmit}
                onResendOTP={handleResendOTP}
                isLoading={isVerifyingOtp}
                onBackClick={handleBackFromOtp}
                backButtonText="Back to Account Details"
                expiresIn={otpExpiresIn}
              />
            </div>
          )}

          {/* Registration success stage */}
          {flowStage === 'success' && (
            <div className="w-full max-w-md mx-auto space-y-6 text-center py-8">
              <div className="flex justify-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full animate-bounce">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#4a3728] mb-2">Account Created Successfully!</h2>
                <p className="text-[#745842] text-sm">
                  Welcome to Throne8! Redirecting you to your dashboard...
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <div className="w-6 h-6 border-2 border-[#4a3728] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          )}
        </div>
      </AuthRightContainer>

      {/* Loading overlay during registration */}
      {(isSubmitting || loading) && flowStage === 'form' && (
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
