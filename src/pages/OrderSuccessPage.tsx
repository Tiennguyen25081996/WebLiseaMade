import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { findOrderByCode } from "@/lib/orders";
import { PlacedOrderCard } from "@/components/order/PlacedOrderCard";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/data/site";

/**
 * Đặt hàng thành công theo Figma: H1 cảm ơn + mã đơn + card + copy/tra cứu.
 */
export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("ma") ?? "";
  const order = code ? findOrderByCode(code) : undefined;
  const [copied, setCopied] = useState(false);

  if (!order) {
    return (
      <div className="container-page pb-10">
        <h1 className="font-display text-display-lg text-ink-900">
          Mã đơn không tìm thấy
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Đơn lưu trên thiết bị khác hoặc dữ liệu đã xoá khỏi localStorage.
        </p>
        <Button to="/tra-cuu-don" variant="secondary" className="mt-4">
          Tra cứu đơn
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page pb-10">
      <h1 className="font-display text-display-lg text-ink-900">
        Cảm ơn — đơn đã ghi nhận
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Mã đơn {order.code} · Lưu lại để tra cứu sau.
      </p>

      <div className="mt-5">
        <PlacedOrderCard order={order} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button to="/san-pham" variant="secondary">
          Tiếp tục mua sắm →
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const done: (ok: boolean) => void = (ok) => setCopied(ok);
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(order.code)
                .then(() => done(true))
                .catch(() => done(false));
            } else {
              done(false);
            }
          }}
        >
          {copied ? "Đã copy mã ✓" : "Copy mã · Tra cứu đơn"}
        </Button>
        <Button to={`/tra-cuu-don?ma=${order.code}`} variant="ghost">
          Tra cứu đơn này →
        </Button>
      </div>

      <p className="mt-4 text-sm text-ink-500">
        Shop gọi xác nhận trong 24h · Hotline {SITE.hotlineDisplay}
      </p>
    </div>
  );
}
