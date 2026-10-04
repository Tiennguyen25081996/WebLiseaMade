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
  const dim = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const roundToHalf = Math.round(clamped * 2) / 2;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-0.5 text-sand-400"
        role="img"
        aria-label={`Đánh giá ${clamped.toFixed(1)} trên 5`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon
            key={i}
            className={`${dim} ${i <= roundToHalf ? "opacity-90" : "opacity-30"}`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-eyebrow font-medium text-ink-700 tabular-nums">
          {clamped.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className="text-eyebrow text-ink-500 tabular-nums">
          {`${count} đánh`}
        </span>
      )}
    </div>
  );
}
