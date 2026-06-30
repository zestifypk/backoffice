import * as roleRepository from '@/repositories/roleRepository';
import * as permissionRepository from '@/repositories/permissionRepository';

export default async function AccessPage() {
  const [roles, permissions] = await Promise.all([
    roleRepository.listRoles(),
    permissionRepository.listPermissions(),
  ]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Access Control</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Roles</h3>
            <p className="text-xs text-gray-400 mt-0.5">{roles.length} total</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="py-3 px-4 font-medium text-gray-900">{role.name}</td>
                  <td className="py-3 px-4 text-gray-500">{role.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Permissions</h3>
            <p className="text-xs text-gray-400 mt-0.5">{permissions.length} total</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {permissions.map((perm) => (
                <tr key={perm.id}>
                  <td className="py-3 px-4 font-mono text-xs font-medium text-blue-600">
                    {perm.name}
                  </td>
                  <td className="py-3 px-4 text-gray-500">{perm.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
