import { pool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import type { ActivityItem } from '@/types';
import {
  Users,
  DollarSign,
  ShoppingBag,
  Activity,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Package,
  TriangleAlert,
  CreditCard,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CountRow extends RowDataPacket { totalUsers: number }

async function getStats() {
  const [rows] = await pool.execute<CountRow[]>('SELECT COUNT(*) AS totalUsers FROM users WHERE deleted_at IS NULL');
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

const ACTIVITY_ICONS: Record<ActivityItem['type'], React.ElementType> = {
  user:    UserPlus,
  order:   Package,
  alert:   TriangleAlert,
  payment: CreditCard,
};

const ACTIVITY_COLORS: Record<ActivityItem['type'], string> = {
  user:    'text-chart-1',
  order:   'text-chart-3',
  alert:   'text-chart-5',
  payment: 'text-chart-2',
};

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: stats.changes.totalUsers,
      icon: Users,
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      label: 'Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      change: stats.changes.revenue,
      icon: DollarSign,
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      label: 'Orders',
      value: stats.orders.toLocaleString(),
      change: stats.changes.orders,
      icon: ShoppingBag,
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
    {
      label: 'Active Sessions',
      value: stats.activeSessions.toLocaleString(),
      change: stats.changes.activeSessions,
      icon: Activity,
      color: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Welcome back — here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.change >= 0;
          return (
            <Card key={card.label} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">
                  {card.label}
                </CardDescription>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-bold">{card.value}</p>
                <div className="flex items-center gap-1">
                  {isPositive
                    ? <TrendingUp className="w-3 h-3 text-chart-3" />
                    : <TrendingDown className="w-3 h-3 text-chart-5" />}
                  <span className={`text-xs font-medium ${isPositive ? 'text-chart-3' : 'text-chart-5'}`}>
                    {isPositive ? '+' : ''}{card.change}% vs last month
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity feed */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Badge variant="secondary">{ACTIVITY.length} events</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {ACTIVITY.map((item) => {
              const Icon = ACTIVITY_ICONS[item.type];
              return (
                <div key={item.id} className="flex items-start gap-3 px-6 py-3.5">
                  <div className={`mt-0.5 shrink-0 ${ACTIVITY_COLORS[item.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
