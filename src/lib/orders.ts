import type { CartLine, CheckoutInfo, PlacedOrder } from "@/types";

const PAYMENT_METHODS = new Set<string>(["cod", "bank-transfer", "e-wallet"]);

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
    const now = Date.now();
    return parsed.filter(isPlacedOrder).filter((order) => isOrderRecent(order, now));
  } catch {
    return [];
  }
}

/**
 * S1 (soft PII reduction): đơn cò PII ten client, so retention co cap.
 * Don mo than MAX_ORDER_AGE_DAYS cha pruned khi doc — client-side, không
 * backend, nên this is mitigation only.
 */
export const MAX_ORDER_AGE_DAYS = 90;

function isOrderRecent(order: PlacedOrder, now: number): boolean {
  const created = Date.parse(order.createdAt);
  if (!Number.isFinite(created)) return false;
  return now - created <= MAX_ORDER_AGE_DAYS * 24 * 60 * 60 * 1000;
}

export const MAX_SAVED_ORDERS = 50;

/** P2-5: cap list + S2: return false khi write that fail (caller must not lie). */
export function saveOrder(
  order: PlacedOrder,
  storage: Storage | undefined = safeStorage(),
): boolean {
  if (!storage) return false;
  try {
    const all = [order, ...readOrders(storage)].slice(0, MAX_SAVED_ORDERS);
    storage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

/** S1: allow the customer to erase their own saved orders. */
export function clearOrders(storage: Storage | undefined = safeStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(ORDERS_STORAGE_KEY);
    return true;
  } catch {
    return false;
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

import {
  isValidEmail as isValidEmailVal,
  isValidVietnamesePhone,
  validateCheckoutForm,
  type CheckoutFormErrors,
} from "@/lib/validation";

export function isValidPhone(phone: string): boolean {
  return isValidVietnamesePhone(phone);
}

export function isValidEmail(email: string): boolean {
  return isValidEmailVal(email);
}

export type CheckoutErrors = CheckoutFormErrors;

export function validateCheckout(info: CheckoutInfo): CheckoutErrors {
  return validateCheckoutForm(info);
}

export function hasErrors(errors: CheckoutErrors): boolean {
  return Object.keys(errors).length > 0;
}

function isPlacedOrder(value: unknown): value is PlacedOrder {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Partial<PlacedOrder>;
  if (typeof o.code !== "string" || typeof o.createdAt !== "string") return false;
  if (!Array.isArray(o.lines)) return false;
  const linesOk = (o.lines as unknown[]).every((line) => {
    if (typeof line !== "object" || line === null) return false;
    const l = line as Partial<CartLine>;
    return (
      typeof l.productId === "string" &&
      typeof l.variantId === "string" &&
      typeof l.quantity === "number" &&
      Number.isFinite(l.quantity)
    );
  });
  if (!linesOk) return false;
  if (typeof o.totals !== "object" || o.totals === null) return false;
  if (typeof o.info !== "object" || o.info === null) return false;
  const info = o.info as Partial<CheckoutInfo>;
  if (!PAYMENT_METHODS.has(o.info.paymentMethod as string)) return false;
  return (
    typeof info.fullName === "string" &&
    typeof info.phone === "string" &&
    typeof info.address === "string"
  );
}
