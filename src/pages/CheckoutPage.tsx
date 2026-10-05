import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/cart-context";
import { generateOrderCode, hasErrors, saveOrder, validateCheckout } from "@/lib/orders";
import type { CheckoutInfo, PaymentMethod, PlacedOrder } from "@/types";
import type { CheckoutErrors } from "@/lib/orders";
import { Button } from "@/components/ui/Button";
import { CartSummary } from "@/components/cart/CartSummary";
import { SITE } from "@/data/site";
import { formatVnd } from "@/lib/format";

const BANK_NOTE = "STK 0385.8989.52 Vietcombank · QR khi xác nhận đơn";
const WALLET_NOTE = "MoMo / ZaloPay · QR khi xác nhận đơn";

type FieldId =
  | "ho-ten"
  | "so-dien-thoai"
  | "email"
  | "dia-chi"
  | "tinh-thanh"
  | "quan-huyen"
  | "ghi-chu";

interface FieldSpec {
  id: FieldId;
  label: string;
  placeholder: string;
  required: boolean;
  errorKey?: keyof CheckoutErrors;
  half?: boolean;
}

const FIELDS: FieldSpec[] = [
  { id: "ho-ten", label: "Họ tên", placeholder: "Nguyễn Thị A", required: true, errorKey: "fullName" },
  { id: "so-dien-thoai", label: "Số điện thoại", placeholder: "09xx xxx xxx", required: true, errorKey: "phone" },
  { id: "email", label: "Email (không bắt buộc)", placeholder: "ban@email.com", required: false, errorKey: "email" },
  { id: "dia-chi", label: "Địa chỉ", placeholder: "Số nhà, đường, phường/xã", required: true, errorKey: "address" },
  { id: "tinh-thanh", label: "Tỉnh / Thành phố", placeholder: "Chọn tỉnh / thành ▾", required: true, errorKey: "province", half: true },
  { id: "quan-huyen", label: "Quận / Huyện", placeholder: "Chọn quận / huyện ▾", required: true, errorKey: "district", half: true },
  { id: "ghi-chu", label: "Ghi chú (không bắt buộc)", placeholder: "Giao giờ hành chính giúp shop", required: false },
];

/** Copy giá trị input vào đúng field của `CheckoutInfo` (input `id` = key). */
function applyField(info: CheckoutInfo, id: FieldId, value: string): CheckoutInfo {
  switch (id) {
    case "ho-ten":
      return { ...info, fullName: value };
    case "so-dien-thoai":
      return { ...info, phone: value };
    case "email":
      return { ...info, email: value };
    case "dia-chi":
      return { ...info, address: value };
    case "tinh-thanh":
      return { ...info, province: value };
    case "quan-huyen":
      return { ...info, district: value };
    case "ghi-chu":
      return { ...info, note: value };
  }
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; short: string }[] = [
  { value: "cod", label: "Thanh toán khi nhận hàng (COD)", short: "COD" },
  { value: "bank-transfer", label: "Chuyển khoản ngân hàng", short: "Chuyển khoản" },
  { value: "e-wallet", label: "Ví điện tử (MoMo / ZaloPay)", short: "Ví điện tử" },
];

