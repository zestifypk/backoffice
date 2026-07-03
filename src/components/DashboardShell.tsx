'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users',     label: 'Users',     icon: Users },
  { href: '/access',    label: 'Access',    icon: ShieldCheck },
  { href: '/settings',  label: 'Settings',  icon: Settings },
];

function NavContent({
  userEmail,
  pathname,
  onLogout,
  onNavigate,
}: {
  userEmail: string;
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-sm shadow-primary/40">
          <ShieldCheck className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none">Backoffice</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{userEmail}</p>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator className="opacity-50" />

      {/* Bottom: theme toggle + logout */}
      <div className="p-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}

export function DashboardShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col shrink-0 border-r border-border bg-sidebar">
        <NavContent
          userEmail={userEmail}
          pathname={pathname}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-background shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Backoffice</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile slide-over */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0 bg-sidebar border-sidebar-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <NavContent
            userEmail={userEmail}
            pathname={pathname}
            onLogout={handleLogout}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
