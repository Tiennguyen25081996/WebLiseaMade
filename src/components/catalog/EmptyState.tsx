import { Link } from "react-router-dom";
import type { CatalogQuery } from "@/types";

interface EmptyStateProps {
  /** Trạng thái filter/sort hiện tại để hiển thị đúng ngữ cảnh rỗng. */
  query: CatalogQuery;
}

/**
 * Trạng thái rỗng của trang danh mục: hiển thị khi không có sản phẩm nào khớp
 * bộ lọc/từ khoá, kèm gợi ý và lối thoát về danh sách đầy đủ.
 */
export function EmptyState({ query }: EmptyStateProps) {
  const term = query.q.trim();

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl bg-lagoon-50 p-6 ring-1 ring-lagoon-200"
    >
      <p className="text-lg font-semibold text-lagoon-800">
        {term
          ? `Không tìm thấy sản phẩm nào khớp với "${term}".`
          : "Không có sản phẩm nào để hiển thị."}
      </p>
      <p className="mt-2 text-sm text-ink-700">
        Thử tìm không dấu (ví dụ: <span className="font-mono">ao dai</span> thay vì
        "áo dài"), hoặc bỏ bớt từ khoá để có thêm kết quả.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to="/san-pham"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-lagoon-800 ring-1 ring-lagoon-200 hover:bg-lagoon-100"
        >
          Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
}
