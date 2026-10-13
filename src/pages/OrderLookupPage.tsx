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
    isMasked?: boolean;
  }>({
    loadingCode: null,
    order: null,
    source: "none",
    isMasked: false,
  });

  const [verifyPhoneInput, setVerifyPhoneInput] = useState("");
  const [verifyPhoneError, setVerifyPhoneError] = useState<string | null>(null);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  const activeCode = submittedCode.trim();

  useEffect(() => {
    if (!activeCode) return;

    let isCancelled = false;
    setVerifyPhoneError(null);
    setVerifyPhoneInput("");

    getOrderByCodeApi(activeCode).then((res) => {
      if (isCancelled) return;
      if (res.order) {
        setLookupState({
          loadingCode: null,
          order: res.order,
          source: res.source,
          isMasked: res.isMasked ?? false,
        });
      } else {
        setLookupState({
          loadingCode: null,
          order: null,
          source: "none",
          isMasked: false,
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeCode]);

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = verifyPhoneInput.trim();
    if (!phone) {
      setVerifyPhoneError("Vui lòng nhập số điện thoại đặt hàng.");
      return;
    }
    setIsVerifyingPhone(true);
    setVerifyPhoneError(null);

    try {
      const res = await getOrderByCodeApi(activeCode, phone);
      if (res.order && !res.isMasked) {
        setLookupState({
          loadingCode: null,
          order: res.order,
          source: res.source,
          isMasked: false,
        });
      } else {
        setVerifyPhoneError("Số điện thoại không khớp với thông tin đơn hàng này.");
      }
    } catch {
      setVerifyPhoneError("Không thể xác minh số điện thoại vào lúc này.");
    } finally {
      setIsVerifyingPhone(false);
    }
  };

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
          <div className="flex w-full flex-col sm:flex-row items-center gap-2">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto min-h-[44px] justify-center"
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

        {lookupState.isMasked && (
          <div className="mt-4 rounded-hair border border-sand-300 bg-sand-100/90 p-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>Thông tin cá nhân (địa chỉ, số điện thoại) được bảo vệ tự động</span>
                </p>
                <p className="text-2xs text-ink-600 mt-0.5">
                  Nhập số điện thoại đã dùng khi đặt hàng để mở khóa toàn bộ địa chỉ giao hàng.
                </p>
              </div>

              <form onSubmit={handleVerifyPhone} className="flex items-center gap-2">
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={verifyPhoneInput}
                  onChange={(e) => setVerifyPhoneInput(e.target.value)}
                  className="h-9 w-36 sm:w-44 rounded-hair border border-sand-300 bg-white px-2.5 text-xs text-ink-900 focus:outline-none focus:border-ink-900"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={isVerifyingPhone}
                  className="h-9 text-xs px-3 font-medium whitespace-nowrap"
                >
                  {isVerifyingPhone ? "Kiểm tra..." : "Xác thực"}
                </Button>
              </form>
            </div>

            {verifyPhoneError && (
              <p className="text-2xs font-medium text-coral-700 mt-2">
                {verifyPhoneError}
              </p>
            )}
          </div>
        )}

        <div className="mt-5"><PlacedOrderCard order={order} /></div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full">
          <Button
            variant="secondary"
            className="w-full sm:w-auto text-center justify-center min-h-[44px] py-2.5 px-5"
            onClick={() => {
              setSubmittedCode("");
              setCodeInput("");
              setLookupState({ loadingCode: null, order: null, source: "none" });
            }}
          >
            Tra cứu đơn khác
          </Button>
          <Button
            to="/san-pham"
            variant="primary"
            className="w-full sm:w-auto text-center justify-center min-h-[44px] py-2.5 px-5 font-semibold"
          >
            Tiếp tục mua sắm →
          </Button>
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

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full">
        <Button
          variant="primary"
          className="w-full sm:w-auto text-center justify-center min-h-[44px] py-2.5 px-5"
          onClick={() => {
            setSubmittedCode("");
            setCodeInput("");
            setLookupState({ loadingCode: null, order: null, source: "none" });
          }}
        >
          Nhập lại mã tra cứu
        </Button>
        <Button
          to="/san-pham"
          variant="secondary"
          className="w-full sm:w-auto text-center justify-center min-h-[44px] py-2.5 px-5"
        >
          Xem sản phẩm →
        </Button>
      </div>
    </div>
  );
}
