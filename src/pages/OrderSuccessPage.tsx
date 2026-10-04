import { ButtonLink } from "@/components/ui/Button";
import { useSearchParams } from "react-router-dom";
import { findOrderByCode } from "@/lib/orders";
import { PlacedOrderCard } from "@/components/order/PlacedOrderCard";

/**
 * Page after a successful checkout. The order code comes from the URL
 * (`/dat-hang-thanh-cong?ma=LM-XXXXXX`) so the page is reload/share safe.
 */
export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("ma") ?? "";
  const order = code ? findOrderByCode(code) : undefined;

  if (!order) {
    return (
      <div className="container-page pb-10">
        <h1 className="font-display text-display-lg text-ink-900">Ma don khong tim</h1>
        <p className="mt-2 text-sm text-ink-500">
          Ma don khong tim tren this browser (localStorage) — it was saved on
          another device or the data was cleared.
        </p>
        <ButtonLink
          to="/tra-cuu-don"
          variant="secondary"
          size="sm"
          className="mt-4"
        >
          Tra cò sach don
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="container-page pb-10">
      <h1 className="font-display text-display-lg text-ink-900">Don than-toan</h1>
      <p className="mt-2 text-sm text-ink-500">
        Ma don da tim. Save this page or use the code to look it up later.
      </p>

      <div className="mt-5">
        <PlacedOrderCard order={order} />
      </div>

      <ButtonLink
        to="/san-pham"
        variant="secondary"
        size="sm"
        className="mt-6"
      >
        Sem san phem
      </ButtonLink>
    </div>
  );
}
