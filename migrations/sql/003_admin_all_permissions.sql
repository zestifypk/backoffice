-- Grant every existing permission to the admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

-- Assign every existing role to every user who currently holds the admin role
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT ur.user_id, r2.id
FROM user_roles ur
JOIN roles r1 ON ur.role_id = r1.id AND r1.name = 'admin'
CROSS JOIN roles r2;

-- Grant every permission directly to admin users as well (bypass role hierarchy)
INSERT IGNORE INTO user_permissions (user_id, permission_id)
SELECT ur.user_id, p.id
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id AND r.name = 'admin'
CROSS JOIN permissions p;
