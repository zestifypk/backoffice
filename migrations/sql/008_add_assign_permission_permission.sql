-- Add users:assign-permission permission and grant it to the admin role

INSERT IGNORE INTO permissions (name, description)
VALUES ('users:assign-permission', 'Assign direct permissions to users');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name = 'users:assign-permission';
