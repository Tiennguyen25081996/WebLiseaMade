-- Cloudflare D1 Database Schema for WebLiseaMade

-- Bảng lưu trữ đơn hàng
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  note TEXT,
  payment_method TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL
);

-- Bảng chi tiết sản phẩm trong đơn hàng
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  line_total INTEGER NOT NULL,
  FOREIGN KEY (order_code) REFERENCES orders(code) ON DELETE CASCADE
);

-- Chỉ mục tối ưu truy vấn order_items theo order_code
CREATE INDEX IF NOT EXISTS idx_order_items_order_code ON order_items(order_code);

-- Bảng lưu vết sự kiện hành vi khách hàng
CREATE TABLE IF NOT EXISTS customer_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'view_product', 'add_to_cart', 'initiate_checkout', 'place_order'
  payload TEXT,             -- JSON string
  user_agent TEXT,
  ip TEXT,
  created_at TEXT NOT NULL
);

-- Chỉ mục lọc sự kiện theo loại và thời gian
CREATE INDEX IF NOT EXISTS idx_customer_events_type_created ON customer_events(event_type, created_at);
