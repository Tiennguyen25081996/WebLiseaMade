-- Cloudflare D1 Database Schema for WebLiseaMade
-- Single source of truth — migrations reflect this target state.

-- Bảng lưu trữ đơn hàng
CREATE TABLE IF NOT EXISTS orders (
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

-- Chỉ mục tối ưu truy vấn orders
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- Bảng chi tiết sản phẩm trong đơn hàng
CREATE TABLE IF NOT EXISTS order_items (
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

-- Chỉ mục tối ưu truy vấn order_items theo order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Bảng lưu vết sự kiện hành vi khách hàng
CREATE TABLE IF NOT EXISTS customer_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'view_product', 'add_to_cart', 'initiate_checkout', 'place_order'
  payload TEXT,             -- JSON string
  user_agent TEXT,
  ip_hash TEXT,             -- SHA-256 hash of IP, not raw IP (PII compliance)
  created_at TEXT NOT NULL
);

-- Chỉ mục lọc sự kiện theo loại và thời gian
CREATE INDEX IF NOT EXISTS idx_customer_events_type_created ON customer_events(event_type, created_at);

-- Bảng lưu trữ ảnh tải lên Cloudflare / Media library
CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size >= 0),
  url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT
);

-- Chỉ mục tối ưu sắp xếp ảnh theo thời gian tải lên
CREATE INDEX IF NOT EXISTS idx_media_files_created ON media_files(created_at DESC);