/**
 * Thanh toán theo Figma 62:220: form 2 cột (700px) + OrderSummary sticky (420px).
 * Tỉnh/Quận tách riêng, payment có panel STK/QR khi chọn bank/wallet.
 */
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

  const [saveFailed, setSaveFailed] = useState(false);

  const errors = validateCheckout(info);
  const invalid = hasErrors(errors);
  const emptyCart = cart.lines.length === 0;

  return (
    <div className="container-page pb-10">
      <p className="eyebrow-label">Thông tin giao hàng</p>
      <h1 className="mt-2 font-display text-display-lg text-ink-900">Thanh toán</h1>

      {saveFailed && (
        <div
          role="alert"
          className="mt-4 rounded-hair border-1 border-coral-300 bg-coral-50 p-5"
        >
          <p className="text-sm font-medium text-coral-800">
            Đơn không lưu được trên trình duyệt này (localStorage) — giỏ hàng chưa
            xoá. Vui lòng đặt đơn thử lại sau.
          </p>
        </div>
      )}

      {emptyCart ? (
        <div className="mt-4 rounded-hair border-1 border-lagoon-300 bg-lagoon-50 p-6">
          <p className="text-lg font-semibold text-lagoon-800">
            Giỏ hàng còn trống — thêm sản phẩm để thanh toán.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => navigate("/san-pham")}
          >
            Xem sản phẩm
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((field) => {
                const errorText = field.errorKey ? errors[field.errorKey] : undefined;
                return (
                  <div
                    key={field.id}
                    className={`flex flex-col gap-1 ${field.half ? "" : "sm:col-span-2"}`}
                  >
                    <label
                      htmlFor={field.id}
                      className="text-sm font-semibold text-ink-700"
                    >
                      {field.label}
                      {field.required && <span aria-hidden="true"> *</span>}
                    </label>
                    <input
                      id={field.id}
                      name={field.id}
                      type={field.id === "email" ? "email" : "text"}
                      autoComplete={
                        field.id === "ho-ten"
                          ? "name"
                          : field.id === "so-dien-thoai"
                            ? "tel"
                            : field.id === "email"
                              ? "email"
                              : "off"
                      }
                      placeholder={field.placeholder}
                      aria-invalid={errorText !== undefined}
                      aria-describedby={errorText !== undefined ? `er-${field.id}` : undefined}
                      onChange={(event) => {
                        const input = event.target as HTMLInputElement;
                        setInfo((prev) => applyField(prev, field.id, input.value));
                      }}
                      className="block w-full rounded-hair border-1 border-sand-300 bg-sand-100 px-3 py-2 text-sm text-ink-900 placeholder:text-sand-600"
                    />
                    {errorText !== undefined && (
                      <p
                        id={`er-${field.id}`}
                        className="text-xs font-semibold text-coral-700"
                      >
                        ⚠ {errorText}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <fieldset className="mt-6">
              <legend className="eyebrow-label">Phương thức thanh toán</legend>
              <div className="mt-3 flex flex-col gap-2">
                {PAYMENT_OPTIONS.map((option) => {
                  const isActive = info.paymentMethod === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-hair border-1 px-4 py-3 text-sm ${
                        isActive
                          ? "border-ink-900 bg-sand-100 font-semibold text-ink-900"
                          : "border-sand-300 text-ink-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={option.value}
                        checked={isActive}
                        onChange={() =>
                          setInfo((prev) => ({ ...prev, paymentMethod: option.value }))
                        }
                        className="accent-[#1c1a18]"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
              {info.paymentMethod === "bank-transfer" && (
                <p className="mt-2 text-sm text-ink-500">{BANK_NOTE}</p>
              )}
              {info.paymentMethod === "e-wallet" && (
                <p className="mt-2 text-sm text-ink-500">{WALLET_NOTE}</p>
              )}
            </fieldset>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                className={invalid ? "opacity-50" : ""}
                disabled={invalid}
                aria-label={`Đặt hàng, tổng ${formatVnd(cart.totals.total)}`}
                onClick={() => {
                  if (invalid) return;
                  const code = generateOrderCode();
                  const order: PlacedOrder = {
                    code,
                    createdAt: new Date().toISOString(),
                    lines: cart.lines,
                    totals: cart.totals,
                    info,
                  };
                  if (!saveOrder(order)) {
                    setSaveFailed(true);
                    return;
                  }
                  setSaveFailed(false);
                  cart.clear();
                  navigate(`/dat-hang-thanh-cong?ma=${code}`);
                }}
              >
                Đặt hàng · {formatVnd(cart.totals.total)}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="border-1 border-sand-200"
                onClick={() => navigate("/gio-hang")}
              >
                Xem giỏ hàng
              </Button>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Đơn hàng">
            <CartSummary totals={cart.totals} itemCount={cart.itemCount} />
            <p className="mt-2 text-xs text-ink-500">
              Miễn ship đơn từ 500.000 ₫ · Hotline {SITE.hotlineDisplay}
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
