-- History of Active/Inactive toggles, with the mandatory reason an admin gave.
-- Kept as its own table (not the generic audit_log) so it's directly queryable
-- per-user without JSON parsing: SELECT * FROM user_status_changes WHERE user_id = ?

CREATE TABLE IF NOT EXISTS user_status_changes (
  id              BIGINT      NOT NULL AUTO_INCREMENT,
  user_id         BIGINT      NOT NULL,
  previous_status ENUM('Active', 'Inactive') NOT NULL,
  new_status      ENUM('Active', 'Inactive') NOT NULL,
  reason          TEXT        NOT NULL,
  changed_by      BIGINT      NULL,
  created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_user_status_changes_user (user_id),

  CONSTRAINT fk_user_status_changes_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_status_changes_changed_by
    FOREIGN KEY (changed_by) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
