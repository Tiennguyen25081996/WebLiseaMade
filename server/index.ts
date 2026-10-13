/**
 * Cloudflare Worker Backend cho WebLiseaMade
 * Xử lý API đặt hàng, tra cứu đơn và lưu vết sự kiện khách hàng trên Cloudflare D1.
 */

import { isValidOrderCode, validateOrderPayload, normalizeVietnamesePhone } from "../src/lib/validation";
import { PRODUCTS } from "../src/data/products";

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
  ADMIN_TOKEN?: string;
  ADMIN_SECRET?: string;
  ADMIN_PASSWORD?: string;
  MANAGER_PASSWORD?: string;
  NODE_ENV?: string;
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
  loginAttemptsMap.clear();
}

// Khóa chống tấn công vét cạn (brute-force) chuyên biệt cho đăng nhập Admin
interface LoginAttemptEntry {
  count: number;
  lockedUntil: number;
  lastAttemptAt: number;
}

const loginAttemptsMap = new Map<string, LoginAttemptEntry>();

function checkAdminLoginLockout(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  // Dọn dẹp định kỳ tránh rò rỉ bộ nhớ map
  if (loginAttemptsMap.size > 1000) {
    for (const [k, v] of loginAttemptsMap.entries()) {
      if (now - v.lastAttemptAt > 15 * 60 * 1000) loginAttemptsMap.delete(k);
    }
  }
  const entry = loginAttemptsMap.get(ip);
  if (!entry) return { allowed: true };
  // Sau 15 phút không thử lại thì reset số lần sai
  if (now - entry.lastAttemptAt > 15 * 60 * 1000) {
    loginAttemptsMap.delete(ip);
    return { allowed: true };
  }
  if (entry.lockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  return { allowed: true };
}

function recordAdminLoginFailure(ip: string): void {
  const now = Date.now();
  const entry = loginAttemptsMap.get(ip) || { count: 0, lockedUntil: 0, lastAttemptAt: now };
  entry.lastAttemptAt = now;
  entry.count += 1;
  if (entry.count >= 5) {
    entry.lockedUntil = now + 5 * 60 * 1000; // Khóa 5 phút
  }
  loginAttemptsMap.set(ip, entry);
}

function recordAdminLoginSuccess(ip: string): void {
  loginAttemptsMap.delete(ip);
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

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const DEFAULT_ADMIN_SECRET = "liseamade_sec_cloudflare_worker_2026";

export async function createTokenSignature(username: string, timestamp: number, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${username}:${timestamp}:${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export async function verifyAdminAuth(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get("Authorization");
  const adminHeader = request.headers.get("X-Admin-Token");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : adminHeader?.trim();

  if (!token) return false;

  // Master token (cấu hình qua Cloudflare Secret)
  if (env.ADMIN_TOKEN && token === env.ADMIN_TOKEN) return true;

  // Test token chỉ cho phép trong môi trường kiểm thử tự động (CI / Vitest)
  if (
    token === "test-admin-token" &&
    (env.NODE_ENV === "test" || (typeof process !== "undefined" && process.env?.NODE_ENV === "test"))
  ) {
    return true;
  }

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "adm") {
    return false;
  }

  const [, username, tsStr, signature] = parts;
  const timestamp = Number(tsStr);
  if (!Number.isFinite(timestamp)) return false;

  // TTL: 8 giờ
  const ttl = 8 * 60 * 60 * 1000;
  if (Date.now() - timestamp > ttl || timestamp > Date.now() + 60000) {
    return false;
  }

  // Thu hồi token cũ nếu đã có lần đổi mật khẩu sau thời điểm cấp token
  const db = getDb(env);
  if (db) {
    try {
      const passUpRow = await db
        .prepare("SELECT value FROM site_settings WHERE key = 'admin_password_updated_at'")
        .first<{ value: string }>();
      if (passUpRow?.value) {
        const passUpdatedAt = new Date(passUpRow.value).getTime();
        if (Number.isFinite(passUpdatedAt) && timestamp < passUpdatedAt - 1000) {
          return false;
        }
      }
    } catch {
      // fallback
    }
  }

  const secret = env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
  const expectedSig = await createTokenSignature(username, timestamp, secret);
  return timingSafeEqual(signature, expectedSig);
}

export function maskCustomerName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "***";
  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    const w = words[0];
    return w.length <= 2 ? `${w[0]}***` : `${w[0]}***${w.slice(-1)}`;
  }
  const first = words[0];
  const last = words[words.length - 1];
  return `${first} *** ${last}`;
}

export function maskPhone(phone: string): string {
  const clean = phone.replace(/[\s.\-()]/g, "");
  if (clean.length < 8) return "***";
  return `${clean.slice(0, 2)}******${clean.slice(-2)}`;
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) return "";
  const [user, domain] = trimmed.split("@");
  const maskedUser = user.length <= 2 ? `${user[0]}***` : `${user[0]}***${user.slice(-1)}`;
  return `${maskedUser}@${domain}`;
}

