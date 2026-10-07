/**
 * Module Validation & Sanitize cho WebLiseaMade
 * Đảm bảo tính toàn vẹn dữ liệu, chống XSS Injection và kiểm soát boundary inputs.
 */

import type { CheckoutInfo, PaymentMethod } from "@/types";

/**
 * Danh sách đầu số di động hợp lệ tại Việt Nam (10 số).
 * Bao gồm các mạng: Viettel (03x, 086, 096, 097, 098), Mobifone (07x, 089, 090, 093),
 * Vinaphone (081-085, 088, 091, 094), Vietnamobile (056, 058, 092), Itelecom/Wintel/VNSKY...
 */
const VIETNAMESE_PHONE_REGEX = /^(?:03[2-9]|05[2689]|07[06-9]|08[1-9]|09[0-46-9])\d{7}$/;

/** Regex email theo chuẩn RFC 5322 cơ bản */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Định dạng mã đơn hàng LM-XXXXXX */
const ORDER_CODE_REGEX = /^LM-[A-HJ-NP-Z0-9]{6}$/i;

/** Các phương thức thanh toán hợp lệ */
const VALID_PAYMENT_METHODS: Set<PaymentMethod> = new Set(["cod", "bank-transfer", "e-wallet"]);

/**
 * Loại bỏ các ký tự nguy hiểm có thể gây XSS Injection (thẻ HTML, javascript:, on... events)
 */
export function sanitizeText(input: string, maxLength?: number): string {
  if (typeof input !== "string") return "";

  let cleaned = input
    .replace(/<[^>]*>/g, "") // Xóa mọi thẻ HTML tags
    .replace(/javascript:/gi, "") // Xóa protocol javascript:
    .replace(/on\w+\s*=/gi, ""); // Xóa event handlers như onerror=, onclick=

  cleaned = cleaned.trim();

  if (maxLength && maxLength > 0) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

/**
 * Chuẩn hóa số điện thoại:
 * - Chuyển +84 ở đầu thành 0
 * - Bỏ mọi khoảng trắng, dấu gạch ngang, dấu chấm, dấu ngoặc
 */
export function normalizeVietnamesePhone(raw: string): string {
  if (typeof raw !== "string") return "";
  let phone = raw.trim().replace(/[\s.\-()]/g, "");
  if (phone.startsWith("+84")) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith("84") && phone.length === 11) {
    phone = `0${phone.slice(2)}`;
  } else if (phone.length === 9 && /^[35789]/.test(phone)) {
    // 9 số nếu bỏ số 0 đầu thì tự động thêm 0
    phone = `0${phone}`;
  }
  return phone;
}

/**
 * Kiểm tra số điện thoại có đúng chuẩn di động 10 số của Việt Nam hay không
 */
export function isValidVietnamesePhone(raw: string): boolean {
  const normalized = normalizeVietnamesePhone(raw);
  return VIETNAMESE_PHONE_REGEX.test(normalized);
}

/**
 * Kiểm tra họ tên:
 * - 2 đến 100 ký tự sau khi trim
 * - Không được chứa thẻ HTML nguy hiểm
 */
export function validateCustomerName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: "Vui lòng nhập họ và tên (ít nhất 2 ký tự)." };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Họ và tên không được vượt quá 100 ký tự." };
  }
  if (/[<>]/.test(trimmed)) {
    return { valid: false, error: "Họ và tên chứa ký tự không hợp lệ." };
  }
  return { valid: true };
}

/**
 * Kiểm tra email (nếu có nhập)
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return true; // Email là tuỳ chọn
  if (trimmed.length > 100) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Kiểm tra địa chỉ chi tiết:
 * - 10 đến 250 ký tự
 * - Không chứa thẻ HTML
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  const trimmed = address.trim();
  if (trimmed.length < 10) {
    return { valid: false, error: "Vui lòng nhập địa chỉ chi tiết (tối thiểu 10 ký tự để giao hàng)." };
  }
  if (trimmed.length > 250) {
    return { valid: false, error: "Địa chỉ không được vượt quá 250 ký tự." };
  }
  if (/[<>]/.test(trimmed)) {
    return { valid: false, error: "Địa chỉ chứa ký tự không hợp lệ." };
  }
  return { valid: true };
}

/**
 * Kiểm tra ghi chú (nếu có): tối đa 500 ký tự
 */
export function validateNote(note: string): { valid: boolean; error?: string } {
  if (note.length > 500) {
    return { valid: false, error: "Ghi chú không được vượt quá 500 ký tự." };
  }
  return { valid: true };
}

/**
 * Kiểm tra mã đơn hàng LM-XXXXXX
 */
export function isValidOrderCode(code: string): boolean {
  return ORDER_CODE_REGEX.test(code.trim());
}

export interface CheckoutFormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  province?: string;
  district?: string;
  note?: string;
}

/**
 * Validate toàn bộ form checkout phía client
 */
export function validateCheckoutForm(info: CheckoutInfo): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  const nameCheck = validateCustomerName(info.fullName);
  if (!nameCheck.valid) {
    errors.fullName = nameCheck.error;
  }

  if (!info.phone.trim()) {
    errors.phone = "Vui lòng nhập số điện thoại nhận hàng.";
  } else if (!isValidVietnamesePhone(info.phone)) {
    errors.phone = "Số điện thoại không hợp lệ (cần 10 số theo đầu số di động Việt Nam).";
  }

  if (info.email?.trim() && !isValidEmail(info.email)) {
    errors.email = "Email chưa đúng định dạng.";
  }

  const addrCheck = validateAddress(info.address);
  if (!addrCheck.valid) {
    errors.address = addrCheck.error;
  }

  if (!info.province.trim()) {
    errors.province = "Vui lòng chọn Tỉnh/Thành phố.";
  }

  if (!info.district.trim()) {
    errors.district = "Vui lòng chọn Quận/Huyện.";
  }

  if (info.note) {
    const noteCheck = validateNote(info.note);
    if (!noteCheck.valid) {
      errors.note = noteCheck.error;
    }
  }

  return errors;
}

