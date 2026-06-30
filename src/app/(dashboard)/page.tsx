import { pool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import type { ActivityItem } from '@/types';

interface CountRow extends RowDataPacket {
  totalUsers: number;
}

async function getStats() {
  const [rows] = await pool.execute<CountRow[]>('SELECT COUNT(*) AS totalUsers FROM users');
  return {
    totalUsers: Number(rows[0]?.totalUsers ?? 0),
    revenue: 128450,
    orders: 1093,
    activeSessions: 237,
    changes: { totalUsers: 12.4, revenue: 8.1, orders: -3.2, activeSessions: 5.7 },
  };
}

const ACTIVITY: ActivityItem[] = [
  { id: 1, type: 'user',    message: 'Alice Johnson signed up',                 time: '2 min ago' },
  { id: 2, type: 'order',   message: 'New order #1093 placed ($240)',            time: '15 min ago' },
  { id: 3, type: 'alert',   message: 'Server CPU usage spiked to 87%',           time: '32 min ago' },
  { id: 4, type: 'order',   message: 'Order #1092 marked as delivered',          time: '1 hr ago' },
  { id: 5, type: 'user',    message: 'Carol White account deactivated',          time: '2 hr ago' },
  { id: 6, type: 'payment', message: 'Payout of $4,200 processed',               time: '4 hr ago' },
  { id: 7, type: 'alert',   message: 'Failed login attempt for bob@example.com', time: '5 hr ago' },
];

const TYPE_COLORS: Record<ActivityItem['type'], string> = {
  user: 'bg-blue-500',
  order: 'bg-green-500',
  alert: 'bg-red-500',
  payment: 'bg-purple-500',
};

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: 'Total Users',     value: stats.totalUsers.toLocaleString(),       change: stats.changes.totalUsers,     icon: '👥' },
    { label: 'Revenue',         value: `$${stats.revenue.toLocaleString()}`,    change: stats.changes.revenue,        icon: '💰' },
    { label: 'Orders',          value: stats.orders.toLocaleString(),           change: stats.changes.orders,         icon: '📦' },
    { label: 'Active Sessions', value: stats.activeSessions.toLocaleString(),   change: stats.changes.activeSessions, icon: '🟢' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
          >
            <div className="text-2xl mb-3">{card.icon}</div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            <p
              className={`text-xs mt-2 font-medium ${
                card.change >= 0 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {card.change >= 0 ? '▲' : '▼'} {Math.abs(card.change)}% vs last month
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Recent Activity</h3>
        <div className="space-y-4">
          {ACTIVITY.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <span
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_COLORS[item.type]}`}
              />
              <div>
                <p className="text-sm text-gray-700">{item.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
