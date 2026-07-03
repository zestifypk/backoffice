-- PostEx order management schema
-- Fields derived from PostEx booking template (sheet: PostEx Orders)

CREATE TABLE IF NOT EXISTS orders (
  id                   INT             NOT NULL AUTO_INCREMENT,

  -- PostEx template fields
  reference_number     VARCHAR(100)    NOT NULL,
  order_amount         DECIMAL(10, 2)  NOT NULL DEFAULT 0.00,
  order_detail         TEXT            NULL,
  customer_name        VARCHAR(255)    NOT NULL,
  customer_phone       VARCHAR(50)     NOT NULL,
  order_address        TEXT            NOT NULL,
  city                 VARCHAR(100)    NOT NULL,
  items                INT             NOT NULL DEFAULT 1,
  airway_bill_copies   INT             NOT NULL DEFAULT 1,
  notes                TEXT            NULL,
  address_code         VARCHAR(50)     NULL,
  return_address_code  VARCHAR(50)     NULL,
  order_type           ENUM(
                         'Normal',
                         'Reversed',
                         'Replacement',
                         'Overland'
                       )               NOT NULL DEFAULT 'Normal',
  booking_weight       DECIMAL(8, 3)   NULL COMMENT 'Weight in kg',

  -- Internal tracking
  status               ENUM(
                         'pending',
                         'booked',
                         'in_transit',
                         'delivered',
                         'returned',
                         'cancelled'
                       )               NOT NULL DEFAULT 'pending',
  created_by           BIGINT          NULL,
  created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY uq_orders_reference   (reference_number),
  KEY         idx_orders_status     (status),
  KEY         idx_orders_order_type (order_type),
  KEY         idx_orders_city       (city),
  KEY         idx_orders_created_by (created_by),

  CONSTRAINT fk_orders_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions
INSERT IGNORE INTO permissions (name, description) VALUES
  ('orders:read',   'View orders list and detail'),
  ('orders:create', 'Create new orders'),
  ('orders:update', 'Update order status and fields'),
  ('orders:delete', 'Delete orders');

-- Grant all order permissions to admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN ('orders:read', 'orders:create', 'orders:update', 'orders:delete');
