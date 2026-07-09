'use client';

import { createContext, useContext, useMemo } from 'react';

const PermissionsContext = createContext<string[]>([]);

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: React.ReactNode;
}) {
  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const permissions = useContext(PermissionsContext);
  return useMemo(
    () => ({
      permissions,
      has: (permission: string) => permissions.includes(permission),
      hasAny: (required: string[]) => required.some((p) => permissions.includes(p)),
    }),
    [permissions]
  );
}
