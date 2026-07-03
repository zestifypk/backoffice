'use client';

import { useState, useTransition } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to change password');
        setMessage({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (err) {
        setMessage({ type: 'error', text: (err as Error).message });
      }
    });
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences.</p>
      </div>

      <Card className="shadow-sm max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Change password</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Update your login password. You will stay logged in.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Current password</Label>
              <Input
                id="current-pw"
                type="password"
                placeholder="Your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-pw">New password</Label>
              <Input
                id="new-pw"
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirm new password</Label>
              <Input
                id="confirm-pw"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <p className={`text-sm rounded-md px-3 py-2 border ${
                message.type === 'success'
                  ? 'text-chart-3 bg-chart-3/10 border-chart-3/30'
                  : 'text-destructive bg-destructive/10 border-destructive/30'
              }`}>
                {message.text}
              </p>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
