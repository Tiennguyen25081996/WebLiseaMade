import { discountPercent, formatVnd } from "@/lib/format";

interface PriceProps {
  price: number;
  compareAtPrice?: number;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { now: "text-sm font-medium", was: "text-xs font-medium" },
  md: { now: "text-lg font-medium", was: "text-sm font-medium" },
  lg: { now: "text-3xl font-normal", was: "text-base font-medium" },
} as const;

export function Price({ price, compareAtPrice, size = "md" }: PriceProps) {
  const s = SIZES[size];
  const off = discountPercent(price, compareAtPrice);

  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <span className={`${s.now} text-coral-700 tabular-nums`}>
        {formatVnd(price)}
      </span>
      {off > 0 && compareAtPrice !== undefined && (
        <>
          <span className={`${s.was} text-ink-500 line-through tabular-nums`}>
            {formatVnd(compareAtPrice)}
          </span>
          <span
            aria-hidden="true"
            className="ml-1 inline-block border-1 border-coral-300 rounded-hair px-1.5 py-0.5 text-eyebrow uppercase text-coral-700"
          >
            {`−${off}%`}
          </span>
        </>
      )}
    </div>
  );
}
