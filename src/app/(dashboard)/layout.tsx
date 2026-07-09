import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/jwt';
import { DashboardShell } from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await getServerAuth();

  if (!auth) redirect('/login');

  return (
    <DashboardShell userEmail={auth.email} permissions={auth.permissions}>
      {children}
    </DashboardShell>
  );
}
