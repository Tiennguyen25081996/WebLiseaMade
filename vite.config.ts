import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Dev server middleware cho /api/* khi chạy local với `npm run dev`.
 * Lưu trữ đơn hàng và sự kiện vào file local (.data/orders.json) để test không cần Cloudflare.
 */
function apiDevPlugin(): Plugin {
  const dataDir = path.resolve(import.meta.dirname, ".data");
  const ordersFile = path.join(dataDir, "orders.json");
  const eventsFile = path.join(dataDir, "events.json");

  const readJson = (file: string): unknown[] => {
    try {
      if (!fs.existsSync(file)) return [];
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      return [];
    }
  };

  const writeJson = (file: string, data: unknown[]) => {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  };

  return {
    name: "vite-api-dev-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        // POST /api/orders
        if (pathname === "/api/orders" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const order = JSON.parse(body);
              const orders = readJson(ordersFile) as Array<{ code: string }>;
              const existingIdx = orders.findIndex((o) => o.code === order.code);
              if (existingIdx >= 0) orders[existingIdx] = order;
              else orders.unshift(order);
              writeJson(ordersFile, orders);

              res.setHeader("Content-Type", "application/json");
              res.statusCode = 201;
              res.end(JSON.stringify({ success: true, order }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        // GET /api/orders/:code
        if (pathname.startsWith("/api/orders/") && req.method === "GET") {
          const code = decodeURIComponent(pathname.replace("/api/orders/", "")).trim().toUpperCase();
          const orders = readJson(ordersFile) as Array<{ code: string }>;
          const found = orders.find((o) => o.code.toUpperCase() === code);
          res.setHeader("Content-Type", "application/json");
          if (found) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, order: found }));
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ success: false, error: "Không tìm thấy đơn hàng" }));
          }
          return;
        }

        // POST /api/events
        if (pathname === "/api/events" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const event = JSON.parse(body);
              const events = readJson(eventsFile);
              events.unshift({ ...event, timestamp: new Date().toISOString() });
              writeJson(eventsFile, events.slice(0, 100));
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch {
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});
