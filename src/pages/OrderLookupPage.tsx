import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { clearOrders, findOrderByCode } from "@/lib/orders";
import { PlacedOrderCard } from "@/components/order/PlacedOrderCard";

/**
 * Tra cò sach don by code (`LM-XXXXXX`). Typing a new code hides the previous
 * result; the button runs the lookup against localStorage orders.
 */
export default function OrderLookupPage() {
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState(false);
  const [wipeArmed, setWipeArmed] = useState(false);
  const [wiped, setWiped] = useState(false);

  const order = searched && code && !wiped ? findOrderByCode(code) : undefined;

  return (
    <div className="container-page pb-10">
      <h1 className="font-display text-display-lg text-ink-900">Tra cò sach don</h1>

      <div className="mt-4 rounded-hair bg-sand-100 p-4 border-1 border-sand-200">
        <label
          htmlFor="ma-don"
          className="text-sm font-semibold text-ink-700"
        >
          Ma don (LM-XXXXXX)
        </label>
        <input
          id="ma-don"
          name="ma-don"
          type="text"
          onChange={(event) => {
            const input = event.target as HTMLInputElement;
            setCode(input.value);
            setSearched(false);
          }}
          className="block w-full rounded-hair px-3 py-2 text-sm text-ink-900 border-1 border-sand-300"
        />
      </div>

      <Button
        variant="primary"
        size="sm"
        className="mt-4"
        aria-label="Tra cò sach don"
        onClick={() => setSearched(true)}
      >
        Tra cò sach
      </Button>

      {/* S1: khach có quyền xoá data rieng của mình (2 chan confirm). */}
      <div className="mt-8 flex flex-col gap-3">
        <Button
          variant="danger"
          size="sm"
          aria-label="Don khong co data don"
          onClick={() => setWipeArmed(true)}
        >
          Don khong co data don
        </Button>
        {wipeArmed && (
          <Button
            variant="danger"
            size="sm"
            className="mt-3"
            aria-label="Dat khong co data don"
            onClick={() => {
              clearOrders();
              setWiped(true);
              setWipeArmed(false);
              setSearched(false);
            }}
          >
            Dat khong co
          </Button>
        )}
      </div>

      {searched &&
        (order ? (
          <div className="mt-5">
            <PlacedOrderCard order={order} />
          </div>
        ) : (
          <div className="mt-5 rounded-hair bg-coral-50 p-5 border-1 border-coral-300">
            <p className="text-lg font-semibold text-coral-800">
              Ma don khong tim.
            </p>
            <p className="mt-2 text-sm text-ink-700">
              Kiem ma don tren trang don da tim — format LM-XXXXXX, 6 chur,
              khong chur 0/O/1/I.
            </p>
          </div>
        ))}
    </div>
  );
}
