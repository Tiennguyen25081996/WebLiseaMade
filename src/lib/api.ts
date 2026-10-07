import type { PlacedOrder } from "@/types";
import { findOrderByCode, saveOrder } from "@/lib/orders";

/**
 * Interface cho đơn hàng gửi lên /api/orders
 */
export interface CreateOrderPayload {
  code: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  province: string;
  district: string;
  note?: string;
  paymentMethod: "cod" | "bank-transfer" | "e-wallet";
  subtotal: number;
  shippingFee: number;
  total: number;
  items: Array<{
    productId: string;
    variantId: string;
    productName: string;
    variantLabel: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }>;
}

/**
 * Chuyển đổi PlacedOrder từ client sang payload API
 */
export function toCreateOrderPayload(order: PlacedOrder): CreateOrderPayload {
  return {
    code: order.code,
    customerName: order.info.fullName,
    phone: order.info.phone,
    email: order.info.email || undefined,
    address: order.info.address,
    province: order.info.province,
    district: order.info.district,
    note: order.info.note || undefined,
    paymentMethod: order.info.paymentMethod,
    subtotal: order.totals.subtotal,
    shippingFee: order.totals.shippingFee,
    total: order.totals.total,
    items: order.lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      productName: l.product?.name || l.productId,
      variantLabel: l.variant?.label || l.variantId,
      price: l.unitPrice,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
  };
}

/**
 * Tạo đơn hàng qua API POST /api/orders.
 * Luôn fallback lưu vào localStorage để không bao giờ mất đơn của khách hàng.
 */
export async function createOrderApi(order: PlacedOrder): Promise<{
  success: boolean;
  order: PlacedOrder;
  syncedToRemote: boolean;
  error?: string;
}> {
  // Luôn ghi localStorage trước/song song để đảm bảo client giữ đơn
  const localSaved = saveOrder(order);

  const payload = toCreateOrderPayload(order);
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.success) {
        return {
          success: true,
          order,
          syncedToRemote: true,
        };
      }
    }

    // Server phản hồi lỗi HTTP
    return {
      success: localSaved,
      order,
      syncedToRemote: false,
      error: `Server status: ${res.status}`,
    };
  } catch (err: unknown) {
    // Offline hoặc network error
    return {
      success: localSaved,
      order,
      syncedToRemote: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Tra cứu đơn hàng theo mã qua GET /api/orders/:code.
 * Nếu không tìm thấy hoặc offline thì tìm trong localStorage.
 */
export async function getOrderByCodeApi(code: string): Promise<{
  order?: PlacedOrder;
  source: "remote" | "local" | "none";
  error?: string;
}> {
  const cleanCode = code.trim().toUpperCase();

  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.success && data.order) {
        const raw = data.order;
        // Chuẩn hóa dữ liệu từ backend D1 về định dạng PlacedOrder
        const remoteOrder: PlacedOrder = {
          code: raw.code,
          createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
          totals: {
            subtotal: Number(raw.subtotal) || 0,
            shippingFee: Number(raw.shipping_fee ?? raw.shippingFee) || 0,
            discount: 0,
            total: Number(raw.total) || 0,
          },
          info: {
            fullName: raw.customer_name || raw.customerName || "",
            phone: raw.phone || "",
            email: raw.email || "",
            address: raw.address || "",
            province: raw.province || "",
            district: raw.district || "",
            note: raw.note || "",
            paymentMethod: raw.payment_method || raw.paymentMethod || "cod",
          },
          lines: Array.isArray(raw.items)
            ? raw.items.map((item: Record<string, unknown>) => ({
                productId: String(item.product_id ?? item.productId ?? ""),
                variantId: String(item.variant_id ?? item.variantId ?? ""),
                quantity: Number(item.quantity) || 1,
                unitPrice: Number(item.price) || 0,
                lineTotal: Number(item.line_total ?? item.lineTotal) || 0,
                product: {
                  id: String(item.product_id ?? item.productId ?? ""),
                  name: String(item.product_name ?? item.productName ?? ""),
                  price: Number(item.price) || 0,
                  category: "ao" as const,
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
                  id: String(item.variant_id ?? item.variantId ?? ""),
                  label: String(item.variant_label ?? item.variantLabel ?? ""),
                  kind: "size" as const,
                  inStock: true,
                },
              }))
            : [],
        };

        return {
          order: remoteOrder,
          source: "remote",
        };
      }
    }
  } catch {
    // Lỗi mạng hoặc server không phản hồi -> tiếp tục fallback xuống local
  }

  // Fallback sang localStorage
  const localOrder = findOrderByCode(cleanCode);
  if (localOrder) {
    return {
      order: localOrder,
      source: "local",
    };
  }

  return {
    order: undefined,
    source: "none",
    error: "Không tìm thấy đơn hàng",
  };
}

/**
 * Ghi nhận sự kiện hành vi khách hàng non-blocking (keepalive).
 */
export function trackCustomerEvent(
  type: string,
  data: Record<string, unknown> = {},
): void {
  try {
    const payload = JSON.stringify({
      eventType: type,
      payload: data,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/events", blob);
      if (sent) return;
    }

    // Fallback sang fetch với keepalive
    fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Non-blocking: nuốt lỗi âm thầm để không ảnh hưởng UX người dùng
    });
  } catch {
    // Bỏ qua lỗi tracking
  }
}
