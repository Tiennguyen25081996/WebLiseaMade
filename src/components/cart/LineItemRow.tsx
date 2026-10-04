import { Link } from "react-router-dom";
import type { CartLineDetailed } from "@/types";
import { formatVnd } from "@/lib/format";
import { SITE } from "@/data/site";
import { ProductImage } from "@/components/product/ProductImage";
import { QuantityStepper } from "./QuantityStepper";

interface LineItemRowProps {
  /** One cart line already joined with catalog (`hydrateLines` output). */
  line: CartLineDetailed;
  /** Show +/- stepper. PDP preview reuses this row without stepper. */
  showStepper?: boolean;
}

/** One row of the cart list: image, name, variant, stepper, line total. */
export function LineItemRow({ line, showStepper = true }: LineItemRowProps) {
  const swatch = line.variant.kind === "color" ? line.variant.swatch : undefined;

  return (
    <li className="grid items-center gap-4 rounded-hair border-1 border-sand-200 bg-sand-100 px-4 py-4 sm:grid-cols-4">
      <ProductImage
        src={line.product.images[0]}
        alt={line.product.name}
        seed={line.product.id}
        showPlaceholderNote={false}
        className="h-20 w-20 rounded-hair"
      />

      <div className="flex flex-col gap-1 sm:col-span-2">
        <p className="text-sm font-semibold text-ink-900">
          <Link
            to={`/san-pham/${line.product.id}`}
            className="underline-reveal hover:text-lagoon-700"
          >
            {line.product.name}
          </Link>
        </p>
        <p className="text-xs text-ink-500">
          {line.variant.label}
          {swatch && (
            <span
              className="inline-flex h-3 w-3 rounded-full border-1 border-ink-900/25"
              style={{ backgroundColor: swatch }}
              aria-hidden
            />
          )}
        </p>
        {!line.variant.inStock && (
          <p className="text-xs font-semibold text-coral-700">
            Tạm het hang — vui lòng confirm them shop via hotline{" "}
            {SITE.hotlineDisplay}.
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        {showStepper && (
          <QuantityStepper
            productId={line.productId}
            variantId={line.variantId}
            current={line.quantity}
          />
        )}
        <p className="text-sm font-semibold text-ink-900">
          {formatVnd(line.lineTotal)}
        </p>
        <p className="text-xs text-ink-500">x {line.quantity}</p>
      </div>
    </li>
  );
}
