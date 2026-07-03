-- Soft-delete support on users
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Direct user-to-permission assignments (bypasses role hierarchy)
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id     BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission_id),
  CONSTRAINT fk_user_perms_user FOREIGN KEY (user_id)       REFERENCES users (id)       ON DELETE CASCADE,
  CONSTRAINT fk_user_perms_perm FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

-- User-management permissions
INSERT IGNORE INTO permissions (name, description) VALUES
  ('user_read',   'View user list and individual user details'),
  ('user_create', 'Create new users'),
  ('user_update', 'Update user details, roles, and direct permissions'),
  ('user_delete', 'Permanently delete users');

-- UserManagement role
INSERT IGNORE INTO roles (name, description) VALUES
  ('UserManagement', 'Full user lifecycle management');

-- Grant all four user permissions to the UserManagement role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('user_read', 'user_create', 'user_update', 'user_delete')
WHERE r.name = 'UserManagement';
