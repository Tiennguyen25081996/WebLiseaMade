const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** 320000 -> "320.000 ₫" */
export function formatVnd(amount: number): string {
  return vnd.format(amount);
}

/** 320000 -> "320.000" (dùng cho input/ngắn gọn, không kèm ký hiệu tiền tệ). */
const plain = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

export function formatNumber(amount: number): string {
  return plain.format(amount);
}

/** Phần trăm giảm giá làm tròn, 0 nếu không giảm. */
export function discountPercent(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** Rút gọn số lớn: 187800 -> "187,8K". */
const compact = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompact(value: number): string {
  return compact.format(value);
}

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

/** "2025-03-14T09:30:00.000Z" -> "09:30 14/03/2025" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const time = timeFormatter.format(d);
  const date = dateFormatter.format(d);
  return `${time} ${date}`;
}
