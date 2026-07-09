import * as roleRepository from '@/repositories/roleRepository';
import * as permissionRepository from '@/repositories/permissionRepository';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ShieldCheck, Key, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getServerAuth } from '@/lib/jwt';

export default async function AccessPage() {
  const [roles, permissions, auth] = await Promise.all([
    roleRepository.listRoles(),
    permissionRepository.listPermissions(),
    getServerAuth(),
  ]);
  const canAssign = auth?.permissions.some(
    (p) => p === 'users:assign-role' || p === 'users:assign-permission'
  ) ?? false;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Access Control</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Roles and permissions assigned across the system.
          </p>
        </div>
        {canAssign && (
          <Button size="sm" className="gap-1.5" render={<Link href="/access/assign" />}>
            <UserCog className="w-4 h-4" />
            Assign to user
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Roles</CardTitle>
              </div>
              <Badge variant="secondary">{roles.length}</Badge>
            </div>
            <CardDescription>Groups of permissions assigned to users.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {role.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {role.description ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Permissions</CardTitle>
              </div>
              <Badge variant="secondary">{permissions.length}</Badge>
            </div>
            <CardDescription>Granular capabilities that can be granted to roles or users.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Key</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-primary">
                        {perm.name}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {perm.description ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
