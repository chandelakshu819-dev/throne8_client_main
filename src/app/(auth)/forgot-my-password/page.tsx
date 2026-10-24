'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/features/auth/components/layout/AuthLayout';
import AuthRightContainer from '@/features/auth/components/layout/AuthRightContainer';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm';
import OTPVerificationForm from '@/features/auth/components/OTPVerificationForm';
import UpdatePasswordModal from '@/components/modals/UpdatePasswordModal';
import PasswordService from '@/lib/api/password.service';
import { Step } from '@/features/auth/types';
import AuthHeader from '@/shared/uiComponents/AuthHeader';


export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState<string>('');
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string>('');

  // ==================== STEP 1: HANDLE EMAIL SUBMISSION ====================
  const handleEmailSubmit = async (submittedEmail: string) => {
    try {
      setIsLoading(true);
      await PasswordService.requestPasswordReset(submittedEmail);
      setEmail(submittedEmail);
      setStep('otp');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== STEP 2: HANDLE OTP SUBMISSION ====================
  const handleOTPSubmit = async (otp: string) => {
    try {
      setIsLoading(true);

      if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        throw new Error('Please enter a valid 6-digit OTP');
      }
      
      const response = await PasswordService.verifyPasswordResetOTP(email, otp);
      const token = response?.data?.resetToken || (response as any)?.resetToken;
      if (!token) {
        throw new Error('Verification failed. Please try again.');
      }

      setResetToken(token);
      setShowUpdatePasswordModal(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== STEP 2: HANDLE OTP RESEND ====================
  const handleResendOTP = async () => {
    try {
      await PasswordService.requestPasswordReset(email);
    } catch (error) {
      throw error;
    }
  };

  // ==================== STEP 3: HANDLE PASSWORD UPDATE ====================
  const handlePasswordUpdate = async (newPassword: string) => {
    try {
      setIsLoading(true);
      await PasswordService.verifyPasswordReset(email, resetToken, newPassword);
      setShowUpdatePasswordModal(false);
      setStep('success');
    } catch (error) {
      throw error;  // Modal me dikha dega
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== BACK BUTTON ====================
  const handleBackClick = () => {
    setStep('email');
    setEmail('');
    setResetToken('');
  };

  return (
    <AuthLayout>
      <AuthRightContainer>
        <AuthHeader />

        {/* STEP 1: Email Input */}
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-[#4a3728] mb-2">Forgot Your Password?</h1>
              <p className="text-[#745842]">
                Enter your registered email and we'll send you an OTP to reset your password.
              </p>
            </div>
            <ForgotPasswordForm onEmailSubmit={handleEmailSubmit} isLoading={isLoading} />
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-4">
            <OTPVerificationForm
              email={email}
              onOTPSubmit={handleOTPSubmit}
              onResendOTP={handleResendOTP}
              isLoading={isLoading}
              onBackClick={handleBackClick}
            />
          </div>
        )}

        {/* STEP 3: Success Message */}
        {step === 'success' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#4a3728] mb-2">Password Reset Successful</h1>
              <p className="text-[#745842]">
                Your password has been updated successfully. You can now login with your new password.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white font-semibold rounded-xl
                         hover:opacity-90 transition-all shadow-md hover:shadow-lg text-center"
            >
              Back to Login
            </Link>
          </div>
        )}

        {/* Links */}
        <div className="text-center text-sm text-gray-600 space-y-2">
          {step !== 'success' && (
            <>
              <p>
                Remember your password?{' '}
                <Link href="/login" className="text-[#4a3728] font-semibold hover:underline">
                  Login here
                </Link>
              </p>
              <p>
                Don't have an account?{' '}
                <Link href="/signup" className="text-[#4a3728] font-semibold hover:underline">
                  Create one
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Update Password Modal */}
        <UpdatePasswordModal
          isOpen={showUpdatePasswordModal}
          onClose={() => setShowUpdatePasswordModal(false)}
          onPasswordUpdate={handlePasswordUpdate}
          email={email}
        />
      </AuthRightContainer>
    </AuthLayout>
  );
}