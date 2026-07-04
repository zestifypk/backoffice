'use client';

import { useState } from 'react';
import OutForDeliveryList from './OutForDeliveryList';
import ScanStatusPanel from './ScanStatusPanel';

type FulfillmentTab = 'out_for_delivery' | 'delivered' | 'returned';

const TABS: { key: FulfillmentTab; label: string }[] = [
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'returned', label: 'Returned' },
];

export default function FulfillmentPanel() {
  const [tab, setTab] = useState<FulfillmentTab>('out_for_delivery');

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'out_for_delivery' && <OutForDeliveryList />}
      {tab === 'delivered' && <ScanStatusPanel status="delivered" label="Delivered" />}
      {tab === 'returned' && <ScanStatusPanel status="returned" label="Returned" />}
    </div>
  );
}
