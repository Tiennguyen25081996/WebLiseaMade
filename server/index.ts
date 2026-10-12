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
  ALLOWED_ORIGIN?: string;
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
      CREATE TABLE IF NOT EXISTS media_files (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL CHECK (size >= 0),
        url TEXT NOT NULL,
        created_at TEXT NOT NULL,
        data TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_media_files_created ON media_files(created_at DESC);
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    dbInitialized = true;
  } catch (err) {
    console.warn("initDb warning:", err);
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

export function securityHeaders(origin = "*"): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token, X-Requested-With",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  };
}

// Bộ đệm Rate Limiter chống DoS / DDoS flood request
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_GENERAL_REQUESTS_PER_MINUTE = 120;
const MAX_SENSITIVE_REQUESTS_PER_MINUTE = 40;

export function checkRateLimit(ip: string, isSensitive = false): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `${ip}:${isSensitive ? "sens" : "gen"}`;
  const maxReqs = isSensitive ? MAX_SENSITIVE_REQUESTS_PER_MINUTE : MAX_GENERAL_REQUESTS_PER_MINUTE;

  // Dọn dẹp định kỳ tránh rò rỉ bộ nhớ map
  if (rateLimitMap.size > 2000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetAt < now) rateLimitMap.delete(k);
    }
  }

  let entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(key, entry);
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > maxReqs) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

export function resetRateLimit(): void {
  rateLimitMap.clear();
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

function checkPayloadSize(request: Request, maxBytes: number): boolean {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return false;
  }
  return true;
}

function getAllowedOrigin(request: Request, env: Env): string {
  const configured = env.ALLOWED_ORIGIN?.trim();
  if (configured) return configured;
  const origin = request.headers.get("Origin");
  if (!origin) return "*";
  const requestOrigin = new URL(request.url).origin;
  return origin === requestOrigin ? origin : requestOrigin;
}

function jsonResponse(data: unknown, status = 200, origin = "*"): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...securityHeaders(origin),
    },
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function hasAllowedImageExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  const extension = lower.match(/\.[^.]+$/)?.[0] ?? "";
  return ALLOWED_IMAGE_EXTENSIONS.has(extension);
}

function hasValidImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/gif") {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  }
  if (mimeType === "image/webp") {
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const allowedOrigin = getAllowedOrigin(request, env);

    // Xử lý CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: securityHeaders(allowedOrigin),
      });
    }

    // Các routes API
    if (url.pathname.startsWith("/api/")) {
      const allowedOrigin = getAllowedOrigin(request, env);
      const apiJson = (data: unknown, status = 200) => jsonResponse(data, status, allowedOrigin);

      // Phòng thủ DoS: Kiểm tra Rate Limiting theo IP
      const clientIp = getClientIp(request);
      const isSensitiveOp = request.method === "POST" || request.method === "PATCH" || request.method === "DELETE";
      const rateResult = checkRateLimit(clientIp, isSensitiveOp);
      if (!rateResult.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Hệ thống phát hiện tần suất yêu cầu quá cao. Vui lòng thử lại sau giây lát.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Retry-After": String(rateResult.retryAfter ?? 60),
              ...securityHeaders(allowedOrigin),
            },
          }
        );
      }

      const db = getDb(env);

      if (!db) {
        return apiJson(
          { success: false, error: "Database binding not configured" },
          500,
        );
      }

      try {

        // Đảm bảo schema đã được khởi tạo
        await initDb(db);

        // POST /api/orders
        if (url.pathname === "/api/orders" && request.method === "POST") {
          if (!checkPayloadSize(request, 150 * 1024)) {
            return apiJson({ success: false, error: "Dung lượng dữ liệu đơn hàng vượt quá giới hạn cho phép." }, 413);
          }
          const rawBody = await request.json().catch(() => null);
          if (!rawBody) {
            return apiJson({ success: false, error: "Dữ liệu JSON không hợp lệ" }, 400);
          }

          // Kiểm tra và sanitize toàn bộ input bằng module validation
          const validation = validateOrderPayload(rawBody);
          if (!validation.valid || !validation.sanitized) {
            return apiJson(
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

          return apiJson({
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
            return apiJson({ success: false, error: "Định dạng mã đơn hàng không hợp lệ (LM-XXXXXX)" }, 400);
          }

          const order = await db
            .prepare("SELECT * FROM orders WHERE code = ? COLLATE NOCASE")
            .bind(code)
            .first();

          if (!order) {
            return apiJson({ success: false, error: "Không tìm thấy đơn hàng" }, 404);
          }

          // S1: query order_items bằng order.id thay vì order.code
          const itemsResult = await db
            .prepare("SELECT * FROM order_items WHERE order_id = ?")
            .bind(order.id as string)
            .all();

          return apiJson({
            success: true,
            order: {
              ...order,
              items: itemsResult.results || [],
            },
          });
        }

        // PATCH /api/orders/:code - Cập nhật trạng thái đơn hàng (Admin)
        if (url.pathname.startsWith("/api/orders/") && request.method === "PATCH") {
          const code = decodeURIComponent(url.pathname.replace("/api/orders/", "")).trim();
          if (!isValidOrderCode(code)) {
            return apiJson({ success: false, error: "Định dạng mã đơn hàng không hợp lệ (LM-XXXXXX)" }, 400);
          }

          const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
          if (!body) {
            return apiJson({ success: false, error: "Dữ liệu cập nhật không hợp lệ" }, 400);
          }

          let dbStatus: string | undefined;
          if (typeof body.status === "string") {
            const s = body.status;
            if (s === "processing") dbStatus = "confirmed";
            else if (s === "delivered") dbStatus = "completed";
            else if (["pending", "confirmed", "shipping", "completed", "cancelled"].includes(s)) {
              dbStatus = s;
            }
          }

          const updatedAt = new Date().toISOString();
          if (dbStatus) {
            await db
              .prepare("UPDATE orders SET status = ?, updated_at = ? WHERE code = ? COLLATE NOCASE")
              .bind(dbStatus, updatedAt, code)
              .run();
          }

          return apiJson({ success: true, status: dbStatus || body.status });
        }

        // POST /api/events
        if (url.pathname === "/api/events" && request.method === "POST") {
          if (!checkPayloadSize(request, 50 * 1024)) {
            return apiJson({ success: false, error: "Dung lượng sự kiện vượt quá giới hạn." }, 413);
          }
          const body = (await request.json().catch(() => null)) as Partial<CustomerEventInput> | null;
          if (!body || !body.eventType) {
            return apiJson({ success: false, error: "Thiếu trường eventType" }, 400);
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

          return apiJson({ success: true, loggedAt: createdAt }, 201);
        }

        // POST /api/upload - Tải ảnh lên Cloudflare / D1 hoặc lưu link Google Drive
        if (url.pathname === "/api/upload" && request.method === "POST") {
          if (!checkPayloadSize(request, 3.5 * 1024 * 1024)) {
            return apiJson({ success: false, error: "Dung lượng tệp tải lên vượt quá giới hạn 3.5MB." }, 413);
          }
          const contentType = request.headers.get("Content-Type") || "";
          let filename = "image.png";
          let mimeType = "image/png";
          let size = 0;
          let base64Data = "";

          if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData().catch(() => null);
            if (!formData) {
              return apiJson({ success: false, error: "Không đọc được formData" }, 400);
            }
            const file = formData.get("file");
            if (!file || typeof file === "string") {
              return apiJson({ success: false, error: "Thiếu file ảnh trong formData" }, 400);
            }
            const f = file as File;
            filename = f.name || "uploaded.png";
            mimeType = f.type || "image/png";
            size = f.size;
            const buffer = await f.arrayBuffer();
            base64Data = arrayBufferToBase64(buffer);
          } else {
            // JSON fallback: { file: base64, filename: string, mimeType: string } HOẶC { url: string, filename?: string }
            const json = (await request.json().catch(() => null)) as {
              url?: string;
              file?: string;
              filename?: string;
              mimeType?: string;
              size?: number;
            } | null;

            if (!json) {
              return apiJson({ success: false, error: "Thiếu dữ liệu JSON" }, 400);
            }

            // Lưu link trực tiếp từ Google Drive hoặc CDN bên ngoài (không lưu base64 vào D1)
            if (json.url) {
              const directUrl = String(json.url).trim();
              if (!directUrl.startsWith("http://") && !directUrl.startsWith("https://")) {
                return apiJson({ success: false, error: "Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://" }, 400);
              }
              const gdriveFilename = json.filename ? String(json.filename) : "drive-image.jpg";
              const gdriveMime = json.mimeType ? String(json.mimeType) : "image/jpeg";
              const gdriveSize = Number(json.size) || 0;
              const imageId = `gdrive_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
              const createdAt = new Date().toISOString();

              await db
                .prepare(
                  `INSERT INTO media_files (id, filename, mime_type, size, url, created_at, data)
                   VALUES (?, ?, ?, ?, ?, ?, NULL)`
                )
                .bind(imageId, gdriveFilename, gdriveMime, gdriveSize, directUrl, createdAt)
                .run();

              return apiJson(
                {
                  success: true,
                  image: {
                    id: imageId,
                    filename: gdriveFilename,
                    mimeType: gdriveMime,
                    size: gdriveSize,
                    url: directUrl,
                    createdAt,
                  },
                },
                201,
              );
            }

            if (!json.file) {
              return apiJson({ success: false, error: "Thiếu dữ liệu file hoặc link ảnh url" }, 400);
            }

            filename = json.filename || "uploaded.png";
            mimeType = json.mimeType || "image/png";
            base64Data = json.file.replace(/^data:[^;]+;base64,/, "");
            size = Math.round((base64Data.length * 3) / 4);
          }

          if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
            return apiJson({ success: false, error: "Định dạng ảnh không được hỗ trợ" }, 400);
          }

          if (!hasAllowedImageExtension(filename)) {
            return apiJson({ success: false, error: "Phần mở rộng file ảnh không hợp lệ" }, 400);
          }

          // Giới hạn 10MB
          if (size > 10 * 1024 * 1024) {
            return apiJson({ success: false, error: "Dung lượng ảnh vượt quá giới hạn 10MB" }, 400);
          }

          const bytes = base64ToUint8Array(base64Data);
          if (!hasValidImageSignature(bytes, mimeType)) {
            return apiJson({ success: false, error: "Nội dung file không khớp định dạng ảnh" }, 400);
          }

          const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          const createdAt = new Date().toISOString();
          const publicUrl = `/api/images/${imageId}`;

          try {
            await db
              .prepare(
                `INSERT INTO media_files (id, filename, mime_type, size, url, created_at, data)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(imageId, filename, mimeType, size, publicUrl, createdAt, base64Data)
              .run();
          } catch {
            // Auto-heal nếu bảng media_files chưa được tạo
            await db.exec(`
              CREATE TABLE IF NOT EXISTS media_files (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                size INTEGER NOT NULL CHECK (size >= 0),
                url TEXT NOT NULL,
                created_at TEXT NOT NULL,
                data TEXT
              );
              CREATE INDEX IF NOT EXISTS idx_media_files_created ON media_files(created_at DESC);
            `);
            await db
              .prepare(
                `INSERT INTO media_files (id, filename, mime_type, size, url, created_at, data)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
              )
              .bind(imageId, filename, mimeType, size, publicUrl, createdAt, base64Data)
              .run();
          }

          return apiJson(
            {
              success: true,
              image: {
                id: imageId,
                filename,
                mimeType,
                size,
                url: publicUrl,
                createdAt,
              },
            },
            201,
          );
        }

        // GET /api/images - Danh sách ảnh đã upload
        if (url.pathname === "/api/images" && request.method === "GET") {
          try {
            const result = await db
              .prepare(
                "SELECT id, filename, mime_type, size, url, created_at FROM media_files ORDER BY created_at DESC LIMIT 100"
              )
              .all();

            return apiJson({
              success: true,
              images: result.results || [],
            });
          } catch {
            // Auto-heal nếu bảng media_files chưa tồn tại
            try {
              await db.exec(`
                CREATE TABLE IF NOT EXISTS media_files (
                  id TEXT PRIMARY KEY,
                  filename TEXT NOT NULL,
                  mime_type TEXT NOT NULL,
                  size INTEGER NOT NULL CHECK (size >= 0),
                  url TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  data TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_media_files_created ON media_files(created_at DESC);
              `);
              const retryResult = await db
                .prepare(
                  "SELECT id, filename, mime_type, size, url, created_at FROM media_files ORDER BY created_at DESC LIMIT 100"
                )
                .all();

              return apiJson({
                success: true,
                images: retryResult.results || [],
              });
            } catch {
              return apiJson({
                success: true,
                images: [],
              });
            }
          }
        }

        // GET /api/images/:id - Trả về dữ liệu ảnh binary hoặc redirect nếu link Google Drive
        if (url.pathname.startsWith("/api/images/") && request.method === "GET") {
          const imageId = decodeURIComponent(url.pathname.replace("/api/images/", "")).trim();
          let record: { mime_type?: string; data?: string | null; url?: string | null } | null = null;

          try {
            record = await db
              .prepare("SELECT mime_type, data, url FROM media_files WHERE id = ?")
              .bind(imageId)
              .first<{ mime_type: string; data: string | null; url: string | null }>();
          } catch {
            return apiJson({ success: false, error: "Bảng hình ảnh chưa khởi tạo" }, 404);
          }

          if (!record) {
            return apiJson({ success: false, error: "Không tìm thấy hình ảnh" }, 404);
          }

          if (!record.data) {
            if (record.url && (record.url.startsWith("http://") || record.url.startsWith("https://"))) {
              return Response.redirect(record.url, 302);
            }
            return apiJson({ success: false, error: "Không tìm thấy dữ liệu hình ảnh" }, 404);
          }

          const binary = base64ToUint8Array(record.data);
          return new Response(binary as unknown as BodyInit, {
            status: 200,
            headers: {
              "Content-Type": record.mime_type || "image/png",
              "Cache-Control": "public, max-age=31536000, immutable",
              ...securityHeaders(allowedOrigin),
            },
          });
        }

        // DELETE /api/images/:id - Xóa ảnh
        if (url.pathname.startsWith("/api/images/") && request.method === "DELETE") {
          const imageId = decodeURIComponent(url.pathname.replace("/api/images/", "")).trim();
          try {
            await db.prepare("DELETE FROM media_files WHERE id = ?").bind(imageId).run();
          } catch {
            // Không lỗi nếu bảng chưa tồn tại
          }
          return apiJson({ success: true, id: imageId });
        }

        // GET /api/site-settings - Lấy cài đặt website (sản phẩm, trang chủ, danh mục)
        if (url.pathname === "/api/site-settings" && request.method === "GET") {
          try {
            const rows = await db
              .prepare("SELECT key, value FROM site_settings")
              .all<{ key: string; value: string }>();
            const result: Record<string, unknown> = {};
            for (const row of rows.results || []) {
              try {
                result[row.key] = JSON.parse(row.value);
              } catch {
                result[row.key] = row.value;
              }
            }
            return apiJson({ success: true, settings: result });
          } catch {
            return apiJson({ success: true, settings: {} });
          }
        }

        // POST /api/site-settings - Cập nhật cài đặt website lên D1
        if (url.pathname === "/api/site-settings" && request.method === "POST") {
          if (!checkPayloadSize(request, 500 * 1024)) {
            return apiJson({ success: false, error: "Dung lượng cài đặt vượt quá giới hạn 500KB." }, 413);
          }
          const body = (await request.json().catch(() => null)) as {
            key?: string;
            value?: unknown;
          } | null;
          if (!body || !body.key || body.value === undefined) {
            return apiJson({ success: false, error: "Thiếu key hoặc value" }, 400);
          }
          const key = String(body.key).trim();
          const valueStr =
            typeof body.value === "string" ? body.value : JSON.stringify(body.value);
          const now = new Date().toISOString();

          try {
            await db
              .prepare(
                `INSERT INTO site_settings (key, value, updated_at)
                 VALUES (?, ?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
              )
              .bind(key, valueStr, now)
              .run();
          } catch {
            // Auto-heal nếu bảng site_settings chưa tồn tại
            try {
              await db.exec(`
                CREATE TABLE IF NOT EXISTS site_settings (
                  key TEXT PRIMARY KEY,
                  value TEXT NOT NULL,
                  updated_at TEXT NOT NULL
                );
              `);
              await db
                .prepare(
                  `INSERT INTO site_settings (key, value, updated_at)
                   VALUES (?, ?, ?)
                   ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
                )
                .bind(key, valueStr, now)
                .run();
            } catch (err) {
              return apiJson(
                { success: false, error: "Không thể lưu cài đặt vào database" },
                500
              );
            }
          }

          return apiJson({ success: true, key });
        }

        return apiJson({ success: false, error: "API route not found" }, 404);
      } catch (err: unknown) {
        console.error("API error", err);
        return apiJson({ success: false, error: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." }, 500);
      }
    }

    // Chuyển tiếp các request tĩnh cho ASSETS
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
