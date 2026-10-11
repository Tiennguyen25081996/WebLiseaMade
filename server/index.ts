/**
 * Cloudflare Worker Backend cho WebLiseaMade
 * Xử lý API đặt hàng, tra cứu đơn và lưu vết sự kiện khách hàng trên Cloudflare D1.
 */

import { isValidOrderCode, validateOrderPayload } from "../src/lib/validation";

// Định nghĩa tối thiểu cho interface D1Database nếu môi trường worker chưa có types đầy đủ
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<{ success: boolean; results?: T[]; meta?: unknown }>;
  all<T = Record<string, unknown>>(): Promise<{ success: boolean; results: T[] }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<Array<{ success: boolean; results?: T[] }>>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface Fetcher {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

export interface Env {
  DB?: D1Database;
  prod_d1_tutorial?: D1Database;
  ASSETS?: Fetcher;
}

export interface OrderItemInput {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderInput {
  id?: string;
  code: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  province: string;
  district: string;
  note?: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  items: OrderItemInput[];
}

export interface CustomerEventInput {
  eventType: "view_product" | "add_to_cart" | "initiate_checkout" | "place_order" | string;
  payload?: unknown;
  userAgent?: string;
  ip?: string;
}

/** Trả về binding D1 database đang có trong môi trường */
export function getDb(env: Env): D1Database | null {
  return env.DB ?? env.prod_d1_tutorial ?? null;
}

/**
 * S7: initDb chỉ đảm bảo schema tồn tại bằng IF NOT EXISTS.
 * Schema chính thức nằm ở db/schema.sql, migration ở migrations/.
 * Hàm này là safety net cho lần deploy đầu tiên, không thay thế migration.
 */
let dbInitialized = false;

export async function initDb(db: D1Database): Promise<void> {
  if (dbInitialized) return;
  try {
    // ponytail: chỉ CREATE IF NOT EXISTS, không đặt logic migration ở đây.
    // Migration chính thức chạy qua `wrangler d1 migrations apply`.
    await db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
      CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
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
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE TABLE IF NOT EXISTS customer_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        payload TEXT,
        user_agent TEXT,
        ip_hash TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_customer_events_type_created ON customer_events(event_type, created_at);
    `);
    dbInitialized = true;
  } catch (err) {
    console.warn("initDb warning:", err);
    dbInitialized = true;
  }
}

/** Reset init flag — chỉ dùng cho test */
export function resetDbInit(): void {
  dbInitialized = false;
}

/**
 * S6: Hash IP trước khi lưu DB — PII compliance.
 * Dùng SHA-256 qua Web Crypto API (có sẵn trên Cloudflare Workers).
 */
async function hashIp(ip: string): Promise<string> {
  if (!ip) return "";
  const data = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Xử lý CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Các routes API
    if (url.pathname.startsWith("/api/")) {
      const db = getDb(env);
      if (!db) {
        return jsonResponse(
          { success: false, error: "Database binding not configured (missing env.DB / env.prod_d1_tutorial)" },
          500,
        );
      }

      try {
        // Đảm bảo schema đã được khởi tạo
        await initDb(db);

        // POST /api/orders
        if (url.pathname === "/api/orders" && request.method === "POST") {
          const rawBody = await request.json().catch(() => null);
          if (!rawBody) {
            return jsonResponse({ success: false, error: "Dữ liệu JSON không hợp lệ" }, 400);
          }

          // Kiểm tra và sanitize toàn bộ input bằng module validation
          const validation = validateOrderPayload(rawBody);
          if (!validation.valid || !validation.sanitized) {
            return jsonResponse(
              {
                success: false,
                error: "Dữ liệu đầu vào không hợp lệ",
                errors: validation.errors,
              },
              400,
            );
          }

          const sanitized = validation.sanitized;
          const orderId = (rawBody as Record<string, unknown>).id
            ? String((rawBody as Record<string, unknown>).id)
            : `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const createdAt = (rawBody as Record<string, unknown>).createdAt
            ? String((rawBody as Record<string, unknown>).createdAt)
            : new Date().toISOString();
          const updatedAt = (rawBody as Record<string, unknown>).updatedAt
            ? String((rawBody as Record<string, unknown>).updatedAt)
            : createdAt;
          const status = "pending";
          // S10: discount từ sanitized payload (hiện = 0, sẵn sàng cho coupon)
          const discount = sanitized.discount ?? 0;

          // Chuẩn bị batch queries cho transaction
          const statements: D1PreparedStatement[] = [];

          statements.push(
            db
              .prepare(
                `INSERT INTO orders (
                  id, code, customer_name, phone, email, address, province, district,
                  note, payment_method, subtotal, shipping_fee, discount, total, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(
                orderId,
                sanitized.code,
                sanitized.customerName,
                sanitized.phone,
                sanitized.email,
                sanitized.address,
                sanitized.province,
                sanitized.district,
                sanitized.note,
                sanitized.paymentMethod,
                sanitized.subtotal,
                sanitized.shippingFee,
                discount,
                sanitized.total,
                status,
                createdAt,
                updatedAt,
              ),
          );

          // S1: order_items FK → orders.id (orderId), không dùng orders.code
          for (const item of sanitized.items) {
            statements.push(
              db
                .prepare(
                  `INSERT INTO order_items (
                    order_id, product_id, variant_id, product_name, variant_label, price, quantity, line_total
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .bind(
                  orderId,
                  item.productId,
                  item.variantId,
                  item.productName,
                  item.variantLabel,
                  item.price,
                  item.quantity,
                  item.lineTotal,
                ),
            );
          }

          // Thực thi batch D1 (atomic transaction)
          await db.batch(statements);

          return jsonResponse({
            success: true,
            order: {
              id: orderId,
              code: sanitized.code,
              status,
              total: sanitized.total,
              createdAt,
            },
          }, 201);
        }

        // GET /api/orders/:code
        if (url.pathname.startsWith("/api/orders/") && request.method === "GET") {
          const code = decodeURIComponent(url.pathname.replace("/api/orders/", "")).trim();
          if (!isValidOrderCode(code)) {
            return jsonResponse({ success: false, error: "Định dạng mã đơn hàng không hợp lệ (LM-XXXXXX)" }, 400);
          }

          const order = await db
            .prepare("SELECT * FROM orders WHERE code = ? COLLATE NOCASE")
            .bind(code)
            .first();

          if (!order) {
            return jsonResponse({ success: false, error: "Không tìm thấy đơn hàng" }, 404);
          }

          // S1: query order_items bằng order.id thay vì order.code
          const itemsResult = await db
            .prepare("SELECT * FROM order_items WHERE order_id = ?")
            .bind(order.id as string)
            .all();

          return jsonResponse({
            success: true,
            order: {
              ...order,
              items: itemsResult.results || [],
            },
          });
        }

        // POST /api/events
        if (url.pathname === "/api/events" && request.method === "POST") {
          const body = (await request.json().catch(() => null)) as Partial<CustomerEventInput> | null;
          if (!body || !body.eventType) {
            return jsonResponse({ success: false, error: "Thiếu trường eventType" }, 400);
          }

          const userAgent = body.userAgent || request.headers.get("User-Agent") || "";
          const rawIp =
            body.ip ||
            request.headers.get("CF-Connecting-IP") ||
            request.headers.get("X-Forwarded-For") ||
            "";
          // S6: Hash IP trước khi lưu — không lưu raw IP (PII compliance)
          const ipHash = await hashIp(rawIp);
          const createdAt = new Date().toISOString();
          const payloadStr =
            typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload ?? {});

          await db
            .prepare(
              `INSERT INTO customer_events (event_type, payload, user_agent, ip_hash, created_at)
               VALUES (?, ?, ?, ?, ?)`
            )
            .bind(body.eventType, payloadStr, userAgent, ipHash, createdAt)
            .run();

          return jsonResponse({ success: true, loggedAt: createdAt }, 201);
        }

        return jsonResponse({ success: false, error: "API route not found" }, 404);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResponse({ success: false, error: message }, 500);
      }
    }

    // Chuyển tiếp các request tĩnh cho ASSETS
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
