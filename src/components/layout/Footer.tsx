import { Link } from "react-router-dom";
import { SITE, ZALO_URL } from "@/data/site";
import { PhoneIcon } from "@/components/ui/icons";

/** Tính một lần lúc module nạp — tránh gọi hàm impure trong lúc render. */
const COPYRIGHT_YEAR = new Date().getFullYear();

export function Footer() {
  const year = COPYRIGHT_YEAR;

  return (
    <footer className="mt-20 border-t border-sand-200 bg-white">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-xl font-bold text-lagoon-800">{SITE.brand}</p>
          <p className="mt-2 text-sm text-ink-500">{SITE.tagline}</p>
          <p className="mt-3 text-sm text-ink-500">
            Thương hiệu của {SITE.brandLong} — {SITE.tiktokHandle}
          </p>
        </div>

        <nav aria-label="Liên kết mua sắm">
          <h2 className="text-sm font-bold tracking-wide text-ink-900 uppercase">Mua sắm</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            <li>
              <Link className="hover:text-lagoon-700" to="/san-pham">
                Tất cả sản phẩm
              </Link>
            </li>
            <li>
              <Link className="hover:text-lagoon-700" to="/gio-hang">
                Giỏ hàng
              </Link>
            </li>
            <li>
              <Link className="hover:text-lagoon-700" to="/tra-cuu-don">
                Tra cứu đơn hàng
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Về chúng tôi">
          <h2 className="text-sm font-bold tracking-wide text-ink-900 uppercase">Về chúng tôi</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            <li>
              <Link className="hover:text-lagoon-700" to="/gioi-thieu">
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link className="hover:text-lagoon-700" to="/lien-he">
                Liên hệ
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-bold tracking-wide text-ink-900 uppercase">Kết nối</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            <li>
              <a
                className="inline-flex items-center gap-2 hover:text-lagoon-700"
                href={`tel:${SITE.hotline}`}
              >
                <PhoneIcon className="h-4 w-4" />
                {SITE.hotlineDisplay}
              </a>
            </li>
            <li>
              <a
                className="hover:text-lagoon-700"
                href={SITE.tiktokUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                TikTok {SITE.tiktokHandle}
              </a>
            </li>
            <li>
              <a
                className="hover:text-lagoon-700"
                href={SITE.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                Instagram {SITE.instagramHandle}
              </a>
            </li>
            <li>
              <a
                className="hover:text-lagoon-700"
                href={ZALO_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                Zalo {SITE.hotlineDisplay}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sand-200">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.brand}. Bảo lưu mọi quyền.
          </p>
          <p>Giá và tồn kho là thông tin tham khảo, vui lòng xác nhận qua hotline {SITE.hotlineDisplay}.</p>
        </div>
      </div>
    </footer>
  );
}
