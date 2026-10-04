import { CartSummary } from "@/components/cart/CartSummary";
import { LineItemRow } from "@/components/cart/LineItemRow";
import { formatDateTime } from "@/lib/format";
import { computeItemCount } from "@/lib/cart-pricing";
import type { PlacedOrder } from "@/types";

interface PlacedOrderCardProps {
  /** Don da tim from `findOrderByCode` — already validated by `isPlacedOrder`. */
  order: PlacedOrder;
}

/**
 * Detail of one placed order, shared by the success page and the lookup page.
 * Lines are rendered WITHOUT the +/- stepper (an order is already fixed).
 */
export function PlacedOrderCard({ order }: PlacedOrderCardProps) {
  return (
    <div
      role="group"
      aria-label="Dong don"
      className="rounded-hair border-1 border-sand-200 bg-sand-100 px-6 py-6"
    >
      <p className="text-eyebrow uppercase tracking-[0.16em] text-ink-500">
        Mã don: <span className="font-medium text-ink-900 tabular-nums">{order.code}</span>
      </p>
      <p className="mt-2 text-xs text-ink-500">
        Dat hang than-toan: {formatDateTime(order.createdAt)}
      </p>

      <ul className="mt-5 flex flex-col gap-3">
        {order.lines.map((line) => (
          <LineItemRow
            key={`${line.productId}::${line.variantId}`}
            line={line}
            showStepper={false}
          />
        ))}
      </ul>

      <div className="mt-5 border-t-1 border-sand-200 pt-4">
        <CartSummary totals={order.totals} itemCount={computeItemCount(order.lines)} />
      </div>
    </div>
  );
}
