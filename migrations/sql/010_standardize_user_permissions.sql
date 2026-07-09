-- Standardize legacy underscore permission names (user_read, user_create, user_update,
-- user_delete) onto the colon-based "resource:action" convention used everywhere else
-- (users:read, users:create, users:update, users:delete). Also renames the UserManagement
-- role to the lowercase-hyphenated convention used by the other roles.

-- 1. Ensure the colon-based permissions exist
INSERT IGNORE INTO permissions (name, description) VALUES
  ('users:read',   'View user list and individual user details'),
  ('users:create', 'Create new users'),
  ('users:update', 'Update user details, roles, and direct permissions'),
  ('users:delete', 'Permanently delete users');

-- 2. Copy role grants from the old underscore permissions onto the new colon permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, new_p.id
FROM role_permissions rp
JOIN permissions old_p ON old_p.id = rp.permission_id
JOIN permissions new_p ON new_p.name = CONCAT('users:', SUBSTRING(old_p.name, 6))
WHERE old_p.name IN ('user_read', 'user_create', 'user_update', 'user_delete');

-- 3. Copy direct user grants from the old underscore permissions onto the new colon permissions
INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT up.user_id, new_p.id
FROM user_permissions up
JOIN permissions old_p ON old_p.id = up.permission_id
JOIN permissions new_p ON new_p.name = CONCAT('users:', SUBSTRING(old_p.name, 6))
WHERE old_p.name IN ('user_read', 'user_create', 'user_update', 'user_delete');

-- 4. Grant the standardized permissions to admin directly, matching every other permission migration
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN ('users:read', 'users:create', 'users:update', 'users:delete');

-- 5. Drop the old underscore permissions (cascades to role_permissions / user_permissions)
DELETE FROM permissions WHERE name IN ('user_read', 'user_create', 'user_update', 'user_delete');

-- 6. Rename the UserManagement role to the standardized kebab-case form
UPDATE roles SET name = 'user-management' WHERE name = 'UserManagement';
