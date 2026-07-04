'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Plus, Search,
  Loader2, RefreshCw, Upload, Pencil, Trash2,
} from 'lucide-react';
import type { Order, OrderType, OrderStatus } from '@/types';
import PostexSyncPanel from './PostexSyncPanel';
import FulfillmentPanel from './FulfillmentPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

// ── Status & type config ──────────────────────────────────────────────────────

const STATUS_CFG: Record<OrderStatus, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'text-chart-4 bg-chart-4/10 border-0' },
  booked:     { label: 'Booked',     cls: 'text-chart-2 bg-chart-2/10 border-0' },
  in_transit: { label: 'In Transit', cls: 'text-primary bg-primary/10 border-0' },
  delivered:  { label: 'Delivered',  cls: 'text-chart-3 bg-chart-3/10 border-0' },
  returned:   { label: 'Returned',   cls: 'text-chart-5 bg-chart-5/10 border-0' },
  cancelled:  { label: 'Cancelled',  cls: 'text-muted-foreground bg-muted border-0' },
};

const TYPE_CFG: Record<OrderType, string> = {
  Normal:      '',
  Reversed:    'text-chart-5 bg-chart-5/10 border-0',
  Replacement: 'text-chart-4 bg-chart-4/10 border-0',
  Overland:    'text-chart-2 bg-chart-2/10 border-0',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_CFG[status];
  return <Badge variant="secondary" className={`text-xs ${c.cls}`}>{c.label}</Badge>;
}

function TypeBadge({ type }: { type: OrderType }) {
  return <Badge variant="secondary" className={`text-xs ${TYPE_CFG[type]}`}>{type}</Badge>;
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (!direction) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60" />;
  return direction === 'asc'
    ? <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
    : <ArrowDown className="ml-1.5 h-3.5 w-3.5" />;
}

// ── Shared form state ─────────────────────────────────────────────────────────

interface OrderFormState {
  reference_number: string; order_amount: string; order_detail: string;
  customer_name: string; customer_phone: string; order_address: string;
  city: string; items: string; airway_bill_copies: string; notes: string;
  address_code: string; return_address_code: string;
  order_type: OrderType; booking_weight: string; status: OrderStatus;
}

const EMPTY: OrderFormState = {
  reference_number: '', order_amount: '', order_detail: '',
  customer_name: '', customer_phone: '', order_address: '',
  city: '', items: '1', airway_bill_copies: '1', notes: '',
  address_code: '', return_address_code: '',
  order_type: 'Normal', booking_weight: '', status: 'pending',
};

function toForm(o: Order): OrderFormState {
  return {
    reference_number:    o.reference_number,
    order_amount:        String(o.order_amount),
    order_detail:        o.order_detail ?? '',
    customer_name:       o.customer_name,
    customer_phone:      o.customer_phone,
    order_address:       o.order_address,
    city:                o.city,
    items:               String(o.items),
    airway_bill_copies:  String(o.airway_bill_copies),
    notes:               o.notes ?? '',
    address_code:        o.address_code ?? '',
    return_address_code: o.return_address_code ?? '',
    order_type:          o.order_type,
    booking_weight:      o.booking_weight != null ? String(o.booking_weight) : '',
    status:              o.status,
  };
}

function formToBody(f: OrderFormState, includeStatus = false) {
  return {
    reference_number:    f.reference_number.trim(),
    order_amount:        Number(f.order_amount),
    order_detail:        f.order_detail.trim() || undefined,
    customer_name:       f.customer_name.trim(),
    customer_phone:      f.customer_phone.trim(),
    order_address:       f.order_address.trim(),
    city:                f.city.trim(),
    items:               Number(f.items) || 1,
    airway_bill_copies:  Number(f.airway_bill_copies) || 1,
    notes:               f.notes.trim() || undefined,
    address_code:        f.address_code.trim() || undefined,
    return_address_code: f.return_address_code.trim() || undefined,
    order_type:          f.order_type,
    booking_weight:      f.booking_weight ? Number(f.booking_weight) : undefined,
    ...(includeStatus && { status: f.status }),
  };
}

