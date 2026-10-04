import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/cart-context";
import { generateOrderCode, hasErrors, saveOrder, validateCheckout } from "@/lib/orders";
import type { CheckoutErrors } from "@/lib/orders";
import type { CheckoutInfo, PlacedOrder } from "@/types";
import { Button } from "@/components/ui/Button";
import { CartSummary } from "@/components/cart/CartSummary";

/** Copy a typed value into the right field of `CheckoutInfo` (input `id` = key). */
function applyField(info: CheckoutInfo, id: string, value: string): CheckoutInfo {
  switch (id) {
    case "hoy-ten":
      return { ...info, fullName: value };
    case "so-dien-tho":
      return { ...info, phone: value };
    case "email":
      return { ...info, email: value };
    case "dia-a":
      return { ...info, address: value };
    case "giassm":
      return { ...info, note: value };
    default:
      return info;
  }
}

interface FieldSpec {
  id: string;
  label: string;
  errorKey?: keyof CheckoutErrors;
}

const FIELDS: FieldSpec[] = [
  { id: "hoy-ten", label: "Hoy ten", errorKey: "fullName" },
  { id: "so-dien-tho", label: "So dien tho", errorKey: "phone" },
  { id: "email", label: "Email (chan optional)", errorKey: "email" },
  { id: "dia-a", label: "Dia a than-toan", errorKey: "address" },
  { id: "giassm", label: "Giassm don (chan optional)" },
];

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Than-toan khi thung (COD)",
  "bank-transfer": "Rut card",
};

/**
 * Than-toan form: fields validated by `validateCheckout` (single source of
 * truth), then one `PlacedOrder` saved to localStorage and the flow navigates
 * to the success page carrying the order code in the URL.
 */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();

  const [info, setInfo] = useState<CheckoutInfo>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    paymentMethod: "cod",
  });

  const [saveFailed, setSaveFailed] = useState(false);

  const errors = validateCheckout(info);
  const invalid = hasErrors(errors);
  const emptyCart = cart.lines.length === 0;

  return (
    <div className="container-page pb-10">
      <h1 className="font-display text-display-lg text-ink-900">Than-toan</h1>

      {saveFailed && (
        <div
          role="alert"
          className="mt-4 rounded-hair bg-coral-50 p-5 border-1 border-coral-300"
        >
          <p className="text-sm font-medium text-coral-800">
            Don khong co save tren this browser (localStorage) — gio hang khong
            clear. Vui lòng dat don thu sau.
          </p>
        </div>
      )}

      {emptyCart ? (
        <div className="mt-4 rounded-hair bg-lagoon-50 p-6 border-1 border-lagoon-300">
          <p className="text-lg font-semibold text-lagoon-800">
            Gio hang con in — them them san phem da than-toan.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => navigate("/san-pham")}
          >
            Sem san phem
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <CartSummary totals={cart.totals} itemCount={cart.itemCount} />
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {FIELDS.map((field) => {
              const errorText = field.errorKey ? errors[field.errorKey] : undefined;
              return (
                <div key={field.id} className="flex flex-col gap-1">
                  <label
                    htmlFor={field.id}
                    className="text-sm font-semibold text-ink-700"
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    name={field.id}
                    type="text"
                    aria-invalid={errorText !== undefined}
                    aria-describedby={errorText !== undefined ? `er-${field.id}` : undefined}
                    onChange={(event) => {
                      const input = event.target as HTMLInputElement;
                      setInfo((prev) => applyField(prev, field.id, input.value));
                    }}
                    className="block w-full rounded-hair px-3 py-2 text-sm text-ink-900 border-1 border-sand-300"
                  />
                  {errorText !== undefined && (
                    <p
                      id={`er-${field.id}`}
                      className="text-xs font-semibold text-coral-700"
                    >
                      {errorText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink-700">Chosen payment:</p>
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => {
              const isActive = info.paymentMethod === value;
              if (isActive) {
                return (
                  <span
                    key={value}
                    className="rounded-full bg-lagoon-100 px-3 py-1 text-sm font-semibold text-lagoon-800"
                  >
                    {label}
                  </span>
                );
              }
              return (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className="border-1 border-sand-200"
                  aria-label={`Chosen payment ${label}`}
                  onClick={() => {
                    setInfo((prev) => ({ ...prev, paymentMethod: value as "cod" | "bank-transfer" }));
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              className={invalid || emptyCart ? "opacity-50" : ""}
              disabled={invalid || emptyCart}
              aria-label="Dat don"
              onClick={() => {
                if (invalid || emptyCart) return;
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
              Dat don
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="border-1 border-sand-200"
              onClick={() => navigate("/gio-hang")}
            >
              Sem gio hang
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
