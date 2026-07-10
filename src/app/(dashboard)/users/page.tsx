'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  Loader2,
  UserCheck,
  UserX,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import type { User, UserStatus } from '@/types';
import { usePermissions } from '@/components/providers/permissions-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Create User Dialog ────────────────────────────────────────────────────────

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Active');
  const [role, setRole] = useState('user');

  function resetForm() {
    setName(''); setEmail(''); setPassword('');
    setStatus('Active'); setRole('user'); setError('');
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            status,
            roles: role ? [role] : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to create user');
        setOpen(false);
        resetForm();
        onCreated();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* base-ui uses render prop instead of asChild */}
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="w-4 h-4" />
        New user
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>Add a new user account to the system.</DialogDescription>
        </DialogHeader>

        <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="cu-name">Full name</Label>
            <Input
              id="cu-name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cu-email">Email</Label>
            <Input
              id="cu-email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cu-password">Password</Label>
            <Input
              id="cu-password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v ?? 'Active')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v ?? 'user')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="manager">manager</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="user-management">user-management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="create-user-form" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Reset Password Button (per-row dialog) ────────────────────────────────────

function ResetPasswordButton({ userId, userName }: { userId: number; userName: string }) {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) { setNewPassword(''); setMessage(null); }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${userId}/reset-password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to reset password');
        setMessage({ type: 'success', text: 'Password reset successfully.' });
        setNewPassword('');
      } catch (err) {
        setMessage({ type: 'error', text: (err as Error).message });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground" />}>
        <KeyRound className="w-3 h-3" />
        Reset password
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Set a new password for <strong>{userName}</strong>.</DialogDescription>
        </DialogHeader>

        <form id={`rp-form-${userId}`} onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor={`rp-pw-${userId}`}>New password</Label>
            <Input
              id={`rp-pw-${userId}`}
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
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
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={`rp-form-${userId}`} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Status toggle (per-row dialog, mandatory reason) ──────────────────────────

function StatusToggleSwitch({
  userId,
  userName,
  currentStatus,
  onChanged,
}: {
  userId: number;
  userName: string;
  currentStatus: UserStatus;
  onChanged: () => void;
}) {
  const nextStatus: UserStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  const deactivating = nextStatus === 'Inactive';

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) { setReason(''); setError(''); }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${userId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus, reason: reason.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to update status');
        setOpen(false);
        setReason('');
        onChanged();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <>
      <Switch
        checked={currentStatus === 'Active'}
        onCheckedChange={() => setOpen(true)}
        aria-label={deactivating ? `Deactivate ${userName}` : `Activate ${userName}`}
        title={deactivating ? 'Deactivate user' : 'Activate user'}
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{deactivating ? 'Deactivate' : 'Activate'} user</DialogTitle>
            <DialogDescription>
              {deactivating ? (
                <>This will prevent <strong>{userName}</strong> from logging in.</>
              ) : (
                <>This will allow <strong>{userName}</strong> to log in again.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <form id={`status-form-${userId}`} onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor={`status-reason-${userId}`}>Reason *</Label>
              <Textarea
                id={`status-reason-${userId}`}
                placeholder={`Why are you ${deactivating ? 'deactivating' : 'activating'} this user?`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={`status-form-${userId}`}
              disabled={pending || !reason.trim()}
              className={deactivating ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {deactivating ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Sort icon helper ──────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (!direction) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60" />;
  return direction === 'asc'
    ? <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
    : <ArrowDown className="ml-1.5 h-3.5 w-3.5" />;
}

// ── Column definitions ────────────────────────────────────────────────────────

function useColumns(canUpdate: boolean, onChanged: () => void): ColumnDef<User>[] {
  return useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground font-mono">#{getValue<number>()}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name <SortIcon direction={column.getIsSorted()} />
        </button>
      ),
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
      enableSorting: true,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <button
          className="flex items-center hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email <SortIcon direction={column.getIsSorted()} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">{getValue<string>()}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) =>
        getValue<string>() === 'Active' ? (
          <Badge variant="secondary" className="gap-1 text-chart-3 bg-chart-3/10 border-0">
            <UserCheck className="w-3 h-3" /> Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 text-muted-foreground bg-muted border-0">
            <UserX className="w-3 h-3" /> Inactive
          </Badge>
        ),
      filterFn: (row, _id, filterValue) =>
        filterValue === 'all' ? true : row.original.status === filterValue,
      enableSorting: false,
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ getValue }) => {
        const roles = getValue<string[]>() ?? [];
        return roles.length ? (
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <Badge key={r} variant="outline" className="text-xs font-normal">{r}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'joined',
      header: ({ column }) => (
        <button
          className="flex items-center hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Joined <SortIcon direction={column.getIsSorted()} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <ResetPasswordButton userId={row.original.id} userName={row.original.name} />
          {canUpdate && (
            <StatusToggleSwitch
              userId={row.original.id}
              userName={row.original.name}
              currentStatus={row.original.status}
              onChanged={onChanged}
            />
          )}
        </div>
      ),
      enableSorting: false,
    },
  ], [canUpdate, onChanged]);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { has } = usePermissions();
  const canCreate = has('users:create');
  const canUpdate = has('users:update');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const columns = useColumns(canUpdate, loadUsers);

  function loadUsers() {
    setLoading(true);
    setFetchError('');
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setFetchError(data.error);
        else setUsers(data);
      })
      .catch(() => setFetchError('Failed to load users'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    setColumnFilters(statusFilter === 'all' ? [] : [{ id: 'status', value: statusFilter }]);
  }, [statusFilter]);

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _colId, value: string) => {
      const q = value.toLowerCase();
      return (
        row.original.name.toLowerCase().includes(q) ||
        row.original.email.toLowerCase().includes(q)
      );
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage accounts, roles, and permissions.
          </p>
        </div>
        {canCreate && <CreateUserDialog onCreated={loadUsers} />}
      </div>

      <Card className="shadow-sm">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or email…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? 'all')}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={loadUsers}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <CardContent className="p-0">
          {fetchError ? (
            <div className="p-12 text-center text-destructive text-sm">{fetchError}</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="hover:bg-transparent">
                        {hg.headers.map((header) => (
                          <TableHead key={header.id} className="text-xs">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-40 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                          No users match your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-border">
                {loading ? (
                  <div className="p-10 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : table.getRowModel().rows.length === 0 ? (
                  <p className="p-10 text-center text-sm text-muted-foreground">
                    No users match your filters.
                  </p>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const u = row.original;
                    return (
                      <div key={u.id} className="px-4 py-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          {u.status === 'Active' ? (
                            <Badge variant="secondary" className="gap-1 text-chart-3 bg-chart-3/10 border-0 shrink-0">
                              <UserCheck className="w-3 h-3" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 text-muted-foreground bg-muted border-0 shrink-0">
                              <UserX className="w-3 h-3" /> Inactive
                            </Badge>
                          )}
                        </div>
                        {(u.roles ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(u.roles ?? []).map((r) => (
                              <Badge key={r} variant="outline" className="text-xs font-normal">{r}</Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(u.joined).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-1">
                          <ResetPasswordButton userId={u.id} userName={u.name} />
                          {canUpdate && (
                            <StatusToggleSwitch
                              userId={u.id}
                              userName={u.name}
                              currentStatus={u.status}
                              onChanged={loadUsers}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* Footer */}
          {!loading && !fetchError && (
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
                <span className="font-medium text-foreground">{users.length}</span> users
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
