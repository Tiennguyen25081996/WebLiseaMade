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
        <div className="mt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full">
          <Button
            to="/tra-cuu-don"
            variant="secondary"
            className="w-full sm:w-auto text-center justify-center min-h-[44px] py-2.5"
          >
            Tra cứu đơn
          </Button>
          <Button
            to="/san-pham"
            variant="primary"
            className="w-full sm:w-auto text-center justify-center min-h-[44px] py-2.5"
          >
            Về trang sản phẩm →
          </Button>
        </div>
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

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full">
        <Button
          to="/san-pham"
          variant="primary"
          className="w-full sm:w-auto text-center justify-center min-h-[44px] py-2.5 px-5 font-semibold shadow-2xs"
        >
          Tiếp tục mua sắm →
        </Button>
        <Button
          variant="secondary"
          className="w-full sm:w-auto text-center justify-center min-h-[44px] py-2.5 px-5"
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
        <Button
          to={`/tra-cuu-don?ma=${order.code}`}
          variant="secondary"
          className="w-full sm:w-auto text-center justify-center min-h-[44px] py-2.5 px-5"
        >
          Tra cứu đơn này →
        </Button>
      </div>

      <p className="mt-4 text-sm text-ink-500">
        Shop gọi xác nhận trong 24h · Hotline {SITE.hotlineDisplay}
      </p>
    </div>
  );
}
