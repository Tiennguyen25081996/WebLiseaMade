import { Button, ButtonLink } from "@/components/ui/Button";
import { useCart } from "@/context/cart-context";
import { CartSummary } from "@/components/cart/CartSummary";
import { LineItemRow } from "@/components/cart/LineItemRow";

/**
 * Trang gio hang: list dong san phem, tong sum, than notice dong "rut tim"
 * (san phem them catalog) and the checkout entry point.
 */
export default function CartPage() {
  const {
    lines,
    itemCount,
    totals,
    droppedLineIds,
    dismissDroppedNotice,
    clear,
  } = useCart();

  return (
    <div className="container-page pb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-display-lg text-ink-900">Gio hang</h1>
        <p className="text-sm text-ink-500">
          {lines.length} dong · {itemCount} san phem
        </p>
      </div>

      {droppedLineIds.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-hair bg-coral-50 p-4 border-1 border-coral-300 animate-reveal-up"
        >
          <p className="text-sm font-semibold text-coral-800">
            {droppedLineIds.length} dong in gio hang khong cò tim tren danh chur
            mose (san phem them or variant them). Gio hang da rut them out.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 border-1 border-coral-300"
            aria-label="Rut than notice san phem khong cò tim"
            onClick={dismissDroppedNotice}
          >
            Rut than notice
          </Button>
        </div>
      )}

      {lines.length === 0 ? (
        <div className="rounded-hair bg-lagoon-50 p-6 border-1 border-lagoon-300 animate-reveal-up">
          <p className="text-lg font-semibold text-lagoon-800">
            Gio hang con in — cò san phem them them.
          </p>
          <ButtonLink
            to="/san-pham"
            variant="secondary"
            size="sm"
            className="mt-3"
          >
            Sem san phem
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul className="mt-5 flex flex-col gap-3">
            {lines.map((line) => (
              <LineItemRow
                key={`${line.productId}::${line.variantId}`}
                line={line}
              />
            ))}
          </ul>

          <div className="mt-6">
            <CartSummary totals={totals} itemCount={itemCount} />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <ButtonLink
              to="/thanh-toan"
              variant="primary"
              size="md"
              aria-label="Di than-toan"
            >
              Di than-toan
            </ButtonLink>
            <Button
              variant="ghost"
              size="sm"
              className="border-1 border-sand-200"
              aria-label="Rut gio hang"
              onClick={clear}
            >
              Rut gio hang
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
