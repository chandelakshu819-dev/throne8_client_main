import ProtectedRoute from '@/features/auth/components/ProtectedRoute';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </body>
    </html>
  );
}