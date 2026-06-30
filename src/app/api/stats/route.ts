import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { handleError } from '@/lib/api-helpers';
import type { RowDataPacket } from 'mysql2';

interface CountRow extends RowDataPacket {
  totalUsers: number;
}

export async function GET() {
  try {
    const [rows] = await pool.execute<CountRow[]>('SELECT COUNT(*) AS totalUsers FROM users');
    const totalUsers = Number(rows[0]?.totalUsers ?? 0);

    return NextResponse.json({
      totalUsers,
      revenue: 128450,
      orders: 1093,
      activeSessions: 237,
      changes: {
        totalUsers: 12.4,
        revenue: 8.1,
        orders: -3.2,
        activeSessions: 5.7,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
