import { TruckIcon } from "@/components/ui/icons";
import { SITE } from "@/data/site";
import { formatVnd } from "@/lib/format";
import { amountToFreeShipping } from "@/lib/cart-pricing";
import type { Totals } from "@/types";

interface CartSummaryProps {
  /** `computeTotals(lines)` — never recomputed here (single source of truth). */
  totals: Totals;
  /** Tổng số lượng sản phẩm trong giỏ hàng (computed from `computeItemCount(lines)`). */
  itemCount: number;
}

/**
 * Tổng giá trị giỏ hàng / thanh toán.
 * Phí đóng gói (dự kiến): shop chưa public chính sách riêng,
 * nội dung UI hiển thị tạm thời.
 */
export function CartSummary({ totals, itemCount }: CartSummaryProps) {
  const remaining = amountToFreeShipping(totals.subtotal);

  return (
    <div
      role="group"
      aria-label="Tổng giá trị giỏ hàng"
      className="rounded-hair border-1 border-sand-200 bg-sand-100 px-6 py-6"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-8">
          <p className="text-sm text-ink-500">Số lượng trong giỏ hàng</p>
          <p className="text-sm font-semibold text-ink-900">
            {itemCount} sản phẩm
          </p>
        </div>

        <div className="flex items-center justify-between gap-8">
          <p className="text-sm text-ink-500">Tổng giá trị</p>
          <p className="text-sm font-semibold text-ink-900">
            {formatVnd(totals.subtotal)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-8">
          <p className="flex items-center gap-2 text-sm text-ink-500">
            <TruckIcon className="h-5 w-5 text-lagoon-700" />
            Phí đóng gói (dự kiến)
          </p>
          <p className="text-sm font-semibold text-ink-900">
            {totals.shippingFee === 0 ? "Miễn phí" : formatVnd(totals.shippingFee)}
          </p>
        </div>

        {totals.discount > 0 && (
          <div className="flex items-center justify-between gap-8">
            <p className="text-sm text-ink-500">Giảm giá</p>
            <p className="text-sm font-semibold text-coral-700">
              -{formatVnd(totals.discount)}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-8">
          <p className="text-sm font-semibold text-ink-900">Tổng cộng</p>
          <p className="text-lg font-medium text-coral-700 tabular-nums">
            {formatVnd(totals.total)}
          </p>
        </div>
      </div>

      {remaining > 0 && (
        <p className="mt-3 text-sm text-lagoon-800">
          Mua thêm {formatVnd(remaining)} để được miễn phí giao hàng.
        </p>
      )}

      <p className="mt-2 text-xs text-ink-400 opacity-70">
        * Phí đóng gói dựa trên dự kiến — vui lòng liên hệ hotline {SITE.hotlineDisplay} để được hỗ trợ chính xác nhất.
      </p>
    </div>
  );
}
