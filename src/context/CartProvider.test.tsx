import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { CART_STORAGE_KEY, CartProvider } from "@/context/CartProvider";
import { useCart } from "@/context/cart-context";
import type { CartContextValue } from "@/context/cart-context";
import { PRODUCTS } from "@/data/products";
import { describe, expect, it } from "vitest";

/**
 * Harness jsdom: BrowserRouter > CartProvider > page. React 19 defers
 * `root.render` to a macrotask, so every mutation must be followed by
 * `await flush()` before asserting the re-rendered context.
 */
const storage = globalThis.localStorage;

let rendered: CartContextValue | null = null;

function Harness() {
  const value = useCart();
  rendered = value;
  return <div>{value.itemCount}</div>;
}

/** Let React 19 finish the deferred render/re-render. */
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function currentCart(): CartContextValue {
  if (!rendered) {
    throw new Error("CartProvider khong render cò sach them");
  }
  return rendered;
}

/** Render the provider with `rawLines` pre-seeded in localStorage, then run. */
async function withCart(rawLines: unknown[], run: () => Promise<void>) {
  storage?.setItem(CART_STORAGE_KEY, JSON.stringify(rawLines));
  const root = createRoot(document.body);
  root.render(
    <StrictMode>
      <BrowserRouter>
        <CartProvider>
          <Harness />
        </CartProvider>
      </BrowserRouter>
    </StrictMode>,
  );
  try {
    await flush();
    await run();
  } finally {
    root.unmount();
    rendered = null;
  }
}

const productId = PRODUCTS[0].id;
const variantId = PRODUCTS[0].variants[0].id;
const otherVariantId = PRODUCTS[0].variants[1]?.id ?? variantId;
const missingProductId = "san-phem-da-them";

describe("CartProvider", () => {
  it("adds a line and clamps quantity to 1..99", async () => {
    await withCart([], async () => {
      currentCart().addItem(productId, variantId, 2);
      await flush();
      expect(currentCart().lines).toHaveLength(1);
      expect(currentCart().itemCount).toBe(2);

      currentCart().addItem(productId, variantId, 0);
      await flush();
      expect(currentCart().itemCount).toBe(2);

      currentCart().addItem(productId, variantId, 100);
      await flush();
      expect(currentCart().itemCount).toBe(99);
    });
  });

  it("merges quantity for the same product + variant", async () => {
    await withCart([], async () => {
      currentCart().addItem(productId, variantId, 1);
      currentCart().addItem(productId, variantId, 2);
      await flush();
      expect(currentCart().lines).toHaveLength(1);
      expect(currentCart().itemCount).toBe(3);
    });
  });

  it("keeps separate lines per variant", async () => {
    await withCart([], async () => {
      currentCart().addItem(productId, variantId, 1);
      currentCart().addItem(productId, otherVariantId, 4);
      await flush();
      expect(currentCart().lines).toHaveLength(2);
      expect(currentCart().itemCount).toBe(5);
    });
  });

  it("setQuantity never creates a missing line", async () => {
    await withCart([], async () => {
      currentCart().setQuantity(productId, variantId, 3);
      await flush();
      expect(currentCart().lines).toHaveLength(0);
      expect(currentCart().itemCount).toBe(0);
    });
  });

  it("setQuantity 0 removes the line (contract §4)", async () => {
    await withCart(
      [{ productId, variantId, quantity: 2 }],
      async () => {
        expect(currentCart().itemCount).toBe(2);
        currentCart().setQuantity(productId, variantId, 0);
        await flush();
        expect(currentCart().lines).toHaveLength(0);
      },
    );
  });

  it("removeItem on a missing key is a no-op", async () => {
    await withCart(
      [{ productId, variantId, quantity: 2 }],
      async () => {
        currentCart().removeItem(missingProductId, "m");
        await flush();
        expect(currentCart().lines).toHaveLength(1);
        expect(currentCart().itemCount).toBe(2);
      },
    );
  });

  it("clear empties the cart", async () => {
    await withCart(
      [{ productId, variantId, quantity: 2 }],
      async () => {
        currentCart().clear();
        await flush();
        expect(currentCart().lines).toHaveLength(0);
        expect(currentCart().itemCount).toBe(0);
      },
    );
  });

  it("totals come from computeTotals, not a local formula", async () => {
    await withCart(
      [{ productId, variantId, quantity: 2 }],
      async () => {
        const value = currentCart();
        const expected = PRODUCTS[0].price * 2;
        expect(value.totals.subtotal).toBe(expected);
        expect(value.totals.total).toBe(expected + value.totals.shippingFee);
      },
    );
  });

  it("drops lines that no longer exist in the catalog", async () => {
    await withCart(
      [
        { productId: missingProductId, variantId: "m", quantity: 1 },
        { productId, variantId, quantity: 1 },
      ],
      async () => {
        const value = currentCart();
        expect(value.lines).toHaveLength(1);
        expect(value.droppedLineIds).toHaveLength(1);
        expect(value.droppedLineIds[0]).toBe(`${missingProductId}::m`);
      },
    );
  });

  it("dismissDroppedNotice unions instead of overwriting (P1-5)", async () => {
    await withCart(
      [{ productId: missingProductId, variantId: "m", quantity: 1 }],
      async () => {
        expect(currentCart().droppedLineIds).toHaveLength(1);
        currentCart().dismissDroppedNotice();
        await flush();
        expect(currentCart().droppedLineIds).toHaveLength(0);

        currentCart().addItem(`${missingProductId}-b`, "l", 1);
        await flush();
        const dropped = currentCart().droppedLineIds;
        expect(dropped).toHaveLength(1);
        expect(dropped[0]).toBe(`${missingProductId}-b::l`);
      },
    );
  });

  it("corrupt localStorage data is ignored, never thrown", async () => {
    storage?.setItem(CART_STORAGE_KEY, "{not json");
    const root = createRoot(document.body);
    root.render(
      <StrictMode>
        <BrowserRouter>
          <CartProvider>
            <Harness />
          </CartProvider>
        </BrowserRouter>
      </StrictMode>,
    );
    try {
      await flush();
      expect(currentCart().lines).toHaveLength(0);
      expect(currentCart().rawLines).toHaveLength(0);
    } finally {
      root.unmount();
      rendered = null;
    }
  });
});
