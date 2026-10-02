'use client';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import config from '@/config/env.config';
import AuthService from '@/lib/api/auth.service';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/core/store/store.hooks';
import { checkAuthStatus } from '@/hooks/auth';

export default function SocialButtons() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      const idToken = credentialResponse.credential;
      if (!idToken) {
        throw new Error('No credential token received from Google.');
      }

      console.log('🔐 [GOOGLE] Verifying idToken with backend...');
      const response = await AuthService.googleVerify(idToken);

      // Sync Redux state
      dispatch(checkAuthStatus());

      if (response?.data?.isNewUser) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('google_id_token', idToken);
        }
        router.push('/onboarding/o-auth');
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('google_id_token');
        }
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ [GOOGLE] Login failed:', error);
      setApiError(error.message || 'Google login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    console.error('❌ [GOOGLE] Login failed or cancelled');
    setApiError('Google sign-in was unsuccessful or cancelled.');
  };

  const getApiUrl = () => {
    return config.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
  };

  const handleGitHubLogin = () => {
    try {
      setIsSubmitting(true);
      const apiUrl = getApiUrl();
      window.location.href = `${apiUrl}/auth/github`;
    } catch (error) {
      console.error('❌ [GITHUB] OAuth initiation failed:', error);
      setApiError('Failed to initiate GitHub login. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center my-8">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-gray-500 text-sm">or continue with</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>
      {apiError && (
        <p className="text-red-500 text-sm text-center mb-3">{apiError}</p>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <div className="flex-1 w-full flex justify-center items-center overflow-hidden">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            shape="rectangular"
            theme="outline"
            size="large"
            text="continue_with"
          />
        </div>
        <button
          type="button"
          onClick={handleGitHubLogin}
          disabled={isSubmitting}
          className="flex-1 w-full flex items-center justify-center gap-2 sm:gap-3 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 transition text-sm font-medium text-black min-h-[40px] shadow-sm"
        >
          <FaGithub className="text-xl text-gray-900" />
          <span>GitHub</span>
        </button>
      </div>
    </>
  );
}