import { pool } from '@/lib/db';
import logger from '@/lib/logger';
import type { ResultSetHeader } from 'mysql2';

const log = logger.child({ module: 'auditLogRepository' });

export interface AuditLogEntry {
  actorUserId: number | null;
  actorEmail?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Best-effort: failures are logged, never thrown. An audit-log write should
 * never be the reason a login or a sync request fails for the user.
 */
export async function record(entry: AuditLogEntry): Promise<void> {
  try {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO audit_log (actor_user_id, actor_email, action, entity_type, entity_id, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry.actorUserId,
        entry.actorEmail ?? null,
        entry.action,
        entry.entityType ?? null,
        entry.entityId ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ]
    );
  } catch (err) {
    log.error({ err, action: entry.action }, 'Failed to write audit log entry');
  }
}
