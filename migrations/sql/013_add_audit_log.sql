-- Generic, cross-cutting audit trail. Rolled out to two actions for now:
-- login attempts (auth.login_succeeded / auth.login_failed) and PostEx tracking
-- sync (orders.synced). Designed to extend to more actions later without a
-- schema change — metadata_json carries whatever context a given action needs.

CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT       NULL,
  actor_email   VARCHAR(255) NULL,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50)  NULL,
  entity_id     VARCHAR(100) NULL,
  metadata_json JSON         NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_audit_log_actor (actor_user_id),
  KEY idx_audit_log_action (action),
  KEY idx_audit_log_entity (entity_type, entity_id),
  KEY idx_audit_log_created_at (created_at),

  CONSTRAINT fk_audit_log_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