export interface ValidatedOrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface ValidatedOrderPayload {
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  province: string;
  district: string;
  note: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: ValidatedOrderItem[];
}

/**
 * Validate chi tiết payload đơn hàng cho cả Frontend và Backend Worker
 */
export function validateOrderPayload(raw: unknown): {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: ValidatedOrderPayload;
} {
  const errors: Record<string, string> = {};

  if (!raw || typeof raw !== "object") {
    return { valid: false, errors: { payload: "Dữ liệu payload không đúng định dạng" } };
  }

  const p = raw as Record<string, unknown>;

  // 1. Mã đơn
  const code = String(p.code ?? "").trim();
  if (!isValidOrderCode(code)) {
    errors.code = "Mã đơn hàng không hợp lệ (định dạng LM-XXXXXX).";
  }

  // 2. Tên khách hàng
  const name = String(p.customerName ?? "");
  const nameCheck = validateCustomerName(name);
  if (!nameCheck.valid) {
    errors.customerName = nameCheck.error!;
  }

  // 3. Số điện thoại
  const phone = String(p.phone ?? "");
  if (!isValidVietnamesePhone(phone)) {
    errors.phone = "Số điện thoại di động không hợp lệ.";
  }

  // 4. Email
  const email = p.email ? String(p.email).trim() : "";
  if (email && !isValidEmail(email)) {
    errors.email = "Email không hợp lệ.";
  }

  // 5. Địa chỉ
  const address = String(p.address ?? "");
  const addrCheck = validateAddress(address);
  if (!addrCheck.valid) {
    errors.address = addrCheck.error!;
  }

  // 6. Tỉnh/Huyện
  const province = String(p.province ?? "").trim();
  if (!province) errors.province = "Tỉnh/Thành phố không được để trống.";
  const district = String(p.district ?? "").trim();
  if (!district) errors.district = "Quận/Huyện không được để trống.";

  // 7. Ghi chú
  const note = p.note ? String(p.note).trim() : "";
  if (note && note.length > 500) {
    errors.note = "Ghi chú không được vượt quá 500 ký tự.";
  }

  // 8. Phương thức thanh toán
  const paymentMethod = String(p.paymentMethod ?? "") as PaymentMethod;
  if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
    errors.paymentMethod = "Phương thức thanh toán không hợp lệ.";
  }

  // 9. Items
  const items = p.items;
  if (!Array.isArray(items) || items.length === 0) {
    errors.items = "Đơn hàng phải chứa ít nhất một sản phẩm.";
  }

  let calculatedSubtotal = 0;
  const validatedItems: ValidatedOrderItem[] = [];

  if (Array.isArray(items)) {
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i] as Record<string, unknown>;
      const pId = String(it.productId ?? "").trim();
      const vId = String(it.variantId ?? "").trim();
      const pName = sanitizeText(String(it.productName ?? "Sản phẩm"), 150);
      const vLabel = sanitizeText(String(it.variantLabel ?? "Mặc định"), 50);
      const qty = Number(it.quantity);
      const price = Number(it.price);

      if (!pId || !vId) {
        errors[`items[${i}]`] = "Sản phẩm hoặc biến thể không xác định.";
        continue;
      }

      if (!Number.isInteger(qty) || qty <= 0 || qty > 99) {
        errors[`items[${i}].quantity`] = "Số lượng sản phẩm phải là số nguyên từ 1 đến 99.";
        continue;
      }

      if (typeof price !== "number" || price < 0 || !Number.isFinite(price)) {
        errors[`items[${i}].price`] = "Giá sản phẩm không hợp lệ.";
        continue;
      }

      const expectedLineTotal = Math.round(price * qty);
      calculatedSubtotal += expectedLineTotal;

      validatedItems.push({
        productId: pId,
        variantId: vId,
        productName: pName,
        variantLabel: vLabel,
        price: Math.round(price),
        quantity: qty,
        lineTotal: expectedLineTotal,
      });
    }
  }

  // 10. Tính toán tổng tiền & kiểm tra gian lận (Anti-tampering)
  const shippingFee = Number(p.shippingFee) || 0;
  if (shippingFee < 0) {
    errors.shippingFee = "Phí vận chuyển không hợp lệ.";
  }

  const expectedTotal = calculatedSubtotal + shippingFee;
  const clientTotal = Number(p.total);

  if (Number.isFinite(clientTotal) && Math.abs(clientTotal - expectedTotal) > 1) {
    errors.total = "Tổng tiền thanh toán không khớp với danh sách mặt hàng.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      code,
      customerName: sanitizeText(name, 100),
      phone: normalizeVietnamesePhone(phone),
      email: email ? sanitizeText(email, 100) : null,
      address: sanitizeText(address, 250),
      province: sanitizeText(province, 100),
      district: sanitizeText(district, 100),
      note: note ? sanitizeText(note, 500) : null,
      paymentMethod,
      subtotal: calculatedSubtotal,
      shippingFee,
      total: expectedTotal,
      items: validatedItems,
    },
  };
}
