import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { handleError } from '@/lib/api-helpers';
import * as orderService from '@/services/orderService';
import type { RowDataPacket } from 'mysql2';

interface CountRow extends RowDataPacket {
  totalUsers: number;
}

export async function GET() {
  try {
    const [rows] = await pool.execute<CountRow[]>('SELECT COUNT(*) AS totalUsers FROM users');
    const totalUsers = Number(rows[0]?.totalUsers ?? 0);
    const orderStats = await orderService.getOrderStats();

    return NextResponse.json({
      totalUsers,
      totalOrders: orderStats.total,
      delivered: orderStats.delivered,
      returned: orderStats.returned,
      pending: orderStats.pending,
      pendingSync: orderStats.pendingSync,
    });
  } catch (error) {
    return handleError(error);
  }
}
