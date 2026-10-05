import { useState } from "react";
import { findOrderByCode } from "@/lib/orders";
import { PlacedOrderCard } from "@/components/order/PlacedOrderCard";
import { Button } from "@/components/ui/Button";

export default function OrderLookupPage() {
  const [codeInput, setCodeInput] = useState("");
  const [showNote, setShowNote] = useState(false);

  // Gate 1: Input code
  if (codeInput.length === 0) {
    return (
      <div className="container-page pb-10" aria-label="Trang tra cứu đơn">
        <h1 className="font-display text-display-lg text-ink-900">Tra cứu đơn hàng</h1>
        <p className="mt-2 text-sm text-ink-500" id="tra-cuu-intro">
          Nhập mã đơn bạn muốn tìm kiếm (format: LM-XXXXXX). Mã này được lưu trên trình duyệt của bạn.
        </p>

        <div className="mt-6 flex flex-col items-start gap-3 max-w-md">
          <input
            aria-labelledby="tra-cuu-intro"
            aria-label="Mã đơn"
            placeholder="LM-000000"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className="h-12 rounded-hair border-1 border-sand-300 bg-sand-100 px-4 text-sm text-ink-900 placeholder:text-sand-600 focus:border-ink-900/50"
          />
          <div className="flex w-full flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="md"
              disabled={!codeInput.match(/^LM-[A-HJ-NP-Z0-9]{6}$/i)}
              onClick={() => setShowNote(true)}
            >
              Tra cứu · Xác nhận
            </Button>
          </div>
        </div>

        {showNote && (
          <>
            <p className="mt-5 text-sm font-semibold text-coral-700" id="tra-cuu-hieu">
              Lưu ý: Dữ liệu đơn hàng được lưu trên trình duyệt của bạn — nếu bạn xoá cache, đơn sẽ không tìm thấy. Hãy copy mã đơn để tra cứu sau.
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="danger" size="sm" onClick={() => setShowNote(false)}>
                Hủy — quay lại trang tra cứu
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Gate 2: Find order or show not found
  const order = findOrderByCode(codeInput);
  
  if (order) {
    return (
      <div className="container-page pb-10">
        <h1 className="font-display text-display-lg text-ink-900">Đặt hàng thành công</h1>
        <p className="mt-2 text-sm text-ink-500">Mã đơn {order.code} · Sản phẩm: {order.lines.length}</p>

        <div className="mt-5"><PlacedOrderCard order={order} /></div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button to="/san-pham" variant="secondary">Tiếp tục mua sắm →</Button>
          <Button to={`/dat-hang-thanh-cong?ma=${order.code}`} variant="ghost">Xem đơn</Button>
        </div>
      </div>
    );
  }

  // Not found
  return (
    <div className="container-page pb-10" aria-label="Kết quả tra cứu">
      <h1 className="font-display text-display-lg text-ink-900">Không tìm thấy đơn</h1>
      <p className="mt-2 text-sm text-ink-500">
        Không tìm thấy đơn nào với mã {codeInput}. Đơn có thể đã xoá hoặc lưu trên thiết bị khác.
      </p>

      <div className="mt-6 rounded-hair border-1 border-coral-300 bg-coral-50 p-4" id="not-found">
        <p className="text-sm text-coral-800">
          Vui lòng đặt lại đơn mới hoặc liên hệ hotline 0385.8989.52 để hỗ trợ.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button to="/san-pham" variant="secondary">Xem sản phẩm</Button>
      </div>
    </div>
  );
}
