import Link from 'next/link';
import * as roleRepository from '@/repositories/roleRepository';
import * as permissionRepository from '@/repositories/permissionRepository';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AssignAccessPanel from './AssignAccessPanel';

export default async function AssignAccessPage() {
  const [roles, permissions] = await Promise.all([
    roleRepository.listRoles(),
    permissionRepository.listPermissions(),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2.5 mb-2 text-muted-foreground hover:text-foreground"
          render={<Link href="/access" />}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Access Control
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Assign Access</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Grant roles or direct permissions to a specific user.
        </p>
      </div>

      <AssignAccessPanel roles={roles} permissions={permissions} />
    </div>
  );
}
