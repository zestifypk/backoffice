'use client';

import { useEffect, useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import type { Order } from '@/types';
import TrackButton from './TrackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function TrackingNumberModal({
  order,
  onClose,
  onSaved,
}: {
  order: Order | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValue(order?.tracking_number ?? '');
    setError('');
  }, [order]);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!order) return;
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracking_number: value.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to save tracking number');
        onSaved();
        onClose();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <Dialog open={order !== null} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Attach tracking number</DialogTitle>
          <DialogDescription>
            {order && <>For <strong>{order.reference_number}</strong> — {order.customer_name}</>}
          </DialogDescription>
        </DialogHeader>

        <form id="tracking-number-form" onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="tn-input">Tracking number</Label>
            <Input
              id="tn-input"
              autoFocus
              placeholder="Scan or type tracking number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button type="submit" form="tracking-number-form" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OutForDeliveryList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<Order | null>(null);

  function load() {
    setLoading(true);
    setError('');
    fetch('/api/orders?status=in_transit')
      .then((r) => r.json())
      .then((data) => { if (data.error) setError(data.error); else setOrders(data); })
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <Card className="shadow-sm">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold">Out for Delivery</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Click a row to attach or update its tracking number.
        </p>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Reference #</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">City</TableHead>
                <TableHead className="text-xs">Tracking #</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-destructive text-sm">{error}</TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                    No orders are out for delivery.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setTarget(o)}>
                    <TableCell className="font-mono text-xs font-semibold">{o.reference_number}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                    </TableCell>
                    <TableCell className="text-sm">{o.city}</TableCell>
                    <TableCell>
                      {o.tracking_number ? (
                        <span className="font-mono text-xs">{o.tracking_number}</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-chart-4/10 text-chart-4">
                          Add tracking #
                        </span>
                      )}
                    </TableCell>
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

      <TrackingNumberModal order={target} onClose={() => setTarget(null)} onSaved={load} />
    </Card>
  );
}
