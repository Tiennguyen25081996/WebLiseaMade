import { CartSummary } from "@/components/cart/CartSummary";
import { LineItemRow } from "@/components/cart/LineItemRow";
import { computeItemCount } from "@/lib/cart-pricing";
import { OrderTrackingTimeline } from "./OrderTrackingTimeline";
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
      className="rounded-hair border-1 border-sand-200 bg-sand-100 px-4 sm:px-6 py-6 space-y-6"
    >
      {/* Khối Trạng thái & Hành trình vận chuyển ("Hàng đi đến đâu") */}
      <OrderTrackingTimeline
        status={order.status}
        createdAt={order.createdAt}
        info={order.info}
        trackingCode={order.trackingCode}
        carrier={order.carrier}
      />

      <div className="border-t border-sand-200 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow uppercase tracking-[0.16em] text-ink-500">
            Kiện hàng: <span className="font-medium text-ink-900 tabular-nums">{order.code}</span>
          </p>
          <span className="text-xs text-ink-600 font-medium">
            {computeItemCount(order.lines)} sản phẩm
          </span>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
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
    </div>
  );
}
