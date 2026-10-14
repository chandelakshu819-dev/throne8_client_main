// src/app/(auth)/login/page.tsx
import Link from 'next/link';
import AuthLayout from '@/features/auth/components/layout/AuthLayout';
import AuthRightContainer from '@/features/auth/components/layout/AuthRightContainer';
import LoginForm from '@/features/auth/components/LoginForm';
import AuthHeader from '@/shared/uiComponents/AuthHeader';
import SocialButtons from '@/shared/uiComponents/SocialButtons';

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthRightContainer>
        <AuthHeader />
        <LoginForm />
        <SocialButtons />
        <p className="relative z-20 pointer-events-auto text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            prefetch={false}
            className="text-[#4a3728] font-semibold hover:underline cursor-pointer"
          >
            Create a New Account
          </Link>
        </p>
      </AuthRightContainer>
    </AuthLayout>
  );
}