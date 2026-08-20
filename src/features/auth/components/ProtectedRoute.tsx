'use client';

import { useProtectedRoute } from '@/features/auth/hooks/useAuth';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isChecking } = useProtectedRoute();

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}