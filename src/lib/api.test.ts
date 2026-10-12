import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrderApi, getOrderByCodeApi, trackCustomerEvent, toCreateOrderPayload } from "./api";
import type { PlacedOrder } from "@/types";
import { ORDERS_STORAGE_KEY } from "./orders";

describe("api client", () => {
  const sampleOrder: PlacedOrder = {
    code: "LM-TEST01",
    createdAt: "2026-10-07T10:00:00.000Z",
    lines: [
      {
        productId: "dam-hoa-nhi",
        variantId: "size-s",
        quantity: 2,
        unitPrice: 350000,
        lineTotal: 700000,
        product: {
          id: "dam-hoa-nhi",
          name: "Đầm hoa nhí",
          price: 350000,
          category: "vay-dam",
          images: [],
          shortDescription: "",
          description: "",
          materials: [],
          variants: [],
          rating: 5,
          reviewCount: 0,
          badges: [],
        },
        variant: {
          id: "size-s",
          label: "Size S",
          kind: "size",
          inStock: true,
        },
      },
    ],
    totals: {
      subtotal: 700000,
      shippingFee: 0,
      discount: 0,
      total: 700000,
    },
    info: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      email: "a@example.com",
      address: "123 Đường ABC",
      province: "Hà Nội",
      district: "Cầu Giấy",
      note: "Giao giờ hành chính",
      paymentMethod: "cod",
    },
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("toCreateOrderPayload transforms order correctly", () => {
    const payload = toCreateOrderPayload(sampleOrder);
    expect(payload.code).toBe("LM-TEST01");
    expect(payload.customerName).toBe("Nguyễn Văn A");
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].productName).toBe("Đầm hoa nhí");
    expect(payload.items[0].price).toBe(350000);
  });

  it("createOrderApi falls back to localStorage on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network offline"));

    const res = await createOrderApi(sampleOrder);
    expect(res.success).toBe(true);
    expect(res.syncedToRemote).toBe(false);

    // Verify localStorage has order
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(raw).toContain("LM-TEST01");
  });

  it("createOrderApi returns syncedToRemote: true on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, order: { id: "ord_1", code: "LM-TEST01" } }),
    } as Response);

    const res = await createOrderApi(sampleOrder);
    expect(res.success).toBe(true);
    expect(res.syncedToRemote).toBe(true);
  });

  it("getOrderByCodeApi fetches from remote if available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        order: {
          code: "LM-TEST01",
          customer_name: "Nguyễn Văn A",
          phone: "0901234567",
          total: 700000,
          items: [
            {
              product_id: "dam-hoa-nhi",
              product_name: "Đầm hoa nhí",
              variant_id: "size-s",
              variant_label: "Size S",
              price: 350000,
              quantity: 2,
              line_total: 700000,
            },
          ],
        },
      }),
    } as Response);

    const res = await getOrderByCodeApi("LM-TEST01");
    expect(res.source).toBe("remote");
    expect(res.order?.code).toBe("LM-TEST01");
    expect(res.order?.totals.total).toBe(700000);
    expect(res.order?.lines).toHaveLength(1);
    expect(res.order?.status).toBe("pending");
    // Verify product has images
    expect(res.order?.lines[0].product.images).toBeDefined();
  });

  it("getOrderByCodeApi ưu tiên status đang xử lý từ localOrder khi admin đã cập nhật", async () => {
    // Admin cập nhật status sang processing trong localOrder
    const updatedLocalOrder: PlacedOrder = {
      ...sampleOrder,
      status: "processing",
    };
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([updatedLocalOrder]));

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        order: {
          code: "LM-TEST01",
          status: "pending", // remote vẫn là pending
          customer_name: "Nguyễn Văn A",
          items: [],
        },
      }),
    } as Response);

    const res = await getOrderByCodeApi("LM-TEST01");
    expect(res.source).toBe("remote");
    // Phải lấy status "processing" từ localOrder mà Admin vừa đổi
    expect(res.order?.status).toBe("processing");
  });

  it("getOrderByCodeApi tự động lấy ảnh sản phẩm từ catalog khi remote order items không có ảnh", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        order: {
          code: "LM-TEST01",
          items: [
            {
              product_id: "p1", // sản phẩm có trong catalog
              product_name: "Áo sơ mi hoa dừa",
              quantity: 1,
              price: 389000,
            },
          ],
        },
      }),
    } as Response);

    const res = await getOrderByCodeApi("LM-TEST01");
    expect(res.order?.lines[0].product.images.length).toBeGreaterThan(0);
    expect(res.order?.lines[0].product.images[0]).toContain("product-feat-1.png");
  });

  it("getOrderByCodeApi falls back to local when remote 404 or fails", async () => {
    // Put into localStorage
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([sampleOrder]));

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const res = await getOrderByCodeApi("LM-TEST01");
    expect(res.source).toBe("local");
    expect(res.order?.code).toBe("LM-TEST01");
  });

  it("trackCustomerEvent triggers non-blocking fetch or beacon", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
    } as Response);

    trackCustomerEvent("view_product", { productId: "p1" });
    expect(fetchSpy).toHaveBeenCalled();
  });
});
