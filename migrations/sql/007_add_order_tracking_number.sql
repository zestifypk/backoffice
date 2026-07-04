-- Tracking number, assigned after an order is booked/uploaded and dispatched for delivery
ALTER TABLE orders
  ADD COLUMN tracking_number VARCHAR(100) NULL,
  ADD CONSTRAINT uq_orders_tracking_number UNIQUE (tracking_number);

-- New orders now start life "Out for Delivery" (in_transit) instead of pending
ALTER TABLE orders MODIFY COLUMN status ENUM(
  'pending', 'booked', 'in_transit', 'delivered', 'returned', 'cancelled'
) NOT NULL DEFAULT 'in_transit';
