import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { SITE } from "@/data/site";
import { PRODUCTS } from "@/data/products";
import { getCategoryName } from "@/data/categories";
import { formatCompact, formatVnd } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";

/**
 * Trang chủ theo Figma 62:33 (1440×4820): Hero → Notice → Featured →
 * Lifestyle → Lookbook → BrandStory → TikTok.
 * Ảnh qua `images` thật trong `public/shop-tiktok`, sản phẩm qua ProductCard.
 * Tên/giá mẫu giữ nguyên + banner "Catalog mẫu".
 */
export default function HomePage() {
  const featured = PRODUCTS.slice(0, 3);
  const lifestyle = [
    { src: "/shop-tiktok/life1_fit.jpg", caption: "Đi biển · Voan hoa" },
    { src: "/shop-tiktok/life2_fit.jpg", caption: "Dạo phố · Linen mát" },
    { src: "/shop-tiktok/life3_fit.jpg", caption: "Cafe sáng · Cotton nhẹ" },
    { src: "/shop-tiktok/life4_1.jpg", caption: "Picnic · Summer 2026" },
  ];
  const lookbook = [
    { src: "/shop-tiktok/look1.jpg", caption: "Nắng sớm · Sơ mi voan" },
    { src: "/shop-tiktok/look2.jpg", caption: "Chiều biển · Maxi bay" },
    { src: "/shop-tiktok/look3.jpg", caption: "Phố hè · Linen đôi" },
    { src: "/shop-tiktok/look4.jpg", caption: "Đêm tiệc · Croptop" },
  ];

  /** Featured section dùng ảnh hero thật từ Figma/desktop design. */

  return (
    <div className="pb-16">
      {/* Hero (Figma 62:35): eyebrow + H1 120 + P + CTA, ảnh phải. */}
      <section className="container-page grid items-center gap-8 md:grid-cols-12">
        <div className="order-2 flex flex-col gap-4 md:order-1 md:col-span-5">
          <p className="eyebrow-label text-lagoon-600">
            Thời trang &amp; phụ kiện Hawaii Summer
          </p>
          <h1 className="font-display text-display-lg text-ink-900 md:text-display-xl">
            {SITE.brand}
          </h1>
          <p className="max-w-prose text-base text-ink-500">
            Voan, linen, cotton — nhẹ mát cho cả tuần nắng.
          </p>
          <div>
            <Button to="/san-pham">Khám phá bộ sưu tập →</Button>
          </div>
        </div>
        <div className="order-1 md:order-2 md:col-span-7">
          <div className="hover-zoom animate-image-enter aspect-4/5 overflow-hidden rounded-hair md:aspect-4/3">
            <ProductImage
              src="/shop-tiktok/hero.jpg"
              alt={`${SITE.brand} — bộ sưu tập Hawaii Summer`}
              seed="hero"
              priority
              showPlaceholderNote={false}
              className="h-full w-full"
            />
          </div>
        </div>
      </section>

      {/* Featured (Figma 62:37): eyebrow + H2 + 3 cards + CTA Xem tất cả. */}
      <section className="container-page mt-14" aria-labelledby="featured-h2">
        <p className="eyebrow-label">Nổi bật mùa hè</p>
        <h2 id="featured-h2" className="mt-2 font-display text-display-md text-ink-900">
          Sản phẩm bán chạy
        </h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => {
            /** Featured dùng hero images thật từ Figma desktop design: mỗi category seed riêng. */
            const category = getCategoryName(product.category);
            const seedMap: Record<string, [src: string]> = {
              "Áo": ["/shop-tiktok/feat1.jpg"],
              "Váy & Đầm": ["/shop-tiktok/cat2.jpg"],
              "Set đồ": ["/shop-tiktok/cat3.jpg"],
              "Phụ kiện": ["/shop-tiktok/cat4.jpg"],
            };
            const heroSeed = product.images[0] ?? (seedMap[category] ?? ["/shop-tiktok/feat2.jpg"])[0];

            return <ProductCard key={product.id} product={{ ...product, images: [heroSeed] }} />;
          })}
        </div>
        <div className="mt-6">
          <Button to="/san-pham">Xem tất cả sản phẩm →</Button>
        </div>
      </section>

      {/* Lifestyle (Figma 62:192): 4 ảnh caption scrim. */}
      <section className="container-page mt-16" aria-labelledby="life-h2">
        <p className="eyebrow-label">Phong cách sống Hawaii</p>
        <h2 id="life-h2" className="mt-2 font-display text-display-md text-ink-900">
          Mặc hè như đi biển
        </h2>
        <p className="mt-2 text-sm text-ink-700">
          Voan, linen, cotton — nhẹ, mát, phối sẵn cho cả tuần nắng.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {lifestyle.map((item) => (
            <figure key={item.src} className="hover-zoom rounded-hair">
              <ProductImage
                src={item.src}
                alt={item.caption}
                seed={item.src}
                showPlaceholderNote={false}
                className="aspect-3/4 w-full"
              />
              <figcaption className="bg-ink-900/50 px-4 py-2 text-sm text-sand-50">
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Lookbook (Figma 62:193): 4 ảnh thẳng baseline. */}
      <section className="container-page mt-16" aria-labelledby="look-h2">
        <p className="eyebrow-label">Lookbook mùa hè</p>
        <h2 id="look-h2" className="mt-2 font-display text-display-md text-ink-900">
          Phối đồ theo khoảnh khắc
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {lookbook.map((item) => (
            <figure key={item.src} className="hover-zoom rounded-hair">
              <ProductImage
                src={item.src}
                alt={item.caption}
                seed={item.src}
                showPlaceholderNote={false}
                className="aspect-3/4 w-full"
              />
              <figcaption className="bg-ink-900/50 px-4 py-2 text-sm text-sand-50">
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* BrandStory (Figma 62:194): quote + CTA + contact line + ảnh. */}
      <section className="container-page mt-16 grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="eyebrow-label text-lagoon-600">Câu chuyện thương hiệu</p>
          <h2 className="mt-2 font-display text-display-md text-ink-900">
            May cho mùa hè Việt
          </h2>
          <blockquote className="mt-4 font-display text-display-sm text-lagoon-600 italic">
            “Mỗi đường may đều hướng về biển — nhẹ, mát, tự do.”
          </blockquote>
          <div className="mt-5">
            <Button to="/gioi-thieu">Câu chuyện của chúng tôi →</Button>
          </div>
          <p className="mt-4 text-sm text-ink-500">
            {SITE.tiktokHandle} · Hotline {SITE.hotlineDisplay}
          </p>
        </div>
        <div className="hover-zoom animate-image-enter aspect-4/5 overflow-hidden rounded-hair">
          <ProductImage
            src="/shop-tiktok/story_tall.jpg"
            alt="Câu chuyện thương hiệu LiseaMade"
            seed="story"
            showPlaceholderNote={false}
            className="h-full w-full"
          />
        </div>
      </section>

      {/* TikTok (Figma 62:38): số liệu thật + follow. */}
      <section className="container-page mt-16 grid items-center gap-6 md:grid-cols-2" aria-label="TikTok của shop">
        <div>
          <p className="eyebrow-label text-lagoon-600">
            {SITE.tiktokHandle} trên TikTok
          </p>
          <p className="mt-2 font-display text-display-sm text-ink-900">
            {formatCompact(SITE.stats.followers)} followers ·{" "}
            {formatCompact(SITE.stats.likes)} likes
          </p>
        </div>
        <div className="md:text-right">
          <a
            href={SITE.tiktokUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="underline-reveal text-sm font-medium text-ink-900 hover:text-lagoon-700"
          >
            Follow {SITE.tiktokHandle} →
          </a>
        </div>
      </section>

      {/* Giá tham khảo nhanh — giữ ProductCard làm nguồn sự thật hiển thị. */}
      <section className="container-page mt-16" aria-label="Giá tham khảo">
        <h2 className="font-display text-display-sm text-ink-900">
          Giá tham khảo: từ {formatVnd(165000)} đến {formatVnd(720000)}
        </h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-500">
          {PRODUCTS.slice(0, 6).map((p) => (
            <li key={p.id}>
              <Link
                to={`/san-pham/${p.id}`}
                className="underline-reveal hover:text-lagoon-700"
              >
                {p.name}
              </Link>{" "}
              · {getCategoryName(p.category)} · {formatVnd(p.price)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
