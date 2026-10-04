import { createContext, useContext } from "react";
import type { CartLineDetailed, CartLine, Totals } from "@/types";

/**
 * HỢP ĐỒNG (contract) của giỏ hàng — do Lead sở hữu, không đổi nếu chưa báo.
 * Phần triển khai nằm ở `src/context/CartProvider.tsx`.
 */
export interface CartContextValue {
  /** Dòng giỏ hàng đã join với catalog, giữ nguyên thứ tự thêm vào. */
  lines: CartLineDetailed[];
  /** Tổng số lượng sản phẩm (cộng dồn quantity). */
  itemCount: number;
  totals: Totals;
  /** Thêm vào giỏ; nếu đã có productId+variantId thì cộng dồn quantity. */
  addItem: (productId: string, variantId: string, quantity?: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  /** Đặt số lượng tuyệt đối; quantity <= 0 thì xoá dòng. */
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  clear: () => void;
  /** id các dòng đã bị loại khỏi giỏ vì không còn tồn tại trong catalog. */
  droppedLineIds: string[];
  dismissDroppedNotice: () => void;
  /** Dòng thô đọc từ localStorage, dùng cho test/diagnostics. */
  rawLines: CartLine[];
}

export const CartContext = createContext<CartContextValue | null>(null);

/** Key duy nhất cho một dòng giỏ hàng. */
export function lineKey(productId: string, variantId: string): string {
  return `${productId}::${variantId}`;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart() phải được dùng bên trong <CartProvider>");
  }
  return ctx;
}
