'use client';

import { useMemo, useState, useTransition } from 'react';
import { RefreshCw, Loader2, DownloadCloud, Search } from 'lucide-react';
import type { PostExOrder } from '@/lib/schemas';
import { POSTEX_ORDER_STATUSES } from '@/lib/postex';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PostexSyncPanel() {
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [orderStatusId, setOrderStatusId] = useState('0');

  const [orders, setOrders] = useState<PostExOrder[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [trackingSearch, setTrackingSearch] = useState('');

  const filteredOrders = useMemo(() => {
    const q = trackingSearch.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.trackingNumber.toLowerCase().includes(q));
  }, [orders, trackingSearch]);

  function handleFetch(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        const params = new URLSearchParams({ startDate, endDate, orderStatusId });
        const res = await fetch(`/api/orders/postex?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to fetch orders from PostEx');
        setOrders(data as PostExOrder[]);
        setTrackingSearch('');
        setHasFetched(true);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <Card className="shadow-sm">
      <form onSubmit={handleFetch} className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 border-b border-border">
        <div className="space-y-1.5">
          <Label htmlFor="px-start">Start date</Label>
          <Input
            id="px-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="px-end">End date</Label>
          <Input
            id="px-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Order status</Label>
          <Select value={orderStatusId} onValueChange={(v) => setOrderStatusId(v ?? '0')}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue>
                {(value: string) =>
                  POSTEX_ORDER_STATUSES.find((s) => String(s.id) === value)?.label ?? 'All'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {POSTEX_ORDER_STATUSES.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 sm:ml-auto">
          <Button type="submit" size="sm" className="gap-1.5" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Fetch
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled title="Coming soon">
            <DownloadCloud className="h-4 w-4" />
            Sync
          </Button>
        </div>
      </form>

      {hasFetched && !error && (
        <div className="p-4 border-b border-border">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by tracking number…"
              value={trackingSearch}
              onChange={(e) => setTrackingSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {error ? (
          <div className="p-12 text-center text-destructive text-sm">{error}</div>
        ) : !hasFetched ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Choose a date range and click Fetch to pull orders from PostEx.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Tracking #</TableHead>
                  <TableHead className="text-xs">Reference #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">City</TableHead>
                  <TableHead className="text-xs">Detail</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-sm">
                      {orders.length === 0
                        ? 'No orders found for this date range and status.'
                        : 'No orders match that tracking number.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((o) => (
                    <TableRow key={o.trackingNumber}>
                      <TableCell className="font-mono text-xs">{o.trackingNumber}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{o.orderRefNumber}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{o.customerName}</p>
                        <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                      </TableCell>
                      <TableCell className="text-sm">{o.cityName}</TableCell>
                      <TableCell className="text-sm">{o.orderDetail}</TableCell>
                      <TableCell className="text-sm font-medium">
                        Rs. {o.invoicePayment.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {o.transactionStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(o.transactionDate).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {hasFetched && !error && (
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredOrders.length}</span> of{' '}
              <span className="font-medium text-foreground">{orders.length}</span> order
              {orders.length !== 1 ? 's' : ''} from PostEx.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
