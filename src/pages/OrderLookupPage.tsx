import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { findOrderByCode } from "@/lib/orders";
import { PlacedOrderCard } from "@/components/order/PlacedOrderCard";
import { Button } from "@/components/ui/Button";

export default function OrderLookupPage() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("ma") ?? "";
  const [codeInput, setCodeInput] = useState(initialCode);
  const [submittedCode, setSubmittedCode] = useState(initialCode);

  const activeCode = submittedCode.trim();

  // Gate 1: Chưa submit mã
  if (activeCode.length === 0) {
    return (
      <div className="container-page pb-10" aria-label="Trang tra cứu đơn">
        <h1 className="font-display text-display-lg text-ink-900">Tra cứu đơn hàng</h1>
        <p className="mt-2 text-sm text-ink-500" id="tra-cuu-intro">
          Nhập mã đơn bạn muốn tìm kiếm (định dạng: LM-XXXXXX). Mã này được lưu trên trình duyệt của bạn.
        </p>

        <div className="mt-6 flex flex-col items-start gap-3 max-w-md">
          <input
            aria-labelledby="tra-cuu-intro"
            aria-label="Mã đơn"
            placeholder="LM-000000"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            className="h-12 w-full rounded-hair border-1 border-sand-300 bg-sand-100 px-4 text-sm text-ink-900 placeholder:text-sand-600 focus:border-ink-900/50"
          />
          <div className="flex w-full flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="md"
              disabled={!codeInput.trim().match(/^LM-[A-HJ-NP-Z0-9]{6}$/i)}
              onClick={() => setSubmittedCode(codeInput.trim())}
            >
              Tra cứu · Xác nhận
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Gate 2: Find order or show not found
  const order = findOrderByCode(activeCode);
  
  if (order) {
    return (
      <div className="container-page pb-10">
        <h1 className="font-display text-display-lg text-ink-900">Chi tiết đơn hàng</h1>
        <p className="mt-2 text-sm text-ink-500">Mã đơn {order.code} · Ngày đặt: {order.createdAt}</p>

        <div className="mt-5"><PlacedOrderCard order={order} /></div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { setSubmittedCode(""); setCodeInput(""); }}>
            Tra cứu đơn khác
          </Button>
          <Button to="/san-pham" variant="ghost">Tiếp tục mua sắm →</Button>
        </div>
      </div>
    );
  }

  // Not found
  return (
    <div className="container-page pb-10" aria-label="Kết quả tra cứu">
      <h1 className="font-display text-display-lg text-ink-900">Không tìm thấy đơn</h1>
      <p className="mt-2 text-sm text-ink-500">
        Không tìm thấy đơn nào với mã {activeCode}. Đơn có thể đã xoá hoặc lưu trên thiết bị khác.
      </p>

      <div className="mt-6 rounded-hair border-1 border-coral-300 bg-coral-50 p-4" id="not-found">
        <p className="text-sm text-coral-800">
          Vui lòng kiểm tra lại mã hoặc đặt lại đơn mới.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => { setSubmittedCode(""); setCodeInput(""); }}>
          Nhập lại mã tra cứu
        </Button>
        <Button to="/san-pham" variant="secondary">Xem sản phẩm</Button>
      </div>
    </div>
  );
}
