import { describe, it, expect, vi, beforeEach } from "vitest";
import worker, {
  initDb,
  resetDbInit,
  resetRateLimit,
  type D1Database,
  type D1PreparedStatement,
  type Env,
} from "./index";

function createMockDb(): { db: D1Database; execCalls: string[]; batchCalls: D1PreparedStatement[][] } {
  const execCalls: string[] = [];
  const batchCalls: D1PreparedStatement[][] = [];

  const mockStmt = (sql: string, bindings: unknown[] = []): D1PreparedStatement => ({
    bind(...values: unknown[]) {
      return mockStmt(sql, values);
    },
    async first<T = Record<string, unknown>>() {
      if (sql.includes("FROM orders WHERE code = ?")) {
        return {
          id: "ord_1",
          code: String(bindings[0] ?? "LM-123456"),
          customer_name: "Nguyễn Văn A",
          phone: "0901234567",
          email: "nguyen@example.com",
          address: "123 Đường ABC",
          district: "Ba Đình",
          province: "Hà Nội",
          note: "Giao giờ hành chính",
          subtotal: 100000,
          shipping_fee: 20000,
          discount: 0,
          total: 120000,
          status: "pending",
          created_at: "2026-10-11T00:00:00Z",
          updated_at: "2026-10-11T00:00:00Z",
        } as T;
      }
      if (sql.includes("FROM media_files WHERE id = ?")) {
        if (bindings[0] === "gdrive_1") {
          return {
            mime_type: "image/jpeg",
            data: null,
            url: "https://lh3.googleusercontent.com/d/1XyZ",
          } as T;
        }
        return {
          mime_type: "image/png",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          url: "/api/images/img_1",
        } as T;
      }
      return null;
    },
    async all<T = Record<string, unknown>>() {
      // S1: query by order_id now, not order_code
      if (sql.includes("FROM order_items WHERE order_id = ?")) {
        return {
          success: true,
          results: [
            {
              id: 1,
              order_id: bindings[0],
              product_id: "ao-1",
              variant_id: "v-1",
              product_name: "Áo",
              variant_label: "Size M",
              price: 100000,
              quantity: 1,
              line_total: 100000,
            },
          ] as T[],
        };
      }
      if (sql.includes("FROM media_files")) {
        return {
          success: true,
          results: [
            {
              id: "img_1",
              filename: "sample.png",
              mime_type: "image/png",
              size: 256,
              url: "/api/images/img_1",
              created_at: "2026-10-11T00:00:00Z",
            },
          ] as T[],
        };
      }
      if (sql.includes("FROM site_settings")) {
        return {
          success: true,
          results: [
            { key: "theme", value: JSON.stringify("dark") },
            { key: "admin_credentials", value: JSON.stringify({ admin: { pass: "supersecret" } }) },
          ] as T[],
        };
      }
      return { success: true, results: [] as T[] };
    },
    async run<T = Record<string, unknown>>() {
      execCalls.push(sql);
      return { success: true, results: [] as T[] };
    },
  });

  const db: D1Database = {
    prepare(query: string) {
      return mockStmt(query);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]) {
      batchCalls.push(statements);
      return statements.map(() => ({ success: true, results: [] as T[] }));
    },
    async exec(query: string) {
      execCalls.push(query);
      return { count: 1, duration: 1 };
    },
  };

  return { db, execCalls, batchCalls };
}

