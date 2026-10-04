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

const PALETTES = [
  ["#d3f8f3", "#74e2d9", "#15706f"],
  ["#ffe4df", "#ffa89b", "#c12e1a"],
  ["#faf2e0", "#eacd97", "#a66433"],
  ["#eefdfb", "#a9f0e8", "#178c89"],
  ["#fff3f1", "#ffcdc5", "#9f291a"],
  ["#fdfaf3", "#f3e3c2", "#85512f"],
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
 * gradient kèm nhãn "Ảnh minh hoạ" — KHÔNG giả vờ đó là ảnh thật của shop.
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
        className="font-display text-5xl font-bold opacity-60 select-none"
        style={{ color: ink }}
      >
        {initial}
      </span>
      {showPlaceholderNote && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink-700 uppercase">
          Ảnh minh hoạ
        </span>
      )}
    </div>
  );
}