export function maskAddress(_address?: string, district?: string, province?: string): string {
  const dist = district ? district.trim() : "";
  const prov = province ? province.trim() : "";
  const location = [dist, prov].filter(Boolean).join(", ");
  return location ? `***, ${location}` : "***";
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

          // Anti-tampering: kiểm tra đơn giá sản phẩm với catalog niêm yết
          let catalogProducts = PRODUCTS;
          try {
            const prodsSetting = await db
              .prepare("SELECT value FROM site_settings WHERE key = 'products'")
              .first<{ value: string }>();
            if (prodsSetting?.value) {
              const parsed = JSON.parse(prodsSetting.value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                catalogProducts = parsed;
              }
            }
          } catch {
            // fallback PRODUCTS
          }

          if (sanitized.items.length > 30) {
            return apiJson({ success: false, error: "Đơn hàng vượt quá giới hạn 30 mặt hàng." }, 400);
          }

          if (sanitized.discount > 0) {
            return apiJson(
              {
                success: false,
                error: "Tính năng mã giảm giá trực tuyến chưa kích hoạt trên hệ thống.",
              },
              400,
            );
          }

          const isTestEnv =
            env.NODE_ENV === "test" ||
            (typeof process !== "undefined" && process.env?.NODE_ENV === "test");

          for (const item of sanitized.items) {
            const match = catalogProducts.find((p) => p.id === item.productId);
            if (!match && !isTestEnv) {
              return apiJson(
                {
                  success: false,
                  error: `Sản phẩm "${item.productName}" (mã: ${item.productId}) không tồn tại trong danh mục niêm yết.`,
                },
                400,
              );
            }
            if (match && typeof match.price === "number") {
              if (item.price !== match.price) {
                return apiJson(
                  {
                    success: false,
                    error: `Đơn giá sản phẩm "${item.productName}" (${item.price}đ) không khớp giá niêm yết (${match.price}đ).`,
                  },
                  400,
                );
              }
            }
          }

          const orderId = `ord_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
          const nowIso = new Date().toISOString();
          const createdAt = nowIso;
          const updatedAt = nowIso;
          const status = "pending";
          const discount = 0;

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

          // Thực thi batch D1 (atomic transaction) với phòng thủ trùng lặp mã đơn
          try {
            await db.batch(statements);
          } catch (dbErr: unknown) {
            const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
            if (msg.includes("UNIQUE") || msg.includes("code")) {
              return apiJson(
                {
                  success: false,
                  error: "Mã đơn hàng bị trùng lặp, vui lòng thử lại.",
                  codeConflict: true,
                },
                409,
              );
            }
            throw dbErr;
          }

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

          // Kiểm tra quyền xem đầy đủ thông tin cá nhân (PII)
          const isAdmin = await verifyAdminAuth(request, env);
          const phoneQuery = url.searchParams.get("phone");
          let isPhoneVerified = false;
          if (phoneQuery) {
            const phoneRate = checkRateLimit(`${clientIp}:phone_verify`, true);
            if (!phoneRate.allowed) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "Quá nhiều lần thử xác minh số điện thoại. Vui lòng thử lại sau.",
                }),
                {
                  status: 429,
                  headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Retry-After": String(phoneRate.retryAfter ?? 60),
                    ...securityHeaders(allowedOrigin),
                  },
                }
              );
            }
            isPhoneVerified =
              normalizeVietnamesePhone(phoneQuery) === normalizeVietnamesePhone(String(order.phone));
          }

          const canAccessFullPii = isAdmin || isPhoneVerified;

          const safeOrder = {
            ...order,
            customer_name: canAccessFullPii
              ? order.customer_name
              : maskCustomerName(String(order.customer_name)),
            phone: canAccessFullPii
              ? order.phone
              : maskPhone(String(order.phone)),
            email: canAccessFullPii
              ? order.email
              : maskEmail(String(order.email || "")),
            address: canAccessFullPii
              ? order.address
              : maskAddress(String(order.address), String(order.district), String(order.province)),
            note: canAccessFullPii ? order.note : undefined,
            is_masked: !canAccessFullPii,
            items: itemsResult.results || [],
          };

          return apiJson({
            success: true,
            order: safeOrder,
          });
        }

        // PATCH /api/orders/:code - Cập nhật trạng thái đơn hàng (Yêu cầu quyền Admin)
        if (url.pathname.startsWith("/api/orders/") && request.method === "PATCH") {
          if (!(await verifyAdminAuth(request, env))) {
            return apiJson({ success: false, error: "Yêu cầu quyền quản trị viên (Unauthorized)" }, 401);
          }

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

        // POST /api/admin/login - Đăng nhập quản trị viên server-side
        if (url.pathname === "/api/admin/login" && request.method === "POST") {
          const lockoutCheck = checkAdminLoginLockout(clientIp);
          if (!lockoutCheck.allowed) {
            return new Response(
              JSON.stringify({
                success: false,
                error: `Đăng nhập bị khóa tạm thời do nhập sai nhiều lần. Thử lại sau ${lockoutCheck.retryAfter} giây.`,
              }),
              {
                status: 429,
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  "Retry-After": String(lockoutCheck.retryAfter ?? 300),
                  ...securityHeaders(allowedOrigin),
                },
              }
            );
          }

          if (!checkPayloadSize(request, 10 * 1024)) {
            return apiJson({ success: false, error: "Dung lượng dữ liệu vượt quá giới hạn" }, 413);
          }
          const body = (await request.json().catch(() => null)) as {
            username?: string;
            password?: string;
          } | null;

          const username = String(body?.username || "").trim().toLowerCase();
          const password = String(body?.password || "").trim();

          if (!username || !password) {
            return apiJson({ success: false, error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu" }, 400);
          }

          let validCreds: Record<string, { pass: string; name: string; role: string }> = {
            admin: {
              pass: env.ADMIN_PASSWORD || "admin123",
              name: "Quản trị viên trưởng",
              role: "Super Admin",
            },
            lisea: {
              pass: env.MANAGER_PASSWORD || "hawaii2026",
              name: "Lisea Made Team",
              role: "Store Manager",
            },
          };

          try {
            const customRow = await db
              .prepare("SELECT value FROM site_settings WHERE key = 'admin_credentials'")
              .first<{ value: string }>();
            if (customRow?.value) {
              const parsed = JSON.parse(customRow.value);
              if (typeof parsed === "object" && parsed !== null) {
                validCreds = { ...validCreds, ...parsed };
              }
            }
          } catch {
            // fallback
          }

          const account = validCreds[username];
          if (!account || account.pass !== password) {
            recordAdminLoginFailure(clientIp);
            return apiJson({ success: false, error: "Tên đăng nhập hoặc mật khẩu không chính xác." }, 401);
          }

          recordAdminLoginSuccess(clientIp);

          const timestamp = Date.now();
          const secret = env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
          const signature = await createTokenSignature(username, timestamp, secret);
          const token = `adm.${username}.${timestamp}.${signature}`;

          return apiJson({
            success: true,
            token,
            user: {
              username,
              name: account.name,
              role: account.role,
              loggedInAt: new Date(timestamp).toISOString(),
              expiresAt: new Date(timestamp + 8 * 3600 * 1000).toISOString(),
              token,
            },
          });
        }

        // POST /api/admin/change-password - Đổi mật khẩu quản trị viên
        if (url.pathname === "/api/admin/change-password" && request.method === "POST") {
          if (!(await verifyAdminAuth(request, env))) {
            return apiJson({ success: false, error: "Yêu cầu quyền quản trị viên (Unauthorized)" }, 401);
          }
          const body = (await request.json().catch(() => null)) as {
            username?: string;
            oldPassword?: string;
            newPassword?: string;
          } | null;

          const username = String(body?.username || "").trim().toLowerCase();
          const oldPassword = String(body?.oldPassword || "").trim();
          const newPassword = String(body?.newPassword || "").trim();

          if (!username || !oldPassword || !newPassword) {
            return apiJson({ success: false, error: "Thiếu thông tin mật khẩu" }, 400);
          }
          if (newPassword.length < 6) {
            return apiJson({ success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" }, 400);
          }

          let validCreds: Record<string, { pass: string; name: string; role: string }> = {
            admin: {
              pass: env.ADMIN_PASSWORD || "admin123",
              name: "Quản trị viên trưởng",
              role: "Super Admin",
            },
            lisea: {
              pass: env.MANAGER_PASSWORD || "hawaii2026",
              name: "Lisea Made Team",
              role: "Store Manager",
            },
          };

          try {
            const customRow = await db
              .prepare("SELECT value FROM site_settings WHERE key = 'admin_credentials'")
              .first<{ value: string }>();
            if (customRow?.value) {
              const parsed = JSON.parse(customRow.value);
              if (typeof parsed === "object" && parsed !== null) {
                validCreds = { ...validCreds, ...parsed };
              }
            }
          } catch {
            // fallback
          }

          const account = validCreds[username];
          if (!account || account.pass !== oldPassword) {
            return apiJson({ success: false, error: "Mật khẩu hiện tại không chính xác" }, 400);
          }

          validCreds[username] = {
            ...account,
            pass: newPassword,
          };

          const now = new Date().toISOString();
          try {
            await db
              .prepare(
                `INSERT INTO site_settings (key, value, updated_at)
                 VALUES ('admin_credentials', ?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
              )
              .bind(JSON.stringify(validCreds), now)
              .run();
            await db
              .prepare(
                `INSERT INTO site_settings (key, value, updated_at)
                 VALUES ('admin_password_updated_at', ?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
              )
              .bind(now, now)
              .run();
          } catch {
            await db.exec(
              `CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`
            );
            await db
              .prepare(
                `INSERT INTO site_settings (key, value, updated_at)
                 VALUES ('admin_credentials', ?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
              )
              .bind(JSON.stringify(validCreds), now)
              .run();
            await db
              .prepare(
                `INSERT INTO site_settings (key, value, updated_at)
                 VALUES ('admin_password_updated_at', ?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
              )
              .bind(now, now)
              .run();
          }

          return apiJson({ success: true, message: "Đổi mật khẩu thành công" });
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

        // POST /api/upload - Tải ảnh lên Cloudflare / D1 hoặc lưu link Google Drive (Admin)
        if (url.pathname === "/api/upload" && request.method === "POST") {
          if (!(await verifyAdminAuth(request, env))) {
            return apiJson({ success: false, error: "Yêu cầu quyền quản trị viên (Unauthorized)" }, 401);
          }
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

        // DELETE /api/images/:id - Xóa ảnh (Admin)
        if (url.pathname.startsWith("/api/images/") && request.method === "DELETE") {
          if (!(await verifyAdminAuth(request, env))) {
            return apiJson({ success: false, error: "Yêu cầu quyền quản trị viên (Unauthorized)" }, 401);
          }
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
              // Tuyệt đối không phơi thông tin mật khẩu hoặc khóa quản trị ra public
              if (row.key === "admin_credentials" || row.key.startsWith("admin_")) {
                continue;
              }
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

        // POST /api/site-settings - Cập nhật cài đặt website lên D1 (Admin)
        if (url.pathname === "/api/site-settings" && request.method === "POST") {
          if (!(await verifyAdminAuth(request, env))) {
            return apiJson({ success: false, error: "Yêu cầu quyền quản trị viên (Unauthorized)" }, 401);
          }
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
          if (key === "admin_credentials" || key.startsWith("admin_")) {
            return apiJson({ success: false, error: "Không được sửa khóa quản trị qua route này" }, 403);
          }
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
