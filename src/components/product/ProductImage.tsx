import { useState } from "react";

interface ProductImageProps {
  /** URL ảnh thật. Rỗng/không có -> vẽ placeholder có ghi chú rõ ràng. */
  src?: string;
  alt: string;
  /** Chuỗi ổn định để chọn màu placeholder (thường là product.id). */
  seed?: string;
  className?: string;
  /** Hiện nhãn "Ảnh minh hoạ" — bật cho ảnh placeholder. */
  showPlaceholderNote?: boolean;
  /** Ảnh above-the-fold: tải ngay (eager) thay vì lazy. */
  priority?: boolean;
}

/* Duotone muted editorial — art direction calm, không saturated. */
const PALETTES = [
  ["#ece6da", "#c8bfa9", "#574d3c"],
  ["#e7ede8", "#c3d2c8", "#314945"],
  ["#f4eae4", "#e0cfc4", "#61392f"],
  ["#f1f0ec", "#d9d6ce", "#3d3a36"],
  ["#eae7e0", "#cfc9bc", "#3e3629"],
  ["#e9eee9", "#ccd6cc", "#243936"],
] as const;

/** Băm chuỗi thành số ổn định để placeholder không đổi màu giữa các lần render. */
function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Ảnh sản phẩm. Khi shop chưa cung cấp ảnh thật, component vẽ placeholder
 * duotone muted kèm nhãn "Ảnh minh hoạ" — KHÔNG giả vờ đó là ảnh thật của shop.
 * Nếu ảnh thật lỗi tải, tự động rơi về placeholder.
 */
export function ProductImage({
  src,
  alt,
  seed = alt,
  className = "",
  showPlaceholderNote = true,
  priority = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const hasRealImage = Boolean(src) && !failed;

  if (hasRealImage) {
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const [from, to, ink] = PALETTES[hashString(seed) % PALETTES.length];
  const initial = alt.trim().charAt(0).toUpperCase() || "L";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      role="img"
      aria-label={`${alt} (ảnh minh hoạ)`}
    >
      <span
        className="font-display text-6xl font-normal opacity-30 select-none"
        style={{ color: ink }}
      >
        {initial}
      </span>
      {showPlaceholderNote && (
        <span className="absolute bottom-3 left-3 inline-block border-1 border-ink-900/15 rounded-hair px-2 py-1 text-eyebrow uppercase tracking-[0.16em] text-ink-700">
          Ảnh minh hoạ
        </span>
      )}
    </div>
  );
}
