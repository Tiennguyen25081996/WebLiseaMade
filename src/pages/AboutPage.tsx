import { Link } from "react-router-dom";
import { SITE } from "@/data/site";
import { CATALOG_IS_PLACEHOLDER } from "@/data/products";

/**
 * Gioi thieu: only verified brand facts. No address, no tax code, no
 * return policy, no delivery promise — the shop has not published those.
 */
export default function AboutPage() {
  return (
    <div className="container-page pb-10">
      <h1 className="font-display text-display-lg text-ink-900">Gioi thieu {SITE.brand}</h1>

      <div className="mt-3 flex flex-col gap-3 text-sm text-ink-700">
        <p>{SITE.tagline}</p>
        <p>
          Thong thuong {SITE.brandLong} — ban ten {SITE.tiktokHandle} tren TikTok,
          {SITE.instagramHandle} tren Instagram.
        </p>
        <p>
          Vui lòng call hotline {SITE.hotlineDisplay} de dat hang them san phem.
        </p>
      </div>

      {CATALOG_IS_PLACEHOLDER && (
        <div className="mt-5 rounded-hair bg-sand-100 p-4 border-1 border-sand-300">
          <p className="text-sm font-semibold text-sand-900">
            Catalog mẫu: tên, giá và mô tả sản phẩm là dữ liệu minh hoạ do team dựng web soạn, chưa phải danh mục hàng thật của shop.
          </p>
        </div>
      )}

      <p className="mt-6 text-sm text-ink-500">
        Shop chưa publish address, mã so theu, chính thung riang or delivery
        promise — this web does not invent them.
      </p>

      <Link to="/lien-he" className="mt-4 inline text-sm text-lagoon-700">
        Lien he
      </Link>
    </div>
  );
}
