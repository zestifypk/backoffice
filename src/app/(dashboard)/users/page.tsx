'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setUsers(data);
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(userId: number, roleName: string) {
    setAssigning(userId);
    try {
      const res = await fetch(`/api/users/${userId}/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to assign role');
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <span className="text-sm text-gray-500">{users.length} total</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading users…</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 text-sm">{error}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  #
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  Joined
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">
                  Assign Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4 text-gray-400 text-xs">{user.id}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-900">{user.name}</td>
                  <td className="py-3.5 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">
                    {new Date(user.joined).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      disabled={assigning === user.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      defaultValue=""
                      className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="" disabled>
                        Assign…
                      </option>
                      <option value="admin">admin</option>
                      <option value="manager">manager</option>
                      <option value="user">user</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
