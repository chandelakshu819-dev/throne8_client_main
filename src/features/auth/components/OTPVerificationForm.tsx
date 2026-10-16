'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Lock, RotateCcw } from 'lucide-react';

interface OTPVerificationFormProps {
  email: string;
  onOTPSubmit: (otp: string) => Promise<void>;
  onResendOTP: () => Promise<void>;
  isLoading?: boolean;
  onBackClick: () => void;
  backButtonText?: string;
  expiresIn?: number;
}

export default function OTPVerificationForm({
  email,
  onOTPSubmit,
  onResendOTP,
  isLoading = false,
  onBackClick,
  backButtonText = 'Back to Email',
  expiresIn = 600,
}: OTPVerificationFormProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expiresIn); // Overall OTP expiration (10 min)
  const [resendCooldown, setResendCooldown] = useState(60); // Resend button cooldown (60 sec)
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for overall OTP expiration
  useEffect(() => {
    setTimeLeft(expiresIn);
  }, [expiresIn]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Timer for resend button cooldown
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^[0-9]*$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setApiError('Please enter all 6 digits');
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);
      await onOTPSubmit(otpString);
    } catch (error) {
      const raw = error instanceof Error ? error.message : 'Invalid OTP. Please try again.';
      const errorMessage = raw.toLowerCase().includes('email service not configured')
        ? 'Email verification service is currently unavailable on the server. Please click Resend OTP or contact support.'
        : raw;
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      setApiError(null);
      await onResendOTP();
      setTimeLeft(expiresIn);
      setResendCooldown(60);
      setCanResend(false);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error) {
      const raw = error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.';
      const errorMessage = raw.toLowerCase().includes('email service not configured')
        ? 'Email verification service is currently unavailable on the server. Please try again shortly or contact support.'
        : raw;
      setApiError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#4a3728] to-[#8b7355] rounded-full mb-3">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#4a3728] mb-1">Verify Your Email</h2>
        <p className="text-sm text-[#745842]">
          We've sent a 6-digit code to <span className="font-semibold">{email}</span>
        </p>
      </div>

      {/* OTP Input Fields */}
      <div className="flex justify-center gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={isSubmitting || isLoading || isResending}
            className="w-12 h-14 text-center text-xl text-[#4a3728] font-bold border-2 border-[#e0d8cf] rounded-lg
                       focus:border-[#8b7355] focus:outline-none transition-all bg-white
                       disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        ))}
      </div>

      {/* API Error Message */}
      {apiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* Timer and Resend */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-semibold ${timeLeft < 60 ? 'text-red-600' : 'text-[#745842]'}`}>
          {timeLeft === 0 ? 'Code expired' : `Expires in ${formatTime(timeLeft)}`}
        </span>
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={!canResend || isResending || isSubmitting}
          className="text-[#4a3728] hover:text-[#8b7355] font-semibold transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isResending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : !canResend ? (
            <span className="text-gray-400">Resend in {resendCooldown}s</span>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              Resend OTP
            </>
          )}
        </button>
      </div>

      {/* Verify Button */}
      <button
        type="submit"
        disabled={isSubmitting || isLoading || isResending || otp.join('').length !== 6 || timeLeft === 0}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white font-semibold rounded-xl
                   hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {isSubmitting || isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify OTP'
        )}
      </button>

      {/* Back Button */}
      <button
        type="button"
        onClick={onBackClick}
        disabled={isSubmitting || isLoading || isResending}
        className="w-full py-2 px-4 border-2 border-[#e0d8cf] text-[#4a3728] font-medium rounded-xl
                   hover:bg-[#f6ede8] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {backButtonText}
      </button>

      {/* Info Text */}
      <p className="text-xs text-[#745842] text-center">
        Didn't receive the code? Check your spam folder or request a new one
      </p>
    </form>
  );
}
