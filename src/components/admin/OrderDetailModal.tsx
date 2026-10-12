import type { PlacedOrder } from "@/types";
import { formatVnd } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";

interface OrderDetailModalProps {
  order: PlacedOrder | null;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-hair bg-sand-50 p-6 shadow-2xl border border-sand-300 animate-reveal-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-sand-200 pb-3">
          <div>
            <span className="text-2xs font-semibold uppercase tracking-wider text-lagoon-700">
              Chi tiết đơn hàng
            </span>
            <h3 className="font-display text-lg text-ink-900">
              Mã: {order.code}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900"
            aria-label="Đóng chi tiết đơn"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Thông tin khách hàng */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-hair bg-sand-100 p-3 text-xs text-ink-800">
          <div>
            <span className="text-ink-500 block text-2xs uppercase">Người nhận</span>
            <strong className="font-medium">{order.info.fullName}</strong>
            <div className="text-ink-600 mt-0.5">{order.info.phone}</div>
            {order.info.email && <div className="text-ink-600">{order.info.email}</div>}
          </div>
          <div>
            <span className="text-ink-500 block text-2xs uppercase">Địa chỉ giao</span>
            <div className="mt-0.5">{order.info.address}</div>
            {order.info.note && (
              <div className="mt-1 text-2xs text-ink-500 italic">
                Ghi chú: "{order.info.note}"
              </div>
            )}
          </div>
        </div>

        {/* Danh sách món hàng */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-ink-800 uppercase tracking-wider mb-2">
            Sản phẩm đặt mua ({order.lines.length})
          </h4>
          <div className="divide-y divide-sand-200 border-t border-b border-sand-200 text-xs">
            {order.lines.map((line, idx) => (
              <div
                key={`${line.productId}-${line.variantId}-${idx}`}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="font-medium text-ink-900">
                    {line.product?.name ?? line.productId}
                  </div>
                  <div className="text-2xs text-ink-500">
                    Phân loại: {line.variant?.label ?? "Tiêu chuẩn"} · Số lượng: {line.quantity}
                  </div>
                </div>
                <div className="font-medium text-ink-900">
                  {formatVnd(line.lineTotal ?? (line.unitPrice * line.quantity))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tổng kết tiền */}
        <div className="mt-4 space-y-1.5 text-xs text-ink-700">
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span>{formatVnd(order.totals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Phí vận chuyển</span>
            <span>{formatVnd(order.totals.shippingFee)}</span>
          </div>
          {order.totals.discount > 0 && (
            <div className="flex justify-between text-coral-700 font-medium">
              <span>Giảm giá</span>
              <span>-{formatVnd(order.totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-sand-300 pt-2 text-sm font-bold text-ink-900">
            <span>Tổng thanh toán</span>
            <span>{formatVnd(order.totals.total)}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="tap-feedback rounded-hair border border-sand-300 bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-sand-200 hover:text-ink-900 transition-colors flex items-center gap-1.5"
          >
            <span>🖨️</span>
            <span>In đơn hàng</span>
          </button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
