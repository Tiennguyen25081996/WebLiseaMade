import type { PlacedOrder, OrderStatus } from "@/types";
import { findOrderByCode, saveOrder, updateOrderStatus } from "@/lib/orders";
import { getAdminProducts } from "@/lib/admin-store";
import { getAdminHeaders } from "@/lib/admin-auth";
import { PRODUCTS } from "@/data/products";

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
  discount: number;
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
    discount: order.totals.discount,
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
  codeConflict?: boolean;
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
    const errData = await res.json().catch(() => null);
    const codeConflict = res.status === 409 || errData?.codeConflict === true;
    return {
      success: false,
      order,
      syncedToRemote: false,
      codeConflict,
      error: errData?.error || `Server status: ${res.status}`,
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
export async function getOrderByCodeApi(
  code: string,
  phone?: string,
): Promise<{
  order?: PlacedOrder;
  source: "remote" | "local" | "none";
  error?: string;
  isMasked?: boolean;
}> {
  const cleanCode = code.trim().toUpperCase();
  const localOrder = findOrderByCode(cleanCode);

  try {
    const query = phone ? `?phone=${encodeURIComponent(phone.trim())}` : "";
    const res = await fetch(`/api/orders/${encodeURIComponent(cleanCode)}${query}`);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.success && data.order) {
        const raw = data.order;
        const allProducts = getAdminProducts();

        const normalizeStatus = (st: string | undefined): OrderStatus => {
          if (st === "confirmed") return "processing";
          if (st === "completed") return "delivered";
          if (st === "processing" || st === "shipping" || st === "delivered" || st === "cancelled") {
            return st;
          }
          return "pending";
        };

        // Ưu tiên trạng thái đã tiến triển từ remote, nếu remote còn 'pending' thì dùng localOrder đã cập nhật
        const rawStatusNormalized = normalizeStatus(raw.status);
        const resolvedStatus: OrderStatus =
          rawStatusNormalized !== "pending"
            ? rawStatusNormalized
            : (localOrder?.status || rawStatusNormalized);

        const resolvedTrackingCode =
          localOrder?.trackingCode || raw.tracking_code || raw.trackingCode || undefined;
        const resolvedCarrier =
          localOrder?.carrier || raw.carrier || "spx";

        // Chuẩn hóa dữ liệu từ backend D1 về định dạng PlacedOrder
        const remoteOrder: PlacedOrder = {
          code: raw.code,
          createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
          status: resolvedStatus,
          trackingCode: resolvedTrackingCode,
          carrier: resolvedCarrier,
          totals: {
            subtotal: Number(raw.subtotal) || 0,
            shippingFee: Number(raw.shipping_fee ?? raw.shippingFee) || 0,
            discount: Number(raw.discount) || 0,
            total: Number(raw.total) || 0,
          },
          info: {
            fullName: raw.customer_name || raw.customerName || localOrder?.info.fullName || "",
            phone: raw.phone || localOrder?.info.phone || "",
            email: raw.email || localOrder?.info.email || "",
            address: raw.address || localOrder?.info.address || "",
            province: raw.province || localOrder?.info.province || "",
            district: raw.district || localOrder?.info.district || "",
            note: raw.note || localOrder?.info.note || "",
            paymentMethod: raw.payment_method || raw.paymentMethod || localOrder?.info.paymentMethod || "cod",
          },
          lines: Array.isArray(raw.items)
            ? raw.items.map((item: Record<string, unknown>) => {
                const pId = String(item.product_id ?? item.productId ?? "");
                const localLine = localOrder?.lines.find((l) => l.productId === pId);
                const catalogProduct =
                  allProducts.find((p) => p.id === pId) ||
                  PRODUCTS.find((p) => p.id === pId);

                const images =
                  localLine?.product?.images && localLine.product.images.length > 0
                    ? localLine.product.images
                    : catalogProduct?.images && catalogProduct.images.length > 0
                      ? catalogProduct.images
                      : [];

                return {
                  productId: pId,
                  variantId: String(item.variant_id ?? item.variantId ?? ""),
                  quantity: Number(item.quantity) || 1,
                  unitPrice: Number(item.price) || 0,
                  lineTotal: Number(item.line_total ?? item.lineTotal) || 0,
                  product: {
                    id: pId,
                    name: String(item.product_name ?? item.productName ?? catalogProduct?.name ?? pId),
                    price: Number(item.price) || catalogProduct?.price || 0,
                    category: catalogProduct?.category || ("ao" as const),
                    images,
                    shortDescription: catalogProduct?.shortDescription || "",
                    description: catalogProduct?.description || "",
                    materials: catalogProduct?.materials || [],
                    variants: catalogProduct?.variants || [],
                    rating: catalogProduct?.rating || 5,
                    reviewCount: catalogProduct?.reviewCount || 0,
                    badges: catalogProduct?.badges || [],
                  },
                  variant: {
                    id: String(item.variant_id ?? item.variantId ?? ""),
                    label: String(item.variant_label ?? item.variantLabel ?? localLine?.variant?.label ?? ""),
                    kind: (localLine?.variant?.kind || "size") as "size" | "color",
                    swatch: localLine?.variant?.swatch,
                    inStock: true,
                  },
                };
              })
            : localOrder?.lines || [],
        };

        // Đồng bộ ngược lại localStorage nếu trạng thái remote mới hơn
        if (localOrder && resolvedStatus !== localOrder.status) {
          updateOrderStatus(cleanCode, resolvedStatus);
        }

        return {
          order: remoteOrder,
          source: "remote",
          isMasked: Boolean(raw.is_masked),
        };
      }
    }
  } catch {
    // Lỗi mạng hoặc server không phản hồi -> tiếp tục fallback xuống local
  }

  // Fallback sang localStorage
  if (localOrder) {
    return {
      order: localOrder,
      source: "local",
      isMasked: false,
    };
  }

  return {
    order: undefined,
    source: "none",
    error: "Không tìm thấy đơn hàng",
  };
}

/**
 * Cập nhật trạng thái đơn hàng (đồng bộ cả LocalStorage và Backend D1).
 */
export async function updateOrderStatusApi(
  code: string,
  newStatus: OrderStatus,
): Promise<boolean> {
  // Cập nhật localStorage ngay lập tức
  updateOrderStatus(code, newStatus);

  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify({ status: newStatus }),
    });
    return res.ok;
  } catch {
    return false;
  }
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
