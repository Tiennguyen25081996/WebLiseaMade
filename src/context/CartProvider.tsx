import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CartContext, lineKey, type CartContextValue } from "./cart-context";
import { PRODUCTS } from "@/data/products";
import type { CartLine } from "@/types";
import {
  clampQuantity,
  computeItemCount,
  computeTotals,
  hydrateLines,
} from "@/lib/cart-pricing";
import { safeStorage } from "@/lib/orders";
import { trackCustomerEvent } from "@/lib/api";

/** Key localStorage — theo công ước ở CONTRACT.md mục 4. */
export const CART_STORAGE_KEY = "liseamade.cart.v1";

/**
 * Trạng thái nội bộ giỏ hàng: rawLines = dữ liệu persist (định dạng CartLine),
 * dismissedIds = id các dòng "dropped" mà user đã bỏ qua (UI state, không persist).
 */
interface CartState {
  rawLines: CartLine[];
  dismissedIds: string[];
}

/** Đọc dữ liệu từ localStorage — mảng rỗng/không phải mảng thì fallback []. */
function readRawLines(): CartLine[] {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce<CartLine[]>((acc, item) => {
      const line = toCartLine(item);
      return line ? [...acc, line] : acc;
    }, []);
  } catch {
    return [];
  }
}

/** Ép một item JSON thành CartLine; trả null khi sai cấu trúc. */
function toCartLine(value: unknown): CartLine | null {
  if (typeof value !== "object" || value === null) return null;
  const o = value as Record<string, unknown>;
  if (typeof o.productId !== "string" || typeof o.variantId !== "string") return null;
  const quantity = typeof o.quantity === "number" ? o.quantity : 0;
  return { productId: o.productId, variantId: o.variantId, quantity };
}

/** Lưu rawLines; bọc try/catch cho chế độ riêng tư của Safari (CONTRACT mục 4). */
function writeRawLines(lines: CartLine[]): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Hết dung lượng hoặc bị chặn: giỏ vẫn giữ in-memory, không để crash.
  }
}

/**
 * Provider giỏ hàng: khởi tạo state một lần, cung cấp context cho useCart().
 * Các mutator (addItem, ...) gọi setState -> React re-render subtree ->
 * Header badge + CartPage tự cập nhật số lượng.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({
    rawLines: readRawLines(),
    dismissedIds: [],
  });

  const hydrated = useMemo(
    () => hydrateLines(state.rawLines, PRODUCTS),
    [state.rawLines],
  );

  useEffect(() => {
    writeRawLines(state.rawLines);
  }, [state.rawLines]);

  const value = useMemo<CartContextValue>(() => {
    const { lines, droppedLineIds } = hydrated;
    const visibleDropped = droppedLineIds.filter(
      (id) => !state.dismissedIds.includes(id),
    );

    return {
      lines,
      itemCount: computeItemCount(lines),
      totals: computeTotals(lines),
      addItem: (productId, variantId, quantity = 1) => {
        const q = clampQuantity(quantity);
        if (q === 0) return;
        trackCustomerEvent("add_to_cart", {
          productId,
          variantId,
          quantity: q,
        });
        setState((prev) => {
          const key = lineKey(productId, variantId);
          const index = prev.rawLines.findIndex(
            (l) => lineKey(l.productId, l.variantId) === key,
          );
          if (index === -1) {
            return {
              ...prev,
              rawLines: [
                ...prev.rawLines,
                { productId, variantId, quantity: q },
              ],
            };
          }
          const merged = [...prev.rawLines];
          merged[index] = {
            ...merged[index],
            quantity: clampQuantity(merged[index].quantity + q),
          };
          return { ...prev, rawLines: merged };
        });
      },
      removeItem: (productId, variantId) => {
        const key = lineKey(productId, variantId);
        setState((prev) => {
          // Bailout: key khong exist -> same state object, subtree khong re-render.
          if (!prev.rawLines.some((l) => lineKey(l.productId, l.variantId) === key)) {
            return prev;
          }
          return {
            ...prev,
            rawLines: prev.rawLines.filter(
              (l) => lineKey(l.productId, l.variantId) !== key,
            ),
          };
        });
      },
      setQuantity: (productId, variantId, quantity) => {
        const key = lineKey(productId, variantId);
        const q = clampQuantity(quantity);
        setState((prev) => {
          const exists = prev.rawLines.some(
            (l) => lineKey(l.productId, l.variantId) === key,
          );
          // "set" khong create line moi (P3-1): them add() moi them them them.
          if (!exists) return prev;
          if (q === 0) {
            return {
              ...prev,
              rawLines: prev.rawLines.filter(
                (l) => lineKey(l.productId, l.variantId) !== key,
              ),
            };
          }
          return {
            ...prev,
            rawLines: prev.rawLines.map((l) =>
              lineKey(l.productId, l.variantId) === key
                ? { ...l, quantity: q }
                : l,
            ),
          };
        });
      },
      clear: () => {
        setState((prev) =>
          prev.rawLines.length === 0 && prev.dismissedIds.length === 0
            ? prev
            // N-2: empty cart moi reset dismissed notice moi, ne khong supress
            // the notice again khi user re-add a line that becomes dropped.
            : { ...prev, rawLines: [], dismissedIds: [] },
        );
      },
      droppedLineIds: visibleDropped,
      dismissDroppedNotice: () => {
        setState((prev) =>
          visibleDropped.every((id) => prev.dismissedIds.includes(id))
            ? prev
            : {
                ...prev,
                dismissedIds: Array.from(
                  new Set([...prev.dismissedIds, ...visibleDropped]),
                ),
              },
        );
      },
      rawLines: state.rawLines,
    };
  }, [hydrated, state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
