import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const auth = token ? await verifyToken(token) : null;

  if (!auth) redirect('/login');

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar userEmail={auth.email} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
