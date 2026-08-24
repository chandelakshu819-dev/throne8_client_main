'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AuthService from '@/lib/api/auth.service';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../hooks/useLogin';
import { LoginFormData, loginSchema } from '../schema';




export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);


  const {
    login,
    loading,
    error: apiError,
    rememberMe,
    updateRememberMe,
    clearLoginError
  } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearLoginError(); // Clear previous errors

      // console.log('🚀 [FORM] Login attempt:', data.email);

      // ✅ Call Redux login thunk
      await login({
        email: data.email,
        password: data.password,
        rememberMe,
      });

      // console.log('✅ [FORM] Login successful, redirecting...');

      // Small delay for localStorage write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refresh and navigate
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 50));
      router.push('/dashboard');

    } catch (error: any) {
      // Error is already in Redux state, no need to set manually
      console.error('❌ [FORM] Login failed:', error);
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* ==================== API ERROR MESSAGE ==================== */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm">
          <p className="font-medium">{apiError}</p>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
          Email
        </label>
        <input
          id="email"
          {...register('email')}
          type="email"
          placeholder="your@email.com"
          className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl border border-[#4a3728] bg-white text-black placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a3728] focus:border-transparent transition"
        />
        {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1.5">{errors.email.message}</p>}
      </div>

      {/* Password Field with Eye Icon */}
      <div className="relative">
        <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
          Password
        </label>
        <input
          id="password"
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          className="w-full px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border border-[#4a3728] bg-white text-black placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a3728] focus:border-transparent transition"
        />
        {/* Eye Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 sm:right-3 top-9 sm:top-10 md:top-11 text-gray-500 hover:text-gray-700 transition"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
        </button>
        {errors.password && <p className="text-red-500 text-xs sm:text-sm mt-1.5">{errors.password.message}</p>}
      </div>

      {/* Remember Me + Forgot Password */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => updateRememberMe(e.target.checked)}
            className="rounded text-[#4a3728] focus:ring-[#4a3728] h-3.5 w-3.5 sm:h-4 sm:w-4"
          />
          <span className="text-gray-600 text-xs sm:text-sm">Remember me</span>
        </label>
        <Link href="/forgot-my-password" className="text-[#4a3728] font-medium hover:underline transition text-xs sm:text-sm">
          Forgot Password?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-semibold transition shadow-lg text-sm sm:text-base
            ${rememberMe
            ? 'bg-gradient-to-r from-[#4a3728] to-[#8b7355] text-white hover:opacity-90'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
    ${loading ? 'opacity-70' : ''}
  `}
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>

      {/* Helpful message */}
      {/* {!rememberMe} */}
    </form>
  );
}
