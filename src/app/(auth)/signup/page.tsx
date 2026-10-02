// src/app/(auth)/signup/page.tsx
'use client';

import { useState } from 'react';
import AuthLayout from '@/features/auth/components/layout/AuthLayout';
import AuthRightContainer from '@/features/auth/components/layout/AuthRightContainer';


import CreateAccount from '@/features/auth/components/CreateAccount';
import PersonalDetails from '@/features/auth/components/PersonalDetails';
import CurrentStatus from '@/features/auth/components/CurrentStatus';
import Skills from '@/features/auth/components/Skills';
import WorkingJobDetails from '@/features/auth/components/WorkingJobDetails';
import StudentEducation from '@/features/auth/components/StudentEducation';
import FresherEducationRole from '@/features/auth/components/FresherEducationRole';
import {useRegister} from '@/features/auth/hooks/useRegister';
import { useRouter } from 'next/navigation';
import { RegistrationData } from '@/features/auth/interface';
import ProgressSteps from '@/shared/uiComponents/ProgressSteps';

export default function SignupPage() {
  const router = useRouter();
  const {
    loading,
    error,
    currentStep,
    formData,
    register,
    goNext,
    goBack,
    saveFormData,
    clearErrors,
  } = useRegister();


  const [isLoading, setIsLoading] = useState(false);

  const handleNext = (stepData: any) => {
    // ⚠️ Special handling for Step 2 - Map "phone" to "phoneNumber"
    if (currentStep === 2 && stepData.phone) {
      stepData.phoneNumber = stepData.phone;
      delete stepData.phone;
    }

    saveFormData(stepData);  // ← Redux action
    goNext();
  };

  // const handleBack = () => setCurrentStep((prev) => prev - 1);
  const handleBack = () => goBack(); // ← Redux action

  const handleRegistration = async (finalData: RegistrationData) => {
    try {
      clearErrors();  // ← Clear previous errors

      // Clean data
      const cleanData = {
        email: finalData.email,
        password: finalData.password,
        confirmPassword: finalData.confirmPassword,
        firstName: finalData.firstName,
        lastName: finalData.lastName || '',
        phoneNumber: finalData.phoneNumber || '',
        location: finalData.location,
        userType: finalData.userType,
        skills: finalData.skills || [],

        ...(finalData.userType === 'working' && {
          jobTitle: finalData.jobTitle,
          companyName: finalData.companyName,
          startDate: finalData.startDate,
          endDate: finalData.endDate || undefined,
        }),

        ...(finalData.userType === 'student' && {
          collegeName: finalData.collegeName,
          degree: finalData.degree,
          fieldOfStudy: finalData.fieldOfStudy,
          graduationYear: finalData.graduationYear,
        }),

        ...(finalData.userType === 'fresher' && {
          highestEducation: finalData.highestEducation,
          preferredRole: finalData.preferredRole,
          cgpa: finalData.cgpa || undefined,
        }),
      };

      // ✅ Call Redux thunk
      await register(cleanData);

      // console.log('✅ Registration Successful');

      // Small delay for token storage
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect
      router.push('/dashboard');

    } catch (err: any) {
      console.error('❌ Registration Error:', err);
      // Error already in Redux state
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CreateAccount onNext={handleNext} />;

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
                skills: skillsData.skills || []
              } as RegistrationData; {/* ← ADD TYPE ASSERTION */ }

              // console.log('📦 Complete Registration Data:', finalData);
              await handleRegistration(finalData);
            }}
            onBack={handleBack}
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
          {renderStep()}
        </div>
      </AuthRightContainer>

      {/* ✅ Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-[#4a3728] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-semibold text-gray-900">Creating your account...</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Error Notification */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-xl shadow-lg z-50 max-w-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold">Registration Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button
              // onClick={() => setError(null)}
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