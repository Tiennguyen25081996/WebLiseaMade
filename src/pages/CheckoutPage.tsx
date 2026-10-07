import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/cart-context";
import { generateOrderCode, hasErrors, validateCheckout, type CheckoutErrors } from "@/lib/orders";
import { createOrderApi, trackCustomerEvent } from "@/lib/api";
import type { CheckoutInfo, PaymentMethod, PlacedOrder } from "@/types";
import { Button } from "@/components/ui/Button";
import { CartSummary } from "@/components/cart/CartSummary";
import { SITE } from "@/data/site";
import { formatVnd } from "@/lib/format";

const BANK_NOTE = "STK 0385.8989.52 Vietcombank · QR khi xác nhận đơn";
const WAL_NOTE = "MoMo / ZaloPay · QR khi xác nhận đơn";

type FieldId =
  | "ho-ten"
  | "so-dien-thoai"
  | "email"
  | "dia-chi"
  | "tinh-thang"
  | "quan-huyen"
  | "ghi-chu";

const FIELDS: { id: FieldId; label: string; placeholder: string; required: boolean; errorKey?: keyof CheckoutErrors; half?: boolean; }[] = [
  { id: "ho-ten", label: "Họ tên", placeholder: "Nguyễn Thị A", required: true, errorKey: "fullName" },
  { id: "so-dien-thoai", label: "Số điện thoại", placeholder: "09xx xxx xxx", required: true, errorKey: "phone" },
  { id: "email", label: "Email (không bắt buộc)", placeholder: "ban@email.com", required: false, errorKey: "email" },
  { id: "dia-chi", label: "Địa chỉ", placeholder: "Số nhà, đường, phường/xã", required: true, errorKey: "address" },
  { id: "tinh-thang", label: "Tỉnh / Thành phố", placeholder: "Chọn tỉnh / thành ▾", required: true, errorKey: "province", half: true },
  { id: "quan-huyen", label: "Quận / Huyện", placeholder: "Chọn quận / huyện ▾", required: true, errorKey: "district", half: true },
  { id: "ghi-chu", label: "Ghi chú (không bắt buộc)", placeholder: "Giao giờ hành chính giúp shop", required: false },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; short: string }[] = [
  { value: "cod", label: "Thanh toán khi nhận hàng (COD)", short: "COD" },
  { value: "bank-transfer", label: "Chuyển khoản ngân hàng", short: "Chuyển khoản" },
  { value: "e-wallet", label: "Ví điện tử (MoMo / ZaloPay)", short: "Ví điện tử" },
];

function applyField(info: CheckoutInfo, id: FieldId, value: string): CheckoutInfo {
  switch (id) {
    case "ho-ten": return { ...info, fullName: value };
    case "so-dien-thoai": return { ...info, phone: value };
    case "email": return { ...info, email: value };
    case "dia-chi": return { ...info, address: value };
    case "tinh-thang": return { ...info, province: value };
    case "quan-huyen": return { ...info, district: value };
    case "ghi-chu": return { ...info, note: value };
    default: return info;
  }
}

/**
 * Sub-component: Alert Banner for local storage errors
 */
const OrderAlert = ({ children }: { children: React.ReactNode }) => (
  <div role="alert" className="mb-6 rounded-hair border-1 border-coral-300 bg-coral-50 p-4">
    {children}
  </div>
);

/**
 * Sub-component: Empty Cart State
 */
