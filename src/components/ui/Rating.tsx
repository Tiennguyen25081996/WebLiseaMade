import { StarIcon } from "./icons";

interface RatingProps {
  /** 0..5, cho phép số thập phân. */
  value: number;
  count?: number;
  size?: "sm" | "md";
  showValue?: boolean;
}

export function Rating({ value, count, size = "sm", showValue = true }: RatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  const roundToHalf = Math.round(clamped * 2) / 2;

  return (
    <div className="flex items-center gap-1.5" aria-label={`Đánh giá ${clamped.toFixed(1)} trên 5`}>
      <div className="flex items-center gap-0.5 text-sand-500">
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon
            key={i}
            className={`${dim} ${i <= roundToHalf ? "opacity-100" : "opacity-25"}`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-ink-500">{clamped.toFixed(1)}</span>
      )}
      {typeof count === "number" && (
        <span className="text-xs text-ink-500">({count})</span>
      )}
    </div>
  );
}
