import { discountPercent, formatVnd } from "@/lib/format";

interface PriceProps {
  price: number;
  compareAtPrice?: number;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { now: "text-sm font-semibold", was: "text-xs" },
  md: { now: "text-base font-bold", was: "text-sm" },
  lg: { now: "text-2xl font-bold", was: "text-base" },
} as const;

export function Price({ price, compareAtPrice, size = "md" }: PriceProps) {
  const s = SIZES[size];
  const off = discountPercent(price, compareAtPrice);

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`${s.now} text-coral-700`}>{formatVnd(price)}</span>
      {off > 0 && compareAtPrice !== undefined && (
        <>
          <span className={`${s.was} text-ink-500 line-through`}>
            {formatVnd(compareAtPrice)}
          </span>
          <span className="rounded-full bg-coral-100 px-2 py-0.5 text-xs font-bold text-coral-700">
            -{off}%
          </span>
        </>
      )}
    </div>
  );
}