const EmptyCartView = ({ onAction }: { onAction: () => void }) => (
  <div className="mt-10 rounded-hair border-1 border-sand-300 bg-sand-100 p-10 text-center">
    <p className="text-lg font-semibold text-ink-900 mb-6">Giỏ hàng của bạn đang trống</p>
    <Button variant="secondary" size="md" onClick={onAction}>
      Xem sản phẩm
    </Button>
  </div>
);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();

  const [info, setInfo] = useState<CheckoutInfo>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    province: "",
    district: "",
    note: "",
    paymentMethod: "cod",
  });

  const [touched, setTouched] = useState<Partial<Record<FieldId, boolean>>>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(() => validateCheckout(info), [info]);
  const invalid = hasErrors(errors);
  const emptyCart = cart.lines.length === 0;

  const handleBlur = (fieldId: FieldId) => {
    setTouched((prev) => ({ ...prev, [fieldId]: true }));
  };

  const handleCheckout = async () => {
    // Touch all fields to show errors if any
    const allTouched: Partial<Record<FieldId, boolean>> = {};
    for (const f of FIELDS) {
      allTouched[f.id] = true;
    }
    setTouched(allTouched);

    if (invalid || isSubmitting) {
      // Focus trường lỗi đầu tiên theo chuẩn a11y
      for (const field of FIELDS) {
        if (field.errorKey && errors[field.errorKey]) {
          const el = document.getElementById(field.id);
          if (el) {
            el.focus();
            break;
          }
        }
      }
      return;
    }
    
    setIsSubmitting(true);
    try {
      const code = generateOrderCode();
      const order: PlacedOrder = {
        code,
        createdAt: new Date().toISOString(),
        lines: cart.lines,
        totals: cart.totals,
        info,
      };
      
      const res = await createOrderApi(order);
      if (!res.success) {
        setSaveFailed(true);
      } else {
        setSaveFailed(false);
        trackCustomerEvent("place_order", {
          orderCode: code,
          total: cart.totals.total,
          itemCount: cart.itemCount,
          syncedToRemote: res.syncedToRemote,
        });
        cart.clear();
        navigate(`/dat-hang-thanh-cong?ma=${code}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-page pb-10">
      <header className="mb-10">
        <p className="eyebrow-label text-lagoon-600">Thanh toán</p>
        <h1 className="mt-2 font-display text-display-lg text-ink-900">Hoàn tất đơn hàng</h1>
      </header>

      <main className="relative">
        {saveFailed && <OrderAlert>
          <p className="text-sm font-semibold text-coral-800">
            Hệ thống gặp lỗi khi lưu thông tin đơn hàng. Quý khách vui lòng tải lại trang hoặc liên hệ hotline {SITE.hotlineDisplay} để được hỗ trợ trực tiếp.
          </p>
        </OrderAlert>}

        {emptyCart ? (
          <EmptyCartView onAction={() => navigate("/san-pham")} />
        ) : (
          <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
            <div className="flex flex-col gap-8">
              <section>
                <h2 className="mb-6 text-xl font-semibold text-ink-900">Thông tin giao nhận</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {FIELDS.map((field) => {
                    const errorKey = field.errorKey as keyof CheckoutErrors;
                    const rawError = errorKey ? errors[errorKey] : undefined;
                    const isTouched = Boolean(touched[field.id]);
                    const showError = isTouched && rawError !== undefined;
                    return (
                      <div
                        key={field.id}
                        className={`flex flex-col gap-2 ${field.half ? "" : "sm:col-span-2"}`}
                      >
                        <label
                          htmlFor={field.id}
                          className="text-sm font-medium text-ink-700"
                        >
                          {field.label}
                          {field.required && <span className="text-coral-700 ml-1">*</span>}
                        </label>
                        <input
                          id={field.id}
                          name={field.id}
                          type={field.id === "email" ? "email" : "text"}
                          autoComplete={
                            field.id === "ho-ten" ? "name" :
                            field.id === "so-dien-thoai" ? "tel" :
                            field.id === "email" ? "email" : "off"
                          }
                          placeholder={field.placeholder}
                          aria-invalid={showError ? "true" : undefined}
                          aria-describedby={showError ? `err-${field.id}` : undefined}
                          onBlur={() => handleBlur(field.id)}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (field.id === "so-dien-thoai") {
                              // Auto-clean: loại bỏ khoảng trắng thừa
                              val = val.replace(/\s+/g, "");
                            }
                            setInfo((prev) => applyField(prev, field.id, val));
                          }}
                          className={`block w-full rounded-hair border-1 px-4 py-3 text-base text-ink-900 transition-all ${
                            showError
                              ? "border-coral-700 bg-coral-50/50"
                              : "border-sand-300 bg-sand-100 hover:border-ink-900/40"
                          }`}
                        />
                        {showError && (
                          <p id={`err-${field.id}`} className="text-xs font-medium text-coral-700" role="alert">
                            ⚠ {rawError}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="mb-6 text-xl font-semibold text-ink-900">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  {PAYMENT_OPTIONS.map((option) => {
                    const isActive = info.paymentMethod === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-4 rounded-hair border-1 p-4 transition-all ${
                          isActive
                            ? "border-ink-900 bg-sand-100 font-semibold text-ink-900"
                            : "border-sand-300 text-ink-700 hover:border-ink-900/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={option.value}
                          checked={isActive}
                          onChange={() => setInfo((prev) => ({ ...prev, paymentMethod: option.value }))}
                          className="h-4 w-4 accent-ink-900"
                        />
                        <span className="text-sm font-medium text-ink-700">{option.label}</span>
                        {option.value === "bank-transfer" && (
                          <span className="ml-auto text-[11px] text-ink-500 opacity-70">
                            {BANK_NOTE}
                          </span>
                        )}
                        {option.value === "e-wallet" && (
                          <span className="ml-auto text-[11px] text-ink-500 opacity-70">
                            {WAL_NOTE}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="px-10 h-14 text-lg rounded-hair bg-ink-900 text-sand-50 hover:bg-ink-700 active:scale-[0.98] transition-all"
                  disabled={invalid || isSubmitting}
                  aria-label={`Đặt hàng, tổng ${formatVnd(cart.totals.total)}`}
                  onClick={handleCheckout}
                >
                  {isSubmitting ? "Đang xử lý..." : `Đặt đơn hàng ${formatVnd(cart.totals.total)}`}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="px-6 h-14 text-lg rounded-hair border-1 border-sand-300 hover:border-ink-900 transition-all"
                  onClick={() => navigate("/gio-hang")}
                >
                  Quay lại
                </Button>
              </div>
            </div>

            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-hair border-1 border-sand-300 bg-sand-100 p-8 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-ink-900">Tóm tắt đơn hàng</h2>
                <CartSummary totals={cart.totals} itemCount={cart.itemCount} />
                <div className="mt-8 space-y-3 border-t border-sand-200 pt-6">
                  <div className="flex justify-between text-sm text-ink-700">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium">0 ₫</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-ink-900">
                    <span>Tổng cộng</span>
                    <span className="text-coral-700">{formatVnd(cart.totals.total)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
