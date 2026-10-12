import { useState } from "react";
import type { PlacedOrder } from "@/types";
import { formatVnd } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";

interface OrderDetailModalProps {
  order: PlacedOrder | null;
  onClose: () => void;
  onUpdateShipping?: (code: string, shipping: { trackingCode?: string; carrier?: PlacedOrder["carrier"] }) => void;
}

export function OrderDetailModal({ order, onClose, onUpdateShipping }: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <OrderDetailModalContent
      order={order}
      onClose={onClose}
      onUpdateShipping={onUpdateShipping}
    />
  );
}

function OrderDetailModalContent({
  order,
  onClose,
  onUpdateShipping,
}: {
  order: PlacedOrder;
  onClose: () => void;
  onUpdateShipping?: (code: string, shipping: { trackingCode?: string; carrier?: PlacedOrder["carrier"] }) => void;
}) {
  const [trackingInput, setTrackingInput] = useState(order.trackingCode ?? "");
  const [carrierInput, setCarrierInput] = useState<PlacedOrder["carrier"]>(order.carrier ?? "spx");
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveShipping = () => {
    onUpdateShipping?.(order.code, {
      trackingCode: trackingInput.trim(),
      carrier: carrierInput,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

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

        {/* Quản lý Vận chuyển & Mã vận đơn (Shopee Express / SPX) */}
        <div className="mt-4 rounded-hair border border-orange-200 bg-orange-50/50 p-3.5 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-[#ea580c] flex items-center gap-1.5">
              <span>🚚 Vận chuyển & Mã vận đơn</span>
              <span className="font-normal text-ink-500">| Tra cứu vị trí đơn</span>
            </span>
            {trackingInput && (
              <a
                href={`https://spx.vn/track?${encodeURIComponent(trackingInput)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xs font-semibold text-[#ee4d2d] hover:underline"
              >
                Mở SPX.vn ↗
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
            <div>
              <label className="text-[11px] font-medium text-ink-600 block mb-1">
                Đơn vị vận chuyển
              </label>
              <select
                value={carrierInput}
                onChange={(e) => setCarrierInput(e.target.value as PlacedOrder["carrier"])}
                className="w-full rounded-hair border border-sand-300 bg-white px-2.5 py-1.5 text-xs text-ink-900"
              >
                <option value="spx">Shopee Express (SPX)</option>
                <option value="ghn">Giao Hàng Nhanh (GHN)</option>
                <option value="ghtk">Giao Hàng Tiết Kiệm</option>
                <option value="viettel">Viettel Post</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-ink-600 block mb-1">
                Mã vận đơn
              </label>
              <input
                type="text"
                placeholder="VD: SPXVN04918239..."
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                className="w-full rounded-hair border border-sand-300 bg-white px-2.5 py-1.5 text-xs font-mono text-ink-900 placeholder:text-sand-500"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleSaveShipping}
                className="w-full tap-feedback rounded-hair bg-[#ee4d2d] py-1.5 px-3 text-xs font-semibold text-white hover:bg-[#d73211] transition-colors"
              >
                {isSaved ? "Đã lưu ✓" : "Lưu mã vận đơn"}
              </button>
            </div>
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
