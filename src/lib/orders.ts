import type { CheckoutInfo, PlacedOrder } from "@/types";

export const ORDERS_STORAGE_KEY = "liseamade.orders.v1";

/** Mã đơn dạng "LM-XXXXXX" — bảng chữ cái bỏ ký tự dễ nhầm (0/O, 1/I). */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderCode(): string {
  let code = "";
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(6);
    cryptoObj.getRandomValues(bytes);
    for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  } else {
    // Fallback cho môi trường không có Web Crypto (test cũ, trình duyệt quá cũ).
    for (let i = 0; i < 6; i += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
  }
  return `LM-${code}`;
}

/** Đọc danh sách đơn đã lưu; trả [] nếu dữ liệu hỏng thay vì ném lỗi. */
export function readOrders(storage: Storage | undefined = safeStorage()): PlacedOrder[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPlacedOrder);
  } catch {
    return [];
  }
}

export function saveOrder(
  order: PlacedOrder,
  storage: Storage | undefined = safeStorage(),
): void {
  if (!storage) return;
  try {
    const all = [order, ...readOrders(storage)];
    storage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Hết dung lượng hoặc chế độ riêng tư: bỏ qua, không chặn luồng đặt hàng.
  }
}

export function findOrderByCode(
  code: string,
  storage: Storage | undefined = safeStorage(),
): PlacedOrder | undefined {
  const target = code.trim().toUpperCase();
  return readOrders(storage).find((o) => o.code.toUpperCase() === target);
}

/** storage có thể bị chặn (Safari private mode) -> luôn truy cập qua try/catch. */
export function safeStorage(): Storage | undefined {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.length >= 9 && digits.length <= 11;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export interface CheckoutErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function validateCheckout(info: CheckoutInfo): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (info.fullName.trim().length < 2) {
    errors.fullName = "Vui lòng nhập họ tên (ít nhất 2 ký tự).";
  }
  if (!isValidPhone(info.phone)) {
    errors.phone = "Số điện thoại chưa hợp lệ (9–11 chữ số).";
  }
  if (info.email.trim() && !isValidEmail(info.email)) {
    errors.email = "Email chưa đúng định dạng.";
  }
  if (info.address.trim().length < 10) {
    errors.address = "Vui lòng nhập địa chỉ chi tiết (ít nhất 10 ký tự).";
  }
  return errors;
}

export function hasErrors(errors: CheckoutErrors): boolean {
  return Object.keys(errors).length > 0;
}

function isPlacedOrder(value: unknown): value is PlacedOrder {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Partial<PlacedOrder>;
  return (
    typeof o.code === "string" &&
    typeof o.createdAt === "string" &&
    Array.isArray(o.lines) &&
    typeof o.totals === "object" &&
    o.totals !== null
  );
}
