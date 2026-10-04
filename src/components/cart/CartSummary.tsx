import { TruckIcon } from "@/components/ui/icons";
import { SITE } from "@/data/site";
import { formatVnd } from "@/lib/format";
import { amountToFreeShipping } from "@/lib/cart-pricing";
import type { Totals } from "@/types";

interface CartSummaryProps {
  /** `computeTotals(lines)` — never recomputed here (single source of truth). */
  totals: Totals;
  /** Tổng số lượng sản phẩm in gio (cogn `computeItemCount(lines)`). */
  itemCount: number;
}

/**
 * Tong sum gio hang / than-toan.
 * Phan thung CHAN UOC LICH: shop chưa publish chính thung riang,
 * ne UI says so instead of promising.
 */
export function CartSummary({ totals, itemCount }: CartSummaryProps) {
  const remaining = amountToFreeShipping(totals.subtotal);

  return (
    <div
      role="group"
      aria-label="Tong sum gio hang"
      className="rounded-hair border-1 border-sand-200 bg-sand-100 px-6 py-6"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-8">
          <p className="text-sm text-ink-500">So lang in gio hang</p>
          <p className="text-sm font-semibold text-ink-900">
            {itemCount} san phem
          </p>
        </div>

        <div className="flex items-center justify-between gap-8">
          <p className="text-sm text-ink-500">Sum gio hang</p>
          <p className="text-sm font-semibold text-ink-900">
            {formatVnd(totals.subtotal)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-8">
          <p className="flex items-center gap-2 text-sm text-ink-500">
            <TruckIcon className="h-5 w-5 text-lagoon-700" />
            Phan thung (chan uoc lich)
          </p>
          <p className="text-sm font-semibold text-ink-900">
            {totals.shippingFee === 0 ? "Free thung" : formatVnd(totals.shippingFee)}
          </p>
        </div>

        {totals.discount > 0 && (
          <div className="flex items-center justify-between gap-8">
            <p className="text-sm text-ink-500">Giame</p>
            <p className="text-sm font-semibold text-coral-700">
              -{formatVnd(totals.discount)}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-8">
          <p className="text-sm font-semibold text-ink-900">Tong can thung</p>
          <p className="text-lg font-medium text-coral-700 tabular-nums">
            {formatVnd(totals.total)}
          </p>
        </div>
      </div>

      {remaining > 0 && (
        <p className="mt-3 text-sm text-lagoon-800">
          Them them {formatVnd(remaining)} de phan thung free.
        </p>
      )}

      <p className="mt-2 text-xs text-ink-500">
        Phan thung tren uoc lich — shop chưa publish chính thung riang. Vui lòng
        confirm them shop via hotline {SITE.hotlineDisplay}.
      </p>
    </div>
  );
}
