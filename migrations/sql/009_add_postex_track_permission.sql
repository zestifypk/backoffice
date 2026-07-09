-- Split PostEx tracking off from the sync permission — grant it separately

INSERT IGNORE INTO permissions (name, description)
VALUES ('orders:postex-track', 'Track a single order''s real-time status via the PostEx API');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name = 'orders:postex-track';
