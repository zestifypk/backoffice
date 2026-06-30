import { NextResponse } from 'next/server';

const activity = [
  { id: 1, type: 'user',    message: 'Alice Johnson signed up',                 time: '2 min ago' },
  { id: 2, type: 'order',   message: 'New order #1093 placed ($240)',            time: '15 min ago' },
  { id: 3, type: 'alert',   message: 'Server CPU usage spiked to 87%',           time: '32 min ago' },
  { id: 4, type: 'order',   message: 'Order #1092 marked as delivered',          time: '1 hr ago' },
  { id: 5, type: 'user',    message: 'Carol White account deactivated',          time: '2 hr ago' },
  { id: 6, type: 'payment', message: 'Payout of $4,200 processed',               time: '4 hr ago' },
  { id: 7, type: 'alert',   message: 'Failed login attempt for bob@example.com', time: '5 hr ago' },
];

export async function GET() {
  return NextResponse.json(activity);
}
