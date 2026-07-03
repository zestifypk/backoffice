-- Permission for fetching/syncing orders from the PostEx API

INSERT IGNORE INTO permissions (name, description)
VALUES ('orders:postex-sync', 'Fetch and sync order status from the PostEx API');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name = 'orders:postex-sync';
