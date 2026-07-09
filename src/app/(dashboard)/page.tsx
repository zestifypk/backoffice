import * as orderService from '@/services/orderService';
import type { ActivityItem } from '@/types';
import {
  ShoppingBag,
  PackageCheck,
  PackageX,
  Clock,
  RefreshCw,
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

async function getStats() {
  return orderService.getOrderStats();
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
      label: 'Total Orders',
      value: stats.total.toLocaleString(),
      icon: ShoppingBag,
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      label: 'Delivered',
      value: stats.delivered.toLocaleString(),
      icon: PackageCheck,
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      label: 'Returned',
      value: stats.returned.toLocaleString(),
      icon: PackageX,
      color: 'text-chart-5',
      bg: 'bg-chart-5/10',
    },
    {
      label: 'Pending',
      value: stats.pending.toLocaleString(),
      icon: Clock,
      color: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      label: 'Pending Sync',
      value: stats.pendingSync.toLocaleString(),
      icon: RefreshCw,
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Welcome back — here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
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
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
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
