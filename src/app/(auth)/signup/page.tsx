// src/app/(auth)/signup/page.tsx
'use client';

import { useState, useRef } from 'react';
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
import AuthService from '@/lib/api/auth.service';
import TokenStorage from '@/lib/store/token.storage';

function normalizeDegree(deg?: string): string {
  if (!deg) return 'Other';
  const trimmed = deg.trim();
  const valid = [
    'B.Tech', 'B.E', 'B.Sc', 'BCA', 'B.Com', 'B.A',
    'M.Tech', 'M.E', 'M.Sc', 'MCA', 'M.Com', 'M.A',
    'MBA', 'PhD', 'Diploma', 'Other'
  ];
  if (valid.includes(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower.includes('b.tech') || lower.includes('btech')) return 'B.Tech';
  if (lower.includes('b.e') || lower.includes('be')) return 'B.E';
  if (lower.includes('b.sc') || lower.includes('bsc')) return 'B.Sc';
  if (lower.includes('bca')) return 'BCA';
  if (lower.includes('b.com') || lower.includes('bcom')) return 'B.Com';
  if (lower.includes('b.a') || lower.includes('ba')) return 'B.A';
  if (lower.includes('m.tech') || lower.includes('mtech')) return 'M.Tech';
  if (lower.includes('m.e') || lower.includes('me')) return 'M.E';
  if (lower.includes('m.sc') || lower.includes('msc')) return 'M.Sc';
  if (lower.includes('mca')) return 'MCA';
  if (lower.includes('m.com') || lower.includes('mcom')) return 'M.Com';
  if (lower.includes('m.a') || lower.includes('ma')) return 'M.A';
  if (lower.includes('mba')) return 'MBA';
  if (lower.includes('phd')) return 'PhD';
  if (lower.includes('diploma')) return 'Diploma';
  return 'Other';
}

function normalizeFieldOfStudy(field?: string): string {
  if (!field) return 'Other';
  const trimmed = field.trim();
  const valid = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Electrical',
    'Mechanical',
    'Civil',
    'Chemical',
    'Biotechnology',
    'Aerospace',
    'Automobile',
    'Data Science',
    'Artificial Intelligence',
    'Machine Learning',
    'Cyber Security',
    'Business Administration',
    'Finance',
    'Marketing',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Other'
  ];
  if (valid.includes(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower.includes('computer') || lower.includes('software')) return 'Computer Science';
  if (lower.includes('information') || lower.includes('it')) return 'Information Technology';
  if (lower.includes('electronics')) return 'Electronics';
  if (lower.includes('electrical')) return 'Electrical';
  if (lower.includes('mechanical') || lower.includes('robotics') || lower.includes('mechatronics')) return 'Mechanical';
  if (lower.includes('civil') || lower.includes('structural')) return 'Civil';
  if (lower.includes('chemical')) return 'Chemical';
  if (lower.includes('bio')) return 'Biotechnology';
  if (lower.includes('aero')) return 'Aerospace';
  if (lower.includes('auto')) return 'Automobile';
  if (lower.includes('data')) return 'Data Science';
  if (lower.includes('artificial') || lower.includes('ai')) return 'Artificial Intelligence';
  if (lower.includes('machine learning') || lower.includes('ml')) return 'Machine Learning';
  if (lower.includes('cyber') || lower.includes('security')) return 'Cyber Security';
  if (lower.includes('business') || lower.includes('management')) return 'Business Administration';
  if (lower.includes('finance')) return 'Finance';
  if (lower.includes('market')) return 'Marketing';
  if (lower.includes('math')) return 'Mathematics';
  if (lower.includes('physic')) return 'Physics';
  if (lower.includes('chem')) return 'Chemistry';
  if (lower.includes('bio')) return 'Biology';
  return 'Other';
}

export default function SignupPage() {
  const router = useRouter();
  const {
    loading,
    error,
    currentStep,
    formData,
    register,
    goToStep,
    goNext,
    goBack,
    saveFormData,
    clearErrors,
  } = useRegister();

  const [flowStage, setFlowStage] = useState<'form' | 'otp' | 'success'>('form');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState<boolean>(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>(600);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');

  // Single-flight ref to guarantee no duplicate registration/OTP calls on rapid clicks
  const isRegistrationLockedRef = useRef<boolean>(false);

  const handleStep1Next = async (step1Data: any) => {
    const normalizedEmail = (step1Data.email || '').trim().toLowerCase();

    // Save Step 1 fields to Redux formData
    saveFormData({
      email: normalizedEmail,
      password: step1Data.password,
      confirmPassword: step1Data.confirmPassword,
    });
    setStep1Error(null);

    // If this exact email is already verified and has an unexpired verificationToken, advance directly to Step 2
    if (verifiedEmail === normalizedEmail && verificationToken) {
      goNext();
      return;
    }

    // If email was changed after previous verification, clear the stale token
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

  const handleNext = (stepData: any) => {
    // Special handling for Step 2 - Map "phone" to "phoneNumber"
    if (currentStep === 2 && stepData.phone) {
      stepData.phoneNumber = stepData.phone;
      delete stepData.phone;
    }

    saveFormData(stepData);
    goNext();
  };

  const handleBack = () => goBack();

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

      // Extract verification token:
      // Backend response: { status: "success", data: { email: "...", verificationToken: "...", expiresIn: 900 }, message: "..." }
      const token = res?.data?.verificationToken || res?.verificationToken;
      if (!token) {
        throw new Error('Verification token not received from server.');
      }

      console.log('✅ [SIGNUP_OTP] Verification successful, token received');
      setVerificationToken(token);
      setVerifiedEmail(targetEmail.trim().toLowerCase());
      saveFormData({
        email: targetEmail.trim().toLowerCase(),
        verificationToken: token,
      });

      // Advance to Step 2 (Personal Details) in the form
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

  const handleRegistration = async (finalData: RegistrationData) => {
    // 🛡️ Single-flight guard: Ignore duplicate clicks
    if (isRegistrationLockedRef.current || isSubmittingRegistration) {
      console.warn('⚠️ [REGISTRATION] Registration already in progress. Ignoring duplicate click.');
      return;
    }

    const token = verificationToken || formData.verificationToken;
    if (!token) {
      console.error('❌ [REGISTRATION] Missing verification token. Returning to OTP step.');
      setFlowStage('otp');
      return;
    }

    isRegistrationLockedRef.current = true;
    setIsSubmittingRegistration(true);

    try {
      clearErrors();

      // Normalize userType
      const resolvedUserType = (finalData.userType || (finalData as any).status || 'student') as 'working' | 'student' | 'fresher';

      // Normalize location: Must start with capital letter and only contain letters, spaces, hyphens (max 49 chars)
      let cleanLocation = (finalData.location || '').trim();
      if (cleanLocation) {
        cleanLocation = cleanLocation.replace(/[^a-zA-Z\s\-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanLocation.length > 0) {
          cleanLocation = cleanLocation.charAt(0).toUpperCase() + cleanLocation.slice(1);
        }
        if (cleanLocation.length > 49) {
          cleanLocation = cleanLocation.slice(0, 49).trim();
        }
      }
      if (!cleanLocation) {
        cleanLocation = 'India';
      }

      // Clean registration payload including verificationToken
      const cleanData: any = {
        email: finalData.email?.trim().toLowerCase(),
        password: finalData.password,
        confirmPassword: finalData.confirmPassword,
        firstName: finalData.firstName?.trim(),
        lastName: finalData.lastName?.trim() || '',
        location: cleanLocation,
        userType: resolvedUserType,
        skills: finalData.skills || [],
        verificationToken: token,
      };

      if (finalData.phoneNumber && finalData.phoneNumber.trim()) {
        cleanData.phoneNumber = finalData.phoneNumber.trim();
      }

      if (resolvedUserType === 'working') {
        cleanData.jobTitle = finalData.jobTitle?.trim();
        cleanData.companyName = finalData.companyName?.trim();
        cleanData.startDate = finalData.startDate;
        if (finalData.endDate) cleanData.endDate = finalData.endDate;
      } else if (resolvedUserType === 'student') {
        cleanData.collegeName = finalData.collegeName?.trim();
        cleanData.degree = normalizeDegree(finalData.degree);
        cleanData.fieldOfStudy = normalizeFieldOfStudy(finalData.fieldOfStudy);
        cleanData.graduationYear = String(finalData.graduationYear || '').trim();
      } else if (resolvedUserType === 'fresher') {
        cleanData.highestEducation = finalData.highestEducation?.trim();
        cleanData.preferredRole = finalData.preferredRole?.trim();
        if (finalData.cgpa) cleanData.cgpa = String(finalData.cgpa).trim();
      }

      // Submit registration with verificationToken
      // Backend creates user in MongoDB with emailVerified: true and returns access & refresh tokens
      await register(cleanData);

      // Brief delay for localStorage token hydration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Transition to success state
      setFlowStage('success');

      // Redirect to home after showing success animation
      setTimeout(() => {
        router.push(HOME_PATH);
      }, 1500);
    } catch (err: any) {
      console.error('❌ Registration Error:', err);
    } finally {
      setIsSubmittingRegistration(false);
      isRegistrationLockedRef.current = false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreateAccount
            onNext={handleStep1Next}
            isLoading={isSendingOtp}
            serverError={step1Error}
            defaultEmail={formData.email}
            defaultPassword={formData.password}
            defaultConfirmPassword={formData.confirmPassword}
          />
        );

      case 2:
        return <PersonalDetails onNext={handleNext} onBack={handleBack} />;

      case 3:
        return <CurrentStatus onNext={handleNext} onBack={handleBack} />;

      case 4: {
        const userStatus = formData.status || formData.userType;
        return (
          <>
            {userStatus === 'working' && (
              <WorkingJobDetails onNext={handleNext} onBack={handleBack} />
            )}
            {userStatus === 'student' && (
              <StudentEducation onNext={handleNext} onBack={handleBack} />
            )}
            {userStatus === 'fresher' && (
              <FresherEducationRole onNext={handleNext} onBack={handleBack} />
            )}
          </>
        );
      }

      case 5:
        return (
          <Skills
            onNext={async (skillsData: any) => {
              const finalData = {
                ...formData,
                skills: skillsData.skills || [],
              } as RegistrationData;

              await handleRegistration(finalData);
            }}
            onBack={handleBack}
            isLoading={isSubmittingRegistration || loading}
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
          {/* Progress Steps (Visible during form steps) */}
          {flowStage === 'form' && (
            <>
              <ProgressSteps currentStep={currentStep} />
              {renderStep()}
            </>
          )}

          {/* OTP Verification Stage */}
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

          {/* Registration Success Stage */}
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

      {/* Loading Overlay during registration */}
      {(loading || isSubmittingRegistration) && flowStage === 'form' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-[#4a3728] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-semibold text-gray-900">Creating your account...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-xl shadow-lg z-50 max-w-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold">Registration Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => clearErrors()}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}