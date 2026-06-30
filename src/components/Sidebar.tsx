'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/',       label: 'Dashboard', icon: '📊' },
  { href: '/users',  label: 'Users',     icon: '👥' },
  { href: '/access', label: 'Access',    icon: '🔐' },
];

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">
            ⚡
          </div>
          <div>
            <h1 className="text-sm font-bold">Backoffice</h1>
            <p className="text-slate-400 text-xs truncate max-w-[140px]">{userEmail}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>↩</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
