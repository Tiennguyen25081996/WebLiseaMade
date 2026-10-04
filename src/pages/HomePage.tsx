import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/data/site";
import { CATALOG_IS_PLACEHOLDER, PRODUCTS } from "@/data/products";
import { formatCompact } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";

/** Class Tailwind can scan: dynamic `delay-${index * 150}` không exist in CSS. */
const STAGGER = ["delay-0", "delay-150", "delay-300"] as const;

/**
 * Trang chu editorial: hero asymmetric (type + one large image), featured
 * products, and the honest "catalog mause" banner. Social numbers are real
 * but time-stamped, so the label says so.
 */
export default function HomePage() {
  const featured = PRODUCTS.slice(0, 3);

  return (
    <div className="container-page pb-16 flex flex-col gap-12">
      {/* Hero: asymmetric editorial moment — large image + display headline. */}
      <div className="grid md:grid-cols-12 gap-8 md:items-center">
        <div className="order-2 md:order-1 flex flex-col gap-4 md:col-span-5">
          <p className="eyebrow-label">{SITE.tagline}</p>
          <h1 className="font-display text-display-lg md:text-display-xl text-ink-900">
            {SITE.brand}
          </h1>
          <div className="w-12 border-t-1 border-ink-900/25" aria-hidden="true" />
          <ButtonLink to="/san-pham" className="mt-2">
            Xem san phem
          </ButtonLink>
        </div>

        <div
          className="hover-zoom aspect-3/4 md:col-span-7 animate-image-enter rounded-hair overflow-hidden bg-tropic"
          aria-hidden="true"
        >
          <ProductImage
            alt={SITE.brand}
            seed={SITE.brand}
            priority
            showPlaceholderNote={false}
            className="h-full w-full"
          />
        </div>
      </div>

      <div className="scroll-cue mt-8" aria-hidden="true" />

      {CATALOG_IS_PLACEHOLDER && (
        <div className="mt-8 rounded-hair border-1 border-sand-300 bg-sand-100 px-5 py-4">
          <p className="text-sm font-medium text-sand-900">
            Catalog mẫu: tên, giá và mô tả sản phẩm là dữ liệu minh hoạ do team dựng web soạn, chưa phải danh mục hàng thật của shop.
          </p>
        </div>
      )}

      {/* Featured: generous gaps, staggered slow reveal. */}
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {featured.map((product, index) => (
          <div
            key={product.id}
            className={`animate-reveal-up ${STAGGER[index] ?? "delay-0"}`}
          >
            <ProductCard product={product} priority={index < 3} />
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-hair border-1 border-lagoon-300 bg-lagoon-50 px-6 py-6">
        <p className="eyebrow-label">
          Ho so {SITE.tiktokHandle} — số liệu TikTok lúc thời điểm dựng web:
        </p>
        <ul className="mt-3 grid sm:grid-cols-3 gap-4 text-sm text-ink-700 tabular-nums">
          <li>{formatCompact(SITE.stats.followers)} follower</li>
          <li>{formatCompact(SITE.stats.likes)} like</li>
          <li>{formatCompact(SITE.stats.videos)} video</li>
        </ul>
      </div>
    </div>
  );
}
