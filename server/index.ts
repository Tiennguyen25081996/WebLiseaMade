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
  total: number;
  status?: string;
  createdAt?: string;
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

let dbInitialized = false;

/** Tự động migration khởi tạo bảng nếu chưa có (chạy 1 lần an toàn) */
export async function initDb(db: D1Database): Promise<void> {
  if (dbInitialized) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS orders (
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
    )`).run();

    await db.prepare(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      variant_label TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      line_total INTEGER NOT NULL
    )`).run();

    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_items_order_code ON order_items(order_code)`).run();

    await db.prepare(`CREATE TABLE IF NOT EXISTS customer_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload TEXT,
      user_agent TEXT,
      ip TEXT,
      created_at TEXT NOT NULL
    )`).run();

    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_customer_events_type_created ON customer_events(event_type, created_at)`).run();

    dbInitialized = true;
  } catch (err) {
    console.warn("initDb warning:", err);
    dbInitialized = true;
  }
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
          const status = "pending";

          // Chuẩn bị batch queries cho transaction
          const statements: D1PreparedStatement[] = [];

          statements.push(
            db
              .prepare(
                `INSERT INTO orders (
                  id, code, customer_name, phone, email, address, province, district,
                  note, payment_method, subtotal, shipping_fee, total, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
                sanitized.total,
                status,
                createdAt,
              ),
          );

          for (const item of sanitized.items) {
            statements.push(
              db
                .prepare(
                  `INSERT INTO order_items (
                    order_code, product_id, variant_id, product_name, variant_label, price, quantity, line_total
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                )
                .bind(
                  sanitized.code,
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

          const itemsResult = await db
            .prepare("SELECT * FROM order_items WHERE order_code = ?")
            .bind(order.code as string)
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
          const ip =
            body.ip ||
            request.headers.get("CF-Connecting-IP") ||
            request.headers.get("X-Forwarded-For") ||
            "";
          const createdAt = new Date().toISOString();
          const payloadStr =
            typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload ?? {});

          await db
            .prepare(
              `INSERT INTO customer_events (event_type, payload, user_agent, ip, created_at)
               VALUES (?, ?, ?, ?, ?)`
            )
            .bind(body.eventType, payloadStr, userAgent, ip, createdAt)
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
