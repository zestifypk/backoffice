-- Add users:reset-password permission and grant it to the admin role

INSERT IGNORE INTO permissions (name, description)
VALUES ('users:reset-password', 'Allow resetting any user password');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name = 'users:reset-password';
