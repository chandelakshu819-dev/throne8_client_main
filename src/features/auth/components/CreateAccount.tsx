'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { schema, FormData } from '../schema';
import { emailRule, normalizeEmail, PASSWORD_RULES } from '../schema/rules';
import SocialButtons from '@/shared/uiComponents/SocialButtons';
import { RegistrationData } from '../interface';
import { useRegistrationAvailability } from '../hooks/useRegistrationAvailability';
import { canContinueAfterAvailabilityCheck } from '../hooks/registrationAvailability';

interface Step1Props {
  onNext: (data: FormData) => void;
  initialData: Partial<RegistrationData>;
  onDataChange: (data: Partial<RegistrationData>) => void;
  serverErrors: Record<string, string>;
  onClearServerError: (field: string) => void;
}

export default function Step1CreateAccount({
  onNext, initialData, onDataChange, serverErrors, onClearServerError,
}: Step1Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, touchedFields },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: initialData.email || '',
      password: initialData.password || '',
      confirmPassword: initialData.confirmPassword || '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Watch fields to check if they are filled
  const email = watch('email');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const parsedEmail = email ? emailRule.safeParse(email) : null;
  const checkedEmail = parsedEmail?.success ? parsedEmail.data : undefined;
  const { status: emailAvailability, checkNow: checkEmailNow } =
    useRegistrationAvailability('email', checkedEmail);

  useEffect(() => {
    onDataChange({ email: email || '', password: password || '', confirmPassword: confirmPassword || '' });
  }, [email, password, confirmPassword, onDataChange]);

  const isFormValid = isValid
    && emailAvailability !== 'taken'
    && !serverErrors.email
    && !serverErrors.password
    && !serverErrors.confirmPassword;
  const emailMessage = errors.email?.message || serverErrors.email;
  const passwordMessage = errors.password?.message || serverErrors.password;
  const confirmPasswordMessage = errors.confirmPassword?.message || serverErrors.confirmPassword;
  const emailHintId = emailMessage ? 'signup-email-error' : undefined;
  const passwordRules = [
    ['At least 8 characters', password?.length >= PASSWORD_RULES.minLength],
    ['One uppercase letter', PASSWORD_RULES.uppercase.test(password || '')],
    ['One lowercase letter', PASSWORD_RULES.lowercase.test(password || '')],
    ['One number', PASSWORD_RULES.digit.test(password || '')],
    [`One of ${'@$!%*?&'}`, PASSWORD_RULES.special.test(password || '')],
  ] as const;
  const handleInvalid = () => {
    window.requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus();
    });
  };
  const handleAccountSubmit = async (data: FormData) => {
    const canonicalEmail = normalizeEmail(data.email);
    const canContinue = await canContinueAfterAvailabilityCheck(
      () => checkEmailNow(canonicalEmail)
    );
    if (!canContinue) return;
    onNext({ ...data, email: canonicalEmail });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6 sm:space-y-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#4a3728] to-[#8b7355] leading-tight">
          Create Account
        </h2>

        <form onSubmit={handleSubmit(handleAccountSubmit, handleInvalid)} className="space-y-5 sm:space-y-6 md:space-y-8" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email</label>
            <input
              {...register('email', {
                onChange: () => {
                  onClearServerError('email');
                },
                onBlur: (event) => {
                  const parsed = emailRule.safeParse(event.currentTarget.value);
                  if (parsed.success) void checkEmailNow(parsed.data);
                },
              })}
              id="signup-email"
              type="email"
              placeholder="Email"
              aria-invalid={!!emailMessage || emailAvailability === 'taken'}
              aria-describedby={emailHintId || (emailAvailability ? 'signup-email-availability' : undefined)}
              aria-required="true"
              suppressHydrationWarning
              className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl border text-sm ${errors.email ? 'border-red-500' : 'border-[#4a3728]'
                } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition`}
            />
            {emailMessage && (
              <p id="signup-email-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5 flex items-start gap-1">
                <span className="text-red-500">•</span>{emailMessage}
              </p>
            )}
            {!emailMessage && emailAvailability && (
              <p id="signup-email-availability" aria-live="polite" className={emailAvailability === 'taken' ? 'text-red-500 text-xs mt-1.5' : 'text-gray-600 text-xs mt-1.5'}>
                {emailAvailability === 'checking' && 'Checking...'}
                {emailAvailability === 'available' && 'Email is available.'}
                {emailAvailability === 'taken' && <>This email is already registered. <a className="underline" href="/login">Log in instead.</a></>}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <label htmlFor="signup-password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Password</label>
            <input
              {...register('password', { onChange: () => onClearServerError('password') })}
              id="signup-password"
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              aria-invalid={!!passwordMessage}
              aria-describedby={passwordMessage ? 'signup-password-error signup-password-rules' : 'signup-password-rules'}
              aria-required="true"
              className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border text-sm ${passwordMessage ? 'border-red-500' : 'border-[#4a3728]'
                } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${passwordMessage ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-2 sm:right-3 md:right-4 top-9 sm:top-10 md:top-11 text-gray-500 hover:text-gray-700 transition"
            >
              {showPass ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
            {passwordMessage && (
              <p id="signup-password-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5 flex items-start gap-1">
                <span className="text-red-500">•</span>
                {passwordMessage}
              </p>
            )}
            <ul id="signup-password-rules" aria-live="polite" className="text-xs mt-1.5 space-y-1">
              {passwordRules.map(([label, passed]) => (
                <li key={label} className={passed ? 'text-green-700' : 'text-gray-500'}>
                  {passed ? '✓' : '•'} {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label htmlFor="signup-confirm-password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Confirm Password</label>
            <input
              {...register('confirmPassword', { onChange: () => onClearServerError('confirmPassword') })}
              id="signup-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm Password"
              aria-invalid={!!confirmPasswordMessage}
              aria-describedby={confirmPasswordMessage ? 'signup-confirm-password-error' : undefined}
              aria-required="true"
              className={`w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border text-sm ${confirmPasswordMessage ? 'border-red-500' : 'border-[#4a3728]'
                } bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 ${confirmPasswordMessage ? 'focus:ring-red-500' : 'focus:ring-[#4a3728]'
                } transition`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2 sm:right-3 md:right-4 top-9 sm:top-10 md:top-11 text-gray-500 hover:text-gray-700 transition"
            >
              {showConfirm ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>

            {confirmPasswordMessage && (
              <p id="signup-confirm-password-error" role="alert" className="text-red-500 text-xs sm:text-sm mt-1.5 flex items-start gap-1">
                <span className="text-red-500">•</span>
                {confirmPasswordMessage}
              </p>
            )}
            {!confirmPasswordMessage && touchedFields.confirmPassword && confirmPassword && (
              <p aria-live="polite" className={password === confirmPassword ? 'text-green-700 text-xs mt-1.5' : 'text-red-500 text-xs mt-1.5'}>
                {password === confirmPassword ? 'Passwords match.' : 'Passwords do not match.'}
              </p>
            )}
          </div>

          {/* Next Button - Right aligned + disabled until valid */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={emailAvailability === 'taken' || !!serverErrors.email || !!serverErrors.password || !!serverErrors.confirmPassword}
              className={`
                px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-semibold transition shadow-lg text-sm sm:text-base
                ${isFormValid
                  ? 'bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white hover:opacity-90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Next
            </button>
          </div>
        </form>

        <SocialButtons />
      </div>
    </div>
  );
}