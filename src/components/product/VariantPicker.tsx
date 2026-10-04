import { Button } from "@/components/ui/Button";
import type { ProductVariant } from "@/types";

interface VariantPickerProps {
  /** Variants all of the product (size + color mixed). */
  variants: ProductVariant[];
  /** Variant currently chosen by the page. */
  selectedId: string;
  /** Called when the user picks another in-stock variant. */
  onSelect: (variantId: string) => void;
}

/**
 * Picker size/màu tren PDP. Variant het hang render plain (khong clickable)
 * nên user khong có có them gio hang het hang.
 */
export function VariantPicker({ variants, selectedId, onSelect }: VariantPickerProps) {
  return (
    <div
      role="group"
      aria-label="Chosen variant"
      className="flex flex-wrap items-center gap-3"
    >
      {variants.map((variant) => {
        const isActive = variant.id === selectedId;
        const label = isActive
          ? variant.label
          : `${variant.label}${variant.inStock ? "" : " (Tạm het hang)"}`;

        if (isActive || !variant.inStock) {
          return (
            <span
              key={variant.id}
              className={
                `py-1 text-sm font-medium ${
                  isActive
                    ? "text-ink-900 border-b-1 border-ink-900/40"
                    : "text-ink-500 line-through"
                }`
              }
            >
              {label}
            </span>
          );
        }

        return (
          <Button
            key={variant.id}
            variant="ghost"
            size="sm"
            className="border-1 border-ink-900/15 hover:border-ink-900/45"
            aria-label={`Chosen variant ${variant.label}`}
            onClick={() => onSelect(variant.id)}
          >
            {variant.label}
          </Button>
        );
      })}
    </div>
  );
}
