-- Migration 0002: Schema Improvements
-- S10: Thêm discount column cho orders
-- S11: Thêm CHECK constraint cho payment_method
-- S6: Đổi ip → ip_hash trong customer_events (PII compliance)
-- S1: FK order_items tham chiếu orders.id thay vì orders.code

-- ============================================================
-- STEP 1: orders — thêm discount, thêm CHECK payment_method
-- D1/SQLite không hỗ trợ ALTER ADD CHECK, phải recreate table.
-- ============================================================

DROP TABLE IF EXISTS orders_new;

CREATE TABLE orders_new (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE COLLATE NOCASE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  note TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'bank-transfer', 'e-wallet')),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_fee INTEGER NOT NULL CHECK (shipping_fee >= 0),
  discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total INTEGER NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipping', 'completed', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO orders_new (id, code, customer_name, phone, email, address, province, district, note, payment_method, subtotal, shipping_fee, discount, total, status, created_at, updated_at)
SELECT id, code, customer_name, phone, email, address, province, district, note, payment_method, subtotal, shipping_fee, 0, total, status, created_at, created_at
FROM orders;

DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- ============================================================
-- STEP 2: order_items — FK → orders.id thay vì orders.code
-- Thêm order_id column, migrate data qua JOIN
-- ============================================================

DROP TABLE IF EXISTS order_items_new;

CREATE TABLE order_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total INTEGER NOT NULL CHECK (line_total >= 0),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

INSERT INTO order_items_new (id, order_id, product_id, variant_id, product_name, variant_label, price, quantity, line_total)
SELECT oi.id, o.id, oi.product_id, oi.variant_id, oi.product_name, oi.variant_label, oi.price, oi.quantity, oi.line_total
FROM order_items oi
JOIN orders o ON o.code = oi.order_code;

DROP TABLE order_items;
ALTER TABLE order_items_new RENAME TO order_items;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================
-- STEP 3: customer_events — ip → ip_hash (PII compliance)
-- ============================================================

DROP TABLE IF EXISTS customer_events_new;

CREATE TABLE customer_events_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  payload TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO customer_events_new (id, event_type, payload, user_agent, ip_hash, created_at)
SELECT id, event_type, payload, user_agent, NULL, created_at
FROM customer_events;

DROP TABLE customer_events;
ALTER TABLE customer_events_new RENAME TO customer_events;

CREATE INDEX IF NOT EXISTS idx_customer_events_type_created ON customer_events(event_type, created_at);