// ── Order form fields (shared layout) ────────────────────────────────────────

function OrderFormFields({
  formId,
  form,
  set,
  error,
  showStatus,
  onSubmit,
}: {
  formId: string;
  form: OrderFormState;
  set: (k: keyof OrderFormState, v: string) => void;
  error: string;
  showStatus: boolean;
  onSubmit: (e: React.SyntheticEvent) => void;
}) {
  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-3 pt-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-ref`}>Reference No. *</Label>
          <Input id={`${formId}-ref`} placeholder="MAT16"
            value={form.reference_number} onChange={(e) => set('reference_number', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-amount`}>Amount *</Label>
          <Input id={`${formId}-amount`} type="number" min="0" step="0.01" placeholder="599"
            value={form.order_amount} onChange={(e) => set('order_amount', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-cname`}>Customer Name *</Label>
          <Input id={`${formId}-cname`} placeholder="Abid Hussain"
            value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-cphone`}>Customer Phone *</Label>
          <Input id={`${formId}-cphone`} placeholder="00300440809"
            value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-addr`}>Order Address *</Label>
        <Input id={`${formId}-addr`} placeholder="House No. 39, Street 16, Lahore"
          value={form.order_address} onChange={(e) => set('order_address', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-city`}>City *</Label>
          <Input id={`${formId}-city`} placeholder="Lahore"
            value={form.city} onChange={(e) => set('city', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Order Type</Label>
          <Select value={form.order_type} onValueChange={(v) => set('order_type', v ?? 'Normal')}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Reversed">Reversed</SelectItem>
              <SelectItem value="Replacement">Replacement</SelectItem>
              <SelectItem value="Overland">Overland</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showStatus && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set('status', v ?? 'pending')}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-detail`}>Order Detail</Label>
        <Input id={`${formId}-detail`} placeholder="MOBILE MAT"
          value={form.order_detail} onChange={(e) => set('order_detail', e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-items`}>Items</Label>
          <Input id={`${formId}-items`} type="number" min="1"
            value={form.items} onChange={(e) => set('items', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-awb`}>AWB Copies</Label>
          <Input id={`${formId}-awb`} type="number" min="1"
            value={form.airway_bill_copies} onChange={(e) => set('airway_bill_copies', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-weight`}>Weight (kg)</Label>
          <Input id={`${formId}-weight`} type="number" min="0" step="0.01" placeholder="0.2"
            value={form.booking_weight} onChange={(e) => set('booking_weight', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-acode`}>Address Code</Label>
          <Input id={`${formId}-acode`} placeholder="1"
            value={form.address_code} onChange={(e) => set('address_code', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-rcode`}>Return Address Code</Label>
          <Input id={`${formId}-rcode`} placeholder="1"
            value={form.return_address_code} onChange={(e) => set('return_address_code', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-notes`}>Notes</Label>
        <Input id={`${formId}-notes`} placeholder="CALL PLEASE"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </form>
  );
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreateOrderModal({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void;
}) {
  const [form, setForm] = useState<OrderFormState>(EMPTY);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function set(k: keyof OrderFormState, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) { setForm(EMPTY); setError(''); }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formToBody(form, false)),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to create order');
        handleOpenChange(false);
        onCreated();
      } catch (err) { setError((err as Error).message); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New order</DialogTitle>
          <DialogDescription>Add a new PostEx order to the system.</DialogDescription>
        </DialogHeader>
        <OrderFormFields formId="co" form={form} set={set} error={error} showStatus={false} onSubmit={handleSubmit} />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button type="submit" form="co" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditOrderModal({ order, open, onOpenChange, onUpdated }: {
  order: Order | null; open: boolean; onOpenChange: (v: boolean) => void; onUpdated: () => void;
}) {
  const [form, setForm] = useState<OrderFormState>(EMPTY);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  useEffect(() => { if (order) setForm(toForm(order)); }, [order]);

  function set(k: keyof OrderFormState, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setError('');
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!order) return;
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formToBody(form, true)),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to update order');
        handleOpenChange(false);
        onUpdated();
      } catch (err) { setError((err as Error).message); }
    });
  }

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit order</DialogTitle>
          <DialogDescription>Updating <strong>{order.reference_number}</strong>.</DialogDescription>
        </DialogHeader>
        <OrderFormFields formId="eo" form={form} set={set} error={error} showStatus={true} onSubmit={handleSubmit} />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button type="submit" form="eo" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteOrderModal({ order, open, onOpenChange, onDeleted }: {
  order: Order | null; open: boolean; onOpenChange: (v: boolean) => void; onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleConfirm() {
    if (!order) return;
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to delete order');
        onOpenChange(false);
        onDeleted();
      } catch (err) { setError((err as Error).message); }
    });
  }

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setError(''); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete order</DialogTitle>
          <DialogDescription>
            Permanently delete <strong>{order.reference_number}</strong> for{' '}
            <strong>{order.customer_name}</strong>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirm} disabled={pending}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

interface UploadResult {
  total: number; created: number; skipped: number;
  errors: { row: number; reference: string; reason: string }[];
}

function UploadModal({ open, onOpenChange, onUploaded }: {
  open: boolean; onOpenChange: (v: boolean) => void; onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) { setFile(null); setResult(null); setError(''); setFileKey((k) => k + 1); }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!file) return;
    setError('');
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/orders/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Upload failed');
        setResult(data as UploadResult);
        onUploaded();
      } catch (err) { setError((err as Error).message); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload PostEx Template</DialogTitle>
          <DialogDescription>
            Upload the PostEx .xlsx booking sheet. Duplicate reference numbers are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total rows</p>
              </div>
              <div className="p-3 rounded-lg bg-chart-3/10">
                <p className="text-2xl font-bold text-chart-3">{result.created}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Created</p>
              </div>
              <div className="p-3 rounded-lg bg-chart-4/10">
                <p className="text-2xl font-bold text-chart-4">{result.skipped}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Skipped</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-36 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                <p className="text-xs font-semibold text-destructive mb-1">
                  {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} with errors
                </p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    <span className="font-medium">Row {e.row}</span> ({e.reference}): {e.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form id="upload-form" onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="upload-file">Excel file (.xlsx or .xls)</Label>
              <Input key={fileKey} id="upload-file" type="file" accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
              <p className="text-xs text-muted-foreground">
                Use the PostEx booking template with the standard 14-column layout.
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">{error}</p>
            )}
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button type="submit" form="upload-form" disabled={pending || !file}>
              {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Upload
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

function useColumns(
  onEdit: (o: Order) => void,
  onDelete: (o: Order) => void,
): ColumnDef<Order>[] {
  return useMemo<ColumnDef<Order>[]>(() => [
    {
      accessorKey: 'reference_number',
      header: ({ column }) => (
        <button className="flex items-center hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Reference <SortIcon direction={column.getIsSorted()} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-semibold">{getValue<string>()}</span>
      ),
      enableSorting: true,
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.customer_name}</p>
          <p className="text-xs text-muted-foreground">{row.original.customer_phone}</p>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'city',
      header: 'City',
      cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'order_amount',
      header: ({ column }) => (
        <button className="flex items-center hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Amount <SortIcon direction={column.getIsSorted()} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-sm font-medium">Rs. {getValue<number>().toLocaleString()}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'order_type',
      header: 'Type',
      cell: ({ getValue }) => <TypeBadge type={getValue<OrderType>()} />,
      filterFn: (row, _id, v) => v === 'all' ? true : row.original.order_type === v,
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue<OrderStatus>()} />,
      filterFn: (row, _id, v) => v === 'all' ? true : row.original.status === v,
      enableSorting: false,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <button className="flex items-center hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Created <SortIcon direction={column.getIsSorted()} />
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => onEdit(row.original)} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon"
            className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(row.original)} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ], [onEdit, onDelete]);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [tab, setTab] = useState<'local' | 'fulfillment' | 'postex'>('local');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const columns = useColumns(
    (o) => setEditTarget(o),
    (o) => setDeleteTarget(o),
  );

  function loadOrders() {
    setLoading(true);
    setFetchError('');
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => { if (data.error) setFetchError(data.error); else setOrders(data); })
      .catch(() => setFetchError('Failed to load orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    const filters: ColumnFiltersState = [];
    if (statusFilter !== 'all') filters.push({ id: 'status', value: statusFilter });
    if (typeFilter !== 'all') filters.push({ id: 'order_type', value: typeFilter });
    setColumnFilters(filters);
  }, [statusFilter, typeFilter]);

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _colId, value: string) => {
      const q = value.toLowerCase();
      return (
        row.original.reference_number.toLowerCase().includes(q) ||
        row.original.customer_name.toLowerCase().includes(q) ||
        row.original.customer_phone.includes(q)
      );
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage PostEx courier orders — create, track, and bulk upload.
          </p>
        </div>
        {tab === 'local' && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" />
              Upload Excel
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New order
            </Button>
          </div>
        )}
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('local')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === 'local' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => setTab('fulfillment')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === 'fulfillment' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Fulfillment
        </button>
        <button
          type="button"
          onClick={() => setTab('postex')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === 'postex' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sync from PostEx
        </button>
      </div>

      {tab === 'fulfillment' && <FulfillmentPanel />}

      {tab === 'postex' && <PostexSyncPanel />}

      {tab === 'local' && (
      <Card className="shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input placeholder="Search by reference, name or phone…"
              value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Reversed">Reversed</SelectItem>
              <SelectItem value="Replacement">Replacement</SelectItem>
              <SelectItem value="Overland">Overland</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={loadOrders} disabled={loading} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <CardContent className="p-0">
          {fetchError ? (
            <div className="p-12 text-center text-destructive text-sm">{fetchError}</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id} className="hover:bg-transparent">
                        {hg.headers.map((h) => (
                          <TableHead key={h.id} className="text-xs">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-40 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                          No orders match your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden divide-y divide-border">
                {loading ? (
                  <div className="p-10 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : table.getRowModel().rows.length === 0 ? (
                  <p className="p-10 text-center text-sm text-muted-foreground">No orders match your filters.</p>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const o = row.original;
                    return (
                      <div key={o.id} className="px-4 py-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs font-semibold">{o.reference_number}</p>
                            <p className="text-sm font-medium mt-0.5">{o.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                          </div>
                          <StatusBadge status={o.status} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <TypeBadge type={o.order_type} />
                          <span className="text-xs text-muted-foreground">{o.city}</span>
                          <span className="text-xs font-semibold ml-auto">
                            Rs. {o.order_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                              onClick={() => setEditTarget(o)}>
                              <Pencil className="h-3 w-3" />Edit
                            </Button>
                            <Button variant="ghost" size="sm"
                              className="h-7 gap-1 text-xs text-destructive/70 hover:text-destructive"
                              onClick={() => setDeleteTarget(o)}>
                              <Trash2 className="h-3 w-3" />Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {!loading && !fetchError && (
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
                <span className="font-medium text-foreground">{orders.length}</span> orders
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <CreateOrderModal open={createOpen} onOpenChange={setCreateOpen} onCreated={loadOrders} />
      <EditOrderModal
        order={editTarget}
        open={editTarget !== null}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        onUpdated={loadOrders}
      />
      <DeleteOrderModal
        order={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        onDeleted={loadOrders}
      />
      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={loadOrders} />
    </div>
  );
}