describe("server worker and D1 schema", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetDbInit();
    resetRateLimit();
  });

  it("initDb executes single exec call with all CREATE TABLE/INDEX statements", async () => {
    const { db, execCalls } = createMockDb();
    await initDb(db);
    // S7: initDb now uses single db.exec() instead of multiple .prepare().run()
    expect(execCalls.length).toBe(1);
    const ddl = execCalls[0];
    expect(ddl).toContain("CREATE TABLE IF NOT EXISTS orders");
    expect(ddl).toContain("CREATE TABLE IF NOT EXISTS order_items");
    expect(ddl).toContain("CREATE TABLE IF NOT EXISTS customer_events");
    // S10: discount column
    expect(ddl).toContain("discount");
    // S11: payment_method CHECK
    expect(ddl).toContain("CHECK (payment_method IN");
    // S1: order_id FK instead of order_code
    expect(ddl).toContain("order_id TEXT NOT NULL");
    // S6: ip_hash instead of ip
    expect(ddl).toContain("ip_hash TEXT");
  });

  it("initDb only runs once (idempotent)", async () => {
    const { db, execCalls } = createMockDb();
    await initDb(db);
    await initDb(db);
    expect(execCalls.length).toBe(1);
  });

  it("handles OPTIONS CORS preflight", async () => {
    const req = new Request("http://localhost/api/orders", { method: "OPTIONS" });
    const env: Env = {};
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("POST /api/orders creates order with discount and batch transaction", async () => {
    const { db, batchCalls } = createMockDb();
    const env: Env = { DB: db };

    const body = {
      code: "LM-ABC123",
      customerName: "Nguyễn Văn B",
      phone: "0901234567",
      email: "b@example.com",
      address: "123 Đường A, Phường B, Quận C",
      province: "Hà Nội",
      district: "Ba Đình",
      paymentMethod: "cod",
      subtotal: 100000,
      shippingFee: 20000,
      discount: 0,
      total: 120000,
      items: [
        {
          productId: "ao-1",
          variantId: "v-1",
          productName: "Áo sơ mi",
          variantLabel: "Size L",
          price: 100000,
          quantity: 1,
          lineTotal: 100000,
        },
      ],
    };

    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { success: boolean; order: { code: string } };
    expect(data.success).toBe(true);
    expect(data.order.code).toBe("LM-ABC123");
    expect(batchCalls.length).toBe(1);
    expect(batchCalls[0].length).toBe(2); // 1 order + 1 item
  });

  it("GET /api/orders/:code retrieves order and items by order.id", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/orders/LM-ABC123", { method: "GET" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; order: { code: string; items: unknown[] } };
    expect(data.success).toBe(true);
    expect(data.order.code).toBe("LM-ABC123");
    expect(data.order.items.length).toBe(1);
  });

  it("PATCH /api/orders/:code updates order status in D1 with admin auth", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    // Thử không có token -> 401
    const unauthReq = new Request("http://localhost/api/orders/LM-ABC123", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "processing" }),
    });
    const unauthRes = await worker.fetch(unauthReq, env);
    expect(unauthRes.status).toBe(401);

    // Có token -> 200
    const req = new Request("http://localhost/api/orders/LM-ABC123", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-admin-token",
      },
      body: JSON.stringify({ status: "processing" }),
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; status: string };
    expect(data.success).toBe(true);
    expect(data.status).toBe("confirmed");
  });

  it("POST /api/events logs event with hashed IP, not raw IP", async () => {
    const { db, execCalls } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CF-Connecting-IP": "192.168.1.1",
      },
      body: JSON.stringify({
        eventType: "view_product",
        payload: { productId: "ao-1" },
      }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { success: boolean };
    expect(data.success).toBe(true);
    // S6: SQL should reference ip_hash column, not ip
    expect(execCalls.some((sql) => sql.includes("ip_hash"))).toBe(true);
  });

  it("POST /api/upload uploads image base64 and saves to media_files", async () => {
    const { db, execCalls } = createMockDb();
    const env: Env = { DB: db };

    // Không có admin auth -> 401
    const unauthReq = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: "test.png", mimeType: "image/png" }),
    });
    const unauthRes = await worker.fetch(unauthReq, env);
    expect(unauthRes.status).toBe(401);

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-admin-token",
      },
      body: JSON.stringify({
        filename: "test.png",
        mimeType: "image/png",
        file: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(201);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    const data = (await res.json()) as { success: boolean; image: { id: string; url: string } };
    expect(data.success).toBe(true);
    expect(data.image.url).toContain("/api/images/");
    expect(execCalls.some((sql) => sql.includes("INSERT INTO media_files"))).toBe(true);
  });

  it("POST /api/upload lưu trực tiếp link ảnh Google Drive vào D1 với data = NULL (tiết kiệm quota)", async () => {
    const { db, execCalls } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-admin-token",
      },
      body: JSON.stringify({
        url: "https://lh3.googleusercontent.com/d/1a2b3c4d5e",
        filename: "gdrive-summer-dress.jpg",
        mimeType: "image/jpeg",
        size: 512000,
      }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { success: boolean; image: { id: string; url: string; filename: string } };
    expect(data.success).toBe(true);
    expect(data.image.url).toBe("https://lh3.googleusercontent.com/d/1a2b3c4d5e");
    expect(data.image.filename).toBe("gdrive-summer-dress.jpg");
    expect(execCalls.some((sql) => sql.includes("INSERT INTO media_files"))).toBe(true);
  });

  it("POST /api/upload từ chối file có chữ ký (magic bytes) không khớp", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-admin-token",
      },
      body: JSON.stringify({
        filename: "fake.png",
        mimeType: "image/png",
        file: btoa("plain text disguised as png"),
      }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { success: boolean; error: string };
    expect(data.success).toBe(false);
    expect(data.error).toContain("Nội dung file không khớp");
  });

  it("GET /api/images lists uploaded images", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/images", { method: "GET" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; images: unknown[] };
    expect(data.success).toBe(true);
    expect(data.images.length).toBe(1);
  });

  it("GET /api/images/:id returns binary image response with proper headers", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/images/img_1", { method: "GET" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toContain("immutable");
  });

  it("GET /api/images/:id redirects to Google Drive URL when data is null", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/images/gdrive_1", { method: "GET" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://lh3.googleusercontent.com/d/1XyZ");
  });

  it("DELETE /api/images/:id removes image from media_files with admin auth", async () => {
    const { db, execCalls } = createMockDb();
    const env: Env = { DB: db };

    // Không có admin auth -> 401
    const unauthReq = new Request("http://localhost/api/images/img_1", { method: "DELETE" });
    const unauthRes = await worker.fetch(unauthReq, env);
    expect(unauthRes.status).toBe(401);

    const req = new Request("http://localhost/api/images/img_1", {
      method: "DELETE",
      headers: { "Authorization": "Bearer test-admin-token" },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; id: string };
    expect(data.success).toBe(true);
    expect(execCalls.some((sql) => sql.includes("DELETE FROM media_files"))).toBe(true);
  });

  it("returns 500 when no DB binding", async () => {
    const req = new Request("http://localhost/api/orders", { method: "POST" });
    const env: Env = {};
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(500);
  });

  it("returns 404 for unknown API route", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };
    const req = new Request("http://localhost/api/unknown", { method: "GET" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(404);
  });

  it("chống DoS: trả về 429 khi gửi request quá tần suất cho phép (Rate Limit)", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    // Giả lập spam 45 requests POST nhạy cảm từ cùng một IP
    let lastRes: Response | null = null;
    for (let i = 0; i < 45; i++) {
      const req = new Request("http://localhost/api/site-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": "1.2.3.4",
          "Authorization": "Bearer test-admin-token",
        },
        body: JSON.stringify({ key: "test", value: "ok" }),
      });
      lastRes = await worker.fetch(req, env);
    }

    expect(lastRes?.status).toBe(429);
    expect(lastRes?.headers.get("Retry-After")).toBeDefined();
    const json = (await lastRes?.json()) as { success: boolean; error: string };
    expect(json.success).toBe(false);
    expect(json.error).toContain("tần suất yêu cầu quá cao");
  });

  it("chống DoS/OOM: trả về 413 khi kích thước payload vượt ngưỡng cho phép", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "200000", // > 150KB
      },
      body: JSON.stringify({ huge: "data" }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(413);
    const json = (await res.json()) as { success: boolean; error: string };
    expect(json.success).toBe(false);
    expect(json.error).toContain("vượt quá giới hạn");
  });

  it("bổ sung đầy đủ security headers chống clickjacking và MIME-sniffing", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };
    const req = new Request("http://localhost/api/site-settings", { method: "GET" });
    const res = await worker.fetch(req, env);

    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("POST /api/admin/login xác thực tài khoản và cấp signed token", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; token: string; user: { username: string } };
    expect(data.success).toBe(true);
    expect(data.token).toMatch(/^adm\.admin\.\d+\./);
    expect(data.user.username).toBe("admin");
  });

  it("POST /api/admin/login từ chối khi nhập sai mật khẩu", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "sai_mat_khau" }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(401);
    const data = (await res.json()) as { success: boolean; error: string };
    expect(data.success).toBe(false);
    expect(data.error).toContain("không chính xác");
  });

  it("GET /api/orders/:code che giấu PII (tên, sđt, địa chỉ) cho người tra cứu công khai", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/orders/LM-123456", { method: "GET" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      success: boolean;
      order: {
        customer_name: string;
        phone: string;
        email: string;
        address: string;
        is_masked: boolean;
      };
    };

    expect(data.success).toBe(true);
    expect(data.order.is_masked).toBe(true);
    expect(data.order.customer_name).toContain("***");
    expect(data.order.phone).toContain("****");
    expect(data.order.address).toContain("***");
    expect((data.order as Record<string, unknown>).note).toBeUndefined();
  });

  it("GET /api/orders/:code mở khóa PII khi cung cấp đúng số điện thoại đặt hàng", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    // Số điện thoại trong mock DB là 0901234567
    const req = new Request("http://localhost/api/orders/LM-123456?phone=0901234567", { method: "GET" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      success: boolean;
      order: {
        customer_name: string;
        phone: string;
        email: string;
        address: string;
        note?: string;
        is_masked: boolean;
      };
    };

    expect(data.success).toBe(true);
    expect(data.order.is_masked).toBe(false);
    expect(data.order.customer_name).toBe("Nguyễn Văn A");
    expect(data.order.phone).toBe("0901234567");
    expect(data.order.address).toBe("123 Đường ABC");
    expect(data.order.note).toBe("Giao giờ hành chính");
  });

  it("POST /api/orders từ chối khi phát hiện gian lận đơn giá (price tampering)", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    // p1 trong PRODUCTS có giá 389000, kẻ tấn công sửa thành 1000
    const tamperedBody = {
      code: "LM-TAMPER",
      customerName: "Hacker X",
      phone: "0901234567",
      email: "x@example.com",
      address: "123 Đường H",
      province: "Hà Nội",
      district: "Ba Đình",
      paymentMethod: "cod",
      subtotal: 1000,
      shippingFee: 20000,
      discount: 0,
      total: 21000,
      items: [
        {
          productId: "p1",
          variantId: "v-p1-m",
          productName: "Áo sơ mi họa tiết Hawaii",
          variantLabel: "M",
          price: 1000, // Sai lệch với niêm yết 389000
          quantity: 1,
          lineTotal: 1000,
        },
      ],
    };

    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tamperedBody),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { success: boolean; error: string };
    expect(data.success).toBe(false);
    expect(data.error).toContain("không khớp giá niêm yết");
  });

  it("POST /api/orders trả về 409 conflict khi mã đơn hàng bị trùng lặp", async () => {
    const { db } = createMockDb();
    // Giả lập lỗi UNIQUE constraint từ D1 batch
    db.batch = vi.fn().mockRejectedValue(new Error("UNIQUE constraint failed: orders.code"));
    const env: Env = { DB: db };

    const body = {
      code: "LM-DUP123",
      customerName: "Khách Trùng",
      phone: "0901234567",
      email: "k@example.com",
      address: "123 Đường K",
      province: "Hà Nội",
      district: "Ba Đình",
      paymentMethod: "cod",
      subtotal: 100000,
      shippingFee: 20000,
      discount: 0,
      total: 120000,
      items: [
        {
          productId: "test-prod",
          variantId: "v-1",
          productName: "Áo test",
          variantLabel: "M",
          price: 100000,
          quantity: 1,
          lineTotal: 100000,
        },
      ],
    };

    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(409);
    const data = (await res.json()) as { success: boolean; codeConflict: boolean };
    expect(data.success).toBe(false);
    expect(data.codeConflict).toBe(true);
  });

  it("GET /api/site-settings lọc bỏ admin_credentials để không rò rỉ ra public", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/site-settings", { method: "GET" });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { success: boolean; settings: Record<string, unknown> };
    expect(data.success).toBe(true);
    expect(data.settings.theme).toBe("dark");
    expect(data.settings.admin_credentials).toBeUndefined();
  });

  it("POST /api/site-settings cấm ghi đè admin_credentials trả về 403", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/site-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-admin-token",
      },
      body: JSON.stringify({ key: "admin_credentials", value: { hacked: true } }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(403);
    const data = (await res.json()) as { success: boolean; error: string };
    expect(data.success).toBe(false);
    expect(data.error).toContain("Không được sửa khóa quản trị");
  });

  it("POST /api/admin/login khóa tạm thời 429 sau 5 lần nhập sai mật khẩu liên tiếp", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    // Thử 5 lần sai
    for (let i = 0; i < 5; i++) {
      const badReq = new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CF-Connecting-IP": "10.0.0.99" },
        body: JSON.stringify({ username: "admin", password: `wrong_${i}` }),
      });
      const badRes = await worker.fetch(badReq, env);
      expect(badRes.status).toBe(401);
    }

    // Lần thứ 6 bị khóa 429
    const lockReq = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "10.0.0.99" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    });
    const lockRes = await worker.fetch(lockReq, env);
    expect(lockRes.status).toBe(429);
    const data = (await lockRes.json()) as { success: boolean; error: string };
    expect(data.success).toBe(false);
    expect(data.error).toContain("khóa tạm thời");
  });

  it("POST /api/orders từ chối khi client truyền discount > 0 (chống gian lận giảm giá)", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const body = {
      code: "LM-DSC001",
      customerName: "Khách Gian Lận",
      phone: "0901234567",
      email: "gianlan@example.com",
      address: "123 Đường ABC",
      province: "Hà Nội",
      district: "Ba Đình",
      paymentMethod: "cod",
      subtotal: 389000,
      shippingFee: 20000,
      discount: 100000, // Tự ý giảm giá 100k
      total: 309000,
      items: [
        {
          productId: "p1",
          variantId: "v-p1-m",
          productName: "Áo sơ mi họa tiết Hawaii",
          variantLabel: "M",
          price: 389000,
          quantity: 1,
          lineTotal: 389000,
        },
      ],
    };

    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { success: boolean; error: string };
    expect(data.success).toBe(false);
    expect(data.error).toContain("giảm giá");
  });

  it("POST /api/orders từ chối khi số lượng mặt hàng vượt quá 30 items", async () => {
    const { db } = createMockDb();
    const env: Env = { DB: db };

    const items = Array.from({ length: 31 }, (_, i) => ({
      productId: "p1",
      variantId: `v-${i}`,
      productName: `Sản phẩm ${i}`,
      variantLabel: "Standard",
      price: 389000,
      quantity: 1,
      lineTotal: 389000,
    }));

    const body = {
      code: "LM-MAX030",
      customerName: "Khách Quá Tải",
      phone: "0901234567",
      email: "over@example.com",
      address: "123 Đường ABC",
      province: "Hà Nội",
      district: "Ba Đình",
      paymentMethod: "cod",
      subtotal: 389000 * 31,
      shippingFee: 0,
      discount: 0,
      total: 389000 * 31,
      items,
    };

    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { success: boolean; error: string };
    expect(data.success).toBe(false);
    expect(data.error).toContain("30 mặt hàng");
  });
});
