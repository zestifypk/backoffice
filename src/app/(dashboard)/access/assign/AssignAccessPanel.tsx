'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Loader2, Check, CheckCircle2, XCircle } from 'lucide-react';
import type { User, Role, Permission } from '@/types';
import { usePermissions } from '@/components/providers/permissions-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Feedback = { type: 'success' | 'error'; text: string } | null;

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Badge
      variant={selected ? 'default' : 'outline'}
      render={<button type="button" onClick={onClick} />}
      className="cursor-pointer gap-1 font-mono font-normal"
    >
      {selected && <Check className="w-3 h-3" />}
      {label}
    </Badge>
  );
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return feedback.type === 'success' ? (
    <p className="flex items-center gap-1.5 text-sm rounded-md px-3 py-2 border text-chart-3 bg-chart-3/10 border-chart-3/30">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {feedback.text}
    </p>
  ) : (
    <p className="flex items-center gap-1.5 text-sm rounded-md px-3 py-2 border text-destructive bg-destructive/10 border-destructive/30">
      <XCircle className="h-4 w-4 shrink-0" />
      {feedback.text}
    </p>
  );
}

export default function AssignAccessPanel({
  roles,
  permissions,
}: {
  roles: Role[];
  permissions: Permission[];
}) {
  const { has } = usePermissions();
  const canAssignRoles = has('users:assign-role');
  const canAssignPermissions = has('users:assign-permission');

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [rolesPending, startRolesTransition] = useTransition();
  const [permissionsPending, startPermissionsTransition] = useTransition();
  const [roleFeedback, setRoleFeedback] = useState<Feedback>(null);
  const [permissionFeedback, setPermissionFeedback] = useState<Feedback>(null);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setUsersError(data.error);
        else setUsers(data);
      })
      .catch(() => setUsersError('Failed to load users'))
      .finally(() => setUsersLoading(false));
  }, []);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  function handleSelectUser(value: string | null) {
    const id = value ? Number(value) : null;
    setSelectedUserId(id);
    setRoleFeedback(null);
    setPermissionFeedback(null);
    const user = users.find((u) => u.id === id) ?? null;
    setSelectedRoles(user?.roles ?? []);
    setSelectedPermissions(user?.directPermissions ?? []);
  }

  function toggleRole(name: string) {
    setSelectedRoles((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]
    );
  }

  function togglePermission(name: string) {
    setSelectedPermissions((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }

  function applyUpdatedUser(updated: User) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setSelectedRoles(updated.roles ?? []);
    setSelectedPermissions(updated.directPermissions ?? []);
  }

  function handleSaveRoles() {
    if (!selectedUser) return;
    setRoleFeedback(null);
    startRolesTransition(async () => {
      try {
        const res = await fetch(`/api/users/${selectedUser.id}/roles`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roles: selectedRoles }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to assign roles');
        applyUpdatedUser(data as User);
        setRoleFeedback({ type: 'success', text: `Roles updated for ${selectedUser.name}.` });
      } catch (err) {
        setRoleFeedback({ type: 'error', text: (err as Error).message });
      }
    });
  }

  function handleSavePermissions() {
    if (!selectedUser) return;
    setPermissionFeedback(null);
    startPermissionsTransition(async () => {
      try {
        const res = await fetch(`/api/users/${selectedUser.id}/permissions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: selectedPermissions }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to assign permissions');
        applyUpdatedUser(data as User);
        setPermissionFeedback({ type: 'success', text: `Direct permissions updated for ${selectedUser.name}.` });
      } catch (err) {
        setPermissionFeedback({ type: 'error', text: (err as Error).message });
      }
    });
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2 max-w-sm">
          <Label>User</Label>
          {usersError ? (
            <p className="text-sm text-destructive">{usersError}</p>
          ) : (
            <Select
              value={selectedUserId ? String(selectedUserId) : ''}
              onValueChange={handleSelectUser}
              disabled={usersLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() =>
                    selectedUser
                      ? `${selectedUser.name} (${selectedUser.email})`
                      : usersLoading
                        ? 'Loading users…'
                        : 'Select a user'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {!selectedUser ? (
          <p className="text-sm text-muted-foreground">Select a user above to manage their roles and permissions.</p>
        ) : !canAssignRoles && !canAssignPermissions ? (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to assign roles or permissions.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
            {/* Roles */}
            {canAssignRoles && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Roles</Label>
                <Button size="sm" className="h-7 gap-1.5" onClick={handleSaveRoles} disabled={rolesPending}>
                  {rolesPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save roles
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((role) => (
                  <ToggleChip
                    key={role.id}
                    label={role.name}
                    selected={selectedRoles.includes(role.name)}
                    onClick={() => toggleRole(role.name)}
                  />
                ))}
              </div>
              <FeedbackBanner feedback={roleFeedback} />
            </div>
            )}

            {/* Direct permissions */}
            {canAssignPermissions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Direct permissions</Label>
                <Button size="sm" className="h-7 gap-1.5" onClick={handleSavePermissions} disabled={permissionsPending}>
                  {permissionsPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save permissions
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Granted directly, bypassing roles. Permissions inherited from roles aren&apos;t shown here.
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {permissions.map((perm) => (
                  <ToggleChip
                    key={perm.id}
                    label={perm.name}
                    selected={selectedPermissions.includes(perm.name)}
                    onClick={() => togglePermission(perm.name)}
                  />
                ))}
              </div>
              <FeedbackBanner feedback={permissionFeedback} />
            </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
