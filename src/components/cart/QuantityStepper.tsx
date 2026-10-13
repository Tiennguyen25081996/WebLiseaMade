import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/cart-context";
import { clampQuantity } from "@/lib/cart-pricing";

interface QuantityStepperProps {
  productId: string;
  variantId: string;
  /** Quantity currently shown for this line (from `cart.lines`). */
  current: number;
  /** Max allowed; `clampQuantity` still enforces 1..99 as a safety net. */
  max?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Tăng / giảm số lượng sản phẩm trong dòng giỏ hàng.
 * `current - 1` về 0 sẽ xóa dòng khỏi giỏ hàng.
 */
export function QuantityStepper({
  productId,
  variantId,
  current,
  max = 99,
  className = "",
  ariaLabel = "Thay đổi số lượng",
}: QuantityStepperProps) {
  const cart = useCart();
  const atMax = current >= max;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 border border-sand-300 rounded-hair bg-sand-50/50 p-1 ${className}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center border-0 hover:bg-sand-200/60 text-ink-900 transition-colors"
        aria-label={current <= 1 ? "Xóa sản phẩm khỏi giỏ hàng" : "Giảm số lượng"}
        onClick={() => cart.setQuantity(productId, variantId, current - 1)}
      >
        −
      </Button>
      <span
        aria-live="polite"
        className="min-w-7 px-1 text-center text-sm font-semibold text-ink-900 select-none"
      >
        {current}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center border-0 hover:bg-sand-200/60 text-ink-900 transition-colors disabled:opacity-40"
        aria-label={atMax ? "Đã đạt số lượng tối đa" : "Tăng số lượng"}
        disabled={atMax}
        onClick={() => {
          if (atMax) return;
          cart.setQuantity(productId, variantId, clampQuantity(current + 1));
        }}
      >
        +
      </Button>
    </div>
  );
}
