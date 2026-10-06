import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/cart-context";

interface AddToCartButtonProps {
  /** id san phem (slug) — same id used in route `/san-pham/<id>`. */
  productId: string;
  /** id variant (size/màu) — required because cart line = product + variant. */
  variantId: string;
  /** So lang them; default 1. `clampQuantity` will bound to 1..99. */
  quantity?: number;
  /** Text visible on button. Keep Vietnamese. */
  label?: string;
  /** true khi variant het line -> button disabled, `addItem` khong go. */
  disabled?: boolean;
  ariaDisabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Button them san phem gio hang. It owns the cart mutation so callers
 * (PDP, catalog) only pass ids — they never touch `CartProvider` directly.
 */
export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  label = "Them gio hang",
  disabled = false,
  ariaDisabled,
  size = "md",
  className = "",
}: AddToCartButtonProps) {
  const cart = useCart();

  return (
    <Button
      variant="primary"
      size={size}
      className={className}
      disabled={disabled}
      ariaDisabled={ariaDisabled}
      onClick={() => {
        if (disabled) return;
        cart.addItem(productId, variantId, quantity);
      }}
    >
      {label}
    </Button>
  );
}
