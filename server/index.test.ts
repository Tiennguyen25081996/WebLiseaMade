import { describe, it, expect, vi, beforeEach } from "vitest";
import worker, { initDb, resetDbInit, type D1Database, type D1PreparedStatement, type Env } from "./index";

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
        return {
          mime_type: "image/png",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
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

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "test.png",
        mimeType: "image/png",
        file: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { success: boolean; image: { id: string; url: string } };
    expect(data.success).toBe(true);
    expect(data.image.url).toContain("/api/images/");
    expect(execCalls.some((sql) => sql.includes("INSERT INTO media_files"))).toBe(true);
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

  it("DELETE /api/images/:id removes image from media_files", async () => {
    const { db, execCalls } = createMockDb();
    const env: Env = { DB: db };

    const req = new Request("http://localhost/api/images/img_1", { method: "DELETE" });
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
});
