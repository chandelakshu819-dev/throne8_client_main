'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { schema, FormData } from '../schema';
import SocialButtons from '@/shared/uiComponents/SocialButtons';

interface Step1Props {
  onNext: (data: FormData) => void;
  isLoading?: boolean;
  serverError?: string | null;
  defaultEmail?: string;
  defaultPassword?: string;
  defaultConfirmPassword?: string;
}

export default function Step1CreateAccount({
  onNext,
  isLoading = false,
  serverError = null,
  defaultEmail = '',
  defaultPassword = '',
  defaultConfirmPassword = '',
}: Step1Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      email: defaultEmail,
      password: defaultPassword,
      confirmPassword: defaultConfirmPassword,
    },
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Watch fields to check if they are filled
  const email = watch('email');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Manual check: all fields filled + no errors
  const allFilled = Boolean(email && password && confirmPassword);
  const isFormValid = isValid && allFilled;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6 sm:space-y-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] to-[#8b7355] leading-tight">
          Create Account
        </h2>

        <form onSubmit={handleSubmit(onNext)} className="space-y-5 sm:space-y-6 md:space-y-8">
          {/* Server Error Alert */}
          {serverError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm">
                <span>{serverError}</span>
                {serverError.toLowerCase().includes('already exists') && (
                  <span className="block mt-1 font-semibold">
                    <Link href="/login" className="text-[#4a3728] underline hover:text-[#8b7355]">
                      Click here to log in &rarr;
                    </Link>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="Email"
              suppressHydrationWarning
              disabled={isLoading}
              className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl border text-sm ${errors.email ? 'border-red-500' : 'border-[#4a3728]'
                } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs sm:text-sm mt-1.5 flex items-start gap-1">
                <span className="text-red-500">•</span>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Password</label>
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              disabled={isLoading}
              className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border text-sm ${errors.password ? 'border-red-500' : 'border-[#4a3728]'
                } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              disabled={isLoading}
              className="absolute right-2 sm:right-3 md:right-4 top-9 sm:top-10 md:top-11 text-gray-500 hover:text-gray-700 transition"
            >
              {showPass ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-xs sm:text-sm mt-1.5 flex items-start gap-1">
                <span className="text-red-500">•</span>
                {errors.password.message}
              </p>
            )}
            {!errors.password && (
              <p className="text-gray-500 text-xs mt-1.5">
                Must contain: uppercase, lowercase, number, special character (@$!%*?&)
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm Password"
              disabled={isLoading}
              className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-[#4a3728]'
                } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.confirmPassword ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              disabled={isLoading}
              className="absolute right-2 sm:right-3 md:right-4 top-9 sm:top-10 md:top-11 text-gray-500 hover:text-gray-700 transition"
            >
              {showConfirm ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>

            {errors.confirmPassword && (
              <p className="text-red-500 text-xs sm:text-sm mt-1.5 flex items-start gap-1">
                <span className="text-red-500">•</span>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Next Button - Right aligned + disabled until valid */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`
                px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-semibold transition shadow-lg text-sm sm:text-base flex items-center justify-center gap-2
                ${isFormValid && !isLoading
                  ? 'bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white hover:opacity-90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </form>

        <SocialButtons />
      </div>
    </div>
  );
}