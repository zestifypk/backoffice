'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { Order } from '@/types';
import TrackButton from './TrackButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ScanFeedback {
  type: 'success' | 'error';
  text: string;
}

export default function ScanStatusPanel({
  status,
  label,
}: {
  status: 'delivered' | 'returned';
  label: string;
}) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [pending, startTransition] = useTransition();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    setListError('');
    fetch(`/api/orders?status=${status}`)
      .then((r) => r.json())
      .then((data) => { if (data.error) setListError(data.error); else setOrders(data); })
      .catch(() => setListError('Failed to load orders'))
      .finally(() => setLoading(false));
  }

  function focusInput() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  useEffect(() => {
    load();
    setFeedback(null);
    focusInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const value = trackingNumber.trim();
    if (!value || pending) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/orders/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingNumber: value, status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to update order');
        const order = data as Order;
        setFeedback({ type: 'success', text: `${order.reference_number} — ${order.customer_name} marked ${label}.` });
        setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
      } catch (err) {
        setFeedback({ type: 'error', text: (err as Error).message });
      } finally {
        setTrackingNumber('');
        focusInput();
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`scan-${status}`}>Scan or type tracking number</Label>
              <Input
                id={`scan-${status}`}
                ref={inputRef}
                autoFocus
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Tracking number, then Enter"
                disabled={pending}
                className="font-mono"
              />
            </div>
            {pending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-2 shrink-0" />}
          </form>

          {feedback && (
            <p
              className={`mt-3 flex items-center gap-1.5 text-sm rounded-md px-3 py-2 border ${
                feedback.type === 'success'
                  ? 'text-chart-3 bg-chart-3/10 border-chart-3/30'
                  : 'text-destructive bg-destructive/10 border-destructive/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              {feedback.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">{label} orders</h3>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Tracking #</TableHead>
                  <TableHead className="text-xs">Reference #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">City</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : listError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-destructive text-sm">{listError}</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                      No {label.toLowerCase()} orders yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.tracking_number}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{o.reference_number}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{o.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                      </TableCell>
                      <TableCell className="text-sm">{o.city}</TableCell>
                      <TableCell className="text-sm font-medium">Rs. {o.order_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <TrackButton trackingNumber={o.tracking_number} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
