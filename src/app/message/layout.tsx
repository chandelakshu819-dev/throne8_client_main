import AppShell from '@/shared/uiComponents/AppShell';

export default function MessageLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}