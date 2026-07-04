'use client';

import { useState } from 'react';
import { Loader2, Radar } from 'lucide-react';
import type { PostExTrackOrder } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Human label per PostEx status code — unrecognized codes fall back to PostEx's own message.
const STATUS_CODE_LABEL: Record<string, string> = {
  '0001': "At Merchant's Warehouse",
  '0002': 'Returned',
  '0003': 'At PostEx Warehouse',
  '0004': 'Package on Root',
  '0005': 'Delivered',
  '0006': 'Returned',
  '0007': 'Returned',
  '0008': 'Delivery Under Review',
  '0013': 'Attempt Made',
};

// Dot color per PostEx status code — unrecognized codes fall back to a neutral dot.
const STATUS_CODE_DOT: Record<string, string> = {
  '0001': 'bg-primary',
  '0002': 'bg-chart-5',
  '0003': 'bg-primary',
  '0004': 'bg-primary',
  '0005': 'bg-chart-3',
  '0006': 'bg-chart-5',
  '0007': 'bg-chart-5',
  '0008': 'bg-chart-4',
  '0013': 'bg-chart-4',
};

export default function TrackButton({ trackingNumber }: { trackingNumber: string | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<PostExTrackOrder | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!trackingNumber) return;

    setOpen(true);
    setLoading(true);
    setError('');
    setData(null);

    fetch(`/api/orders/postex/track/${encodeURIComponent(trackingNumber)}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Failed to fetch tracking status');
        setData(body as PostExTrackOrder);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleClick}
        disabled={!trackingNumber}
        title={trackingNumber ? 'Track with PostEx' : 'No tracking number yet'}
      >
        <Radar className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>PostEx tracking</DialogTitle>
            <DialogDescription>Tracking # {trackingNumber}</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
              {error}
            </p>
          ) : data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{data.customerName}</p>
                  <p className="text-xs text-muted-foreground">{data.cityName}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                  {data.transactionStatus}
                </span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {[...data.transactionStatusHistory].reverse().map((h, i) => (
                  <div key={`${h.transactionStatusMessageCode}-${h.updatedAt}-${i}`} className="flex items-start gap-2 text-sm">
                    <div
                      className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                        STATUS_CODE_DOT[h.transactionStatusMessageCode] ?? 'bg-muted-foreground/40'
                      }`}
                    />
                    <div>
                      <p className={i === 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {STATUS_CODE_LABEL[h.transactionStatusMessageCode] ?? h.transactionStatusMessage}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
