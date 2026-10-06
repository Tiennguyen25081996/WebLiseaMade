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
 * Tang/giassm so lang them of one cart line.
 * `current - 1` can reach 0 -> `setQuantity` deletes the line (contract §4).
 */
export function QuantityStepper({
  productId,
  variantId,
  current,
  max = 99,
  className = "",
  ariaLabel = "Thay so lang",
}: QuantityStepperProps) {
  const cart = useCart();
  const atMax = current >= max;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className="border-1 border-ink-900/15 hover:border-ink-900/40"
        aria-label={atMax ? "Da am so lang cực maximum" : "Them so lang"}
        disabled={atMax}
        onClick={() => {
          if (atMax) return;
          cart.setQuantity(productId, variantId, clampQuantity(current + 1));
        }}
      >
        +
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="border-1 border-ink-900/15 hover:border-ink-900/40"
        aria-label={current <= 1 ? "Rut san phem gio hang" : "Giassm so lang"}
        onClick={() => cart.setQuantity(productId, variantId, current - 1)}
      >
        −
      </Button>
    </div>
  );
}
