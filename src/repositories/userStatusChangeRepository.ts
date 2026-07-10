import { pool } from '@/lib/db';
import type { UserStatus } from '@/types';
import type { ResultSetHeader } from 'mysql2';

export async function record(params: {
  userId: number;
  previousStatus: UserStatus;
  newStatus: UserStatus;
  reason: string;
  changedBy: number | null;
}): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO user_status_changes (user_id, previous_status, new_status, reason, changed_by)
     VALUES (?, ?, ?, ?, ?)`,
    [params.userId, params.previousStatus, params.newStatus, params.reason, params.changedBy]
  );
}
