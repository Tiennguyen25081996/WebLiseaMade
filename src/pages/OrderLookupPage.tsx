import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getOrderByCodeApi } from "@/lib/api";
import type { PlacedOrder } from "@/types";
import { PlacedOrderCard } from "@/components/order/PlacedOrderCard";
import { Button } from "@/components/ui/Button";

export default function OrderLookupPage() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("ma") ?? "";
  const [codeInput, setCodeInput] = useState(initialCode);
  const [submittedCode, setSubmittedCode] = useState(initialCode);

  const [lookupState, setLookupState] = useState<{
    loadingCode: string | null;
    order: PlacedOrder | null;
    source: "remote" | "local" | "none";
  }>({
    loadingCode: null,
    order: null,
    source: "none",
  });

  const activeCode = submittedCode.trim();

  useEffect(() => {
    if (!activeCode) return;

    let isCancelled = false;

    getOrderByCodeApi(activeCode).then((res) => {
      if (isCancelled) return;
      if (res.order) {
        setLookupState({
          loadingCode: null,
          order: res.order,
          source: res.source,
        });
      } else {
        setLookupState({
          loadingCode: null,
          order: null,
          source: "none",
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeCode]);

  const isLoading = Boolean(activeCode && lookupState.loadingCode === activeCode);
  const order = lookupState.order;
  const orderSource = lookupState.source;

  const handleSearch = () => {
    const code = codeInput.trim();
    if (!code) return;
    setLookupState((prev) => ({ ...prev, loadingCode: code }));
    setSubmittedCode(code);
  };

  // Gate 1: Chưa submit mã
  if (activeCode.length === 0) {
    const trimmedInput = codeInput.trim();
    const isFormatValid = /^LM-[A-HJ-NP-Z0-9]{6}$/i.test(trimmedInput);
    const hasInput = trimmedInput.length > 0;
    const formatError = hasInput && !isFormatValid;

    return (
      <div className="container-page pb-10" aria-label="Trang tra cứu đơn">
        <h1 className="font-display text-display-lg text-ink-900">Tra cứu đơn hàng</h1>
        <p className="mt-2 text-sm text-ink-500" id="tra-cuu-intro">
          Nhập mã đơn bạn muốn tìm kiếm (định dạng: LM-XXXXXX, ví dụ: LM-8F3K2Q).
        </p>

        <div className="mt-6 flex flex-col items-start gap-3 max-w-md">
          <input
            id="order-code-input"
            aria-labelledby="tra-cuu-intro"
            aria-label="Mã đơn"
            aria-invalid={formatError ? "true" : undefined}
            aria-describedby={formatError ? "err-order-code" : undefined}
            placeholder="LM-000000"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            className={`h-12 w-full rounded-hair border-1 px-4 text-sm text-ink-900 transition-all ${
              formatError
                ? "border-coral-700 bg-coral-50/50"
                : "border-sand-300 bg-sand-100 placeholder:text-sand-600 focus:border-ink-900/50"
            }`}
          />
          {formatError && (
            <p id="err-order-code" className="text-xs font-medium text-coral-700" role="alert">
              ⚠ Mã đơn hàng phải bắt đầu bằng &quot;LM-&quot; và theo sau là 6 ký tự chữ hoặc số (ví dụ: LM-8F3K2Q).
            </p>
          )}
          <div className="flex w-full flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="md"
              disabled={!isFormatValid}
              onClick={handleSearch}
            >
              Tra cứu · Xác nhận
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Đang tải dữ liệu từ API
  if (isLoading) {
    return (
      <div className="container-page pb-10 text-center py-20" aria-label="Đang tra cứu">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-ink-900 border-t-transparent" />
        <p className="mt-4 text-sm text-ink-600">Đang tra cứu đơn hàng {activeCode}...</p>
      </div>
    );
  }

  // Gate 2: Find order or show not found
  if (order) {
    return (
      <div className="container-page pb-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="font-display text-display-lg text-ink-900">Chi tiết đơn hàng</h1>
            <p className="mt-2 text-sm text-ink-500">
              Mã đơn {order.code} · Ngày đặt: {order.createdAt}
              {orderSource === "remote" && " (Đã đồng bộ máy chủ)"}
            </p>
          </div>
        </div>

        <div className="mt-5"><PlacedOrderCard order={order} /></div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setSubmittedCode("");
              setCodeInput("");
              setLookupState({ loadingCode: null, order: null, source: "none" });
            }}
          >
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
        Không tìm thấy đơn nào với mã {activeCode}. Đơn có thể chưa được lưu hoặc nhập sai mã.
      </p>

      <div className="mt-6 rounded-hair border-1 border-coral-300 bg-coral-50 p-4" id="not-found">
        <p className="text-sm text-coral-800">
          Vui lòng kiểm tra lại mã hoặc đặt lại đơn mới.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          onClick={() => {
            setSubmittedCode("");
            setCodeInput("");
            setLookupState({ loadingCode: null, order: null, source: "none" });
          }}
        >
          Nhập lại mã tra cứu
        </Button>
        <Button to="/san-pham" variant="secondary">Xem sản phẩm</Button>
      </div>
    </div>
  );
}
