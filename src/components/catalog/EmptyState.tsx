import { Link } from "react-router-dom";
import type { CatalogQuery } from "@/types";

interface EmptyStateProps {
  /** Trạng thái filter/sort hiện tại để hiển thị đúng ngữ cảnh rỗng. */
  query: CatalogQuery;
}

/**
 * Trạng thái rỗng của trang danh mục: hiển thị khi không có sản phẩm nào khớp
 * bộ lọc/từ khoá, kèm gợi ý và lối thoat về danh sách day day.
 */
export function EmptyState({ query }: EmptyStateProps) {
  const term = query.q.trim();

  return (
    <div
      role="status"
      className="rounded-hair border-1 border-lagoon-300 bg-lagoon-50 px-8 py-8 animate-reveal-up"
    >
      <p className="font-display text-display-sm text-ink-900">
        {term
          ? `Không tìm thấy sản phẩm nào khớp với "${term}".`
          : "Không có sản phẩm nào để hiển thị."}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-700">
        Thử tìm không dấu (ví dụ: <span className="font-mono">ao dai</span> thay vì
        "áo dài"), hoặc bỏ bớt từ khoá để có thêm kết quả.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/san-pham"
          className="underline-reveal text-sm font-medium text-ink-900 hover:text-lagoon-700"
        >
                    Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
}
