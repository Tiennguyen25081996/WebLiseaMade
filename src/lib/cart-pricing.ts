import type { CartLine, CartLineDetailed, Product, Totals } from "@/types";

/**
 * Quy tắc tính tiền — MỘT nguồn sự thật duy nhất cho giỏ hàng và thanh toán.
 * cart-dev và checkout-dev đều import từ đây, không tự viết lại công thức.
 *
 * Quy ước (có ghi chú rõ để shop chỉnh sau):
 *  - Miễn phí vận chuyển cho đơn từ 500.000 ₫.
 *  - Đơn dưới ngưỡng: phí đồng giá 30.000 ₫.
 *  - `discount` hiện là 0 vì shop chưa công bố mã giảm giá.
 */
export const FREE_SHIPPING_THRESHOLD = 500_000;
export const FLAT_SHIPPING_FEE = 30_000;

export function computeShippingFee(subtotal: number, lineCount: number): number {
  if (lineCount === 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}

/** Join các dòng thô trong localStorage với catalog hiện tại. */
export function hydrateLines(
  rawLines: readonly CartLine[],
  products: readonly Product[],
): { lines: CartLineDetailed[]; droppedLineIds: string[] } {
  const lines: CartLineDetailed[] = [];
  const droppedLineIds: string[] = [];

  const productById = new Map(products.map((p) => [p.id, p]));

  for (const raw of rawLines) {
    const product = productById.get(raw.productId);
    const variant = product?.variants.find((v) => v.id === raw.variantId);

    // Sản phẩm/biến thể không tồn tại hoặc biến thể không thuộc sản phẩm -> loại khỏi giỏ
    if (!product || !variant) {
      droppedLineIds.push(`${raw.productId}::${raw.variantId}`);
      continue;
    }

    const quantity = clampQuantity(raw.quantity);
    if (quantity <= 0) {
      droppedLineIds.push(`${raw.productId}::${raw.variantId}`);
      continue;
    }

    lines.push({
      productId: raw.productId,
      variantId: raw.variantId,
      quantity,
      product,
      variant,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
    });
  }

  return { lines, droppedLineIds };
}

/** Số lượng hợp lệ: số nguyên, 1..99. */
export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const n = Math.floor(value);
  if (n < 1) return 0;
  return Math.min(n, 99);
}

export function computeTotals(lines: readonly CartLineDetailed[]): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const shippingFee = computeShippingFee(subtotal, lines.length);
  const discount = 0;
  return {
    subtotal,
    shippingFee,
    discount,
    total: subtotal + shippingFee - discount,
  };
}

export function computeItemCount(lines: readonly CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

/** Số tiền còn thiếu để được miễn phí vận chuyển; 0 nếu đã đạt. */
export function amountToFreeShipping(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}
