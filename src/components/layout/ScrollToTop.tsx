import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop: Tự động cuộn trang lên đầu mỗi khi chuyển route (URL pathname thay đổi).
 * Giải quyết triệt để lỗi khi người dùng click xem sản phẩm hoặc chuyển trang trong SPA
 * bị giữ nguyên vị trí cuộn ở đáy trang trước.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}
