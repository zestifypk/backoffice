import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import { DashboardShell } from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const auth = token ? await verifyToken(token) : null;

  if (!auth) redirect('/login');

  return <DashboardShell userEmail={auth.email}>{children}</DashboardShell>;
}
