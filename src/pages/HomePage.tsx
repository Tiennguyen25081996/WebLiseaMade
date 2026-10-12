import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin-store";
import { getCategoryName } from "@/data/categories";
import { formatVnd } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";

/**
 * Trang chủ theo Figma 62:33 (1440×4820): Hero → Notice → Featured →
 * Lifestyle → Lookbook → BrandStory → TikTok.
 * Dữ liệu văn bản và hình ảnh đọc trực tiếp từ `homeSettings` (quản trị trong Admin).
 * Khi admin cập nhật ảnh/chữ trong Admin Board, Trang chủ lập tức đồng bộ thời gian thực.
 */
export default function HomePage() {
  const { products, homeSettings } = useAdminStore();
  const featured = products.slice(0, 3);
  const lifestyle = homeSettings.lifestyleItems;
  const lookbook = homeSettings.lookbookItems;

  return (
    <div className="pb-16">
      {/* Hero (Figma 62:35): eyebrow + H1 + P + CTA, ảnh phải. */}
      <section className="container-page grid items-center gap-8 md:grid-cols-12">
        <div className="order-2 flex flex-col gap-4 md:order-1 md:col-span-5">
          <p className="eyebrow-label text-lagoon-600">
            {homeSettings.heroEyebrow}
          </p>
          <h1 className="font-display text-display-lg text-ink-900 md:text-display-xl">
            {homeSettings.heroTitle}
          </h1>
          <p className="max-w-prose text-base text-ink-500">
            {homeSettings.heroDescription}
          </p>
          <div>
            <Button to={homeSettings.heroCtaLink}>{homeSettings.heroCtaText}</Button>
          </div>
        </div>
        <div className="order-1 md:order-2 md:col-span-7">
          <div className="hover-zoom animate-image-enter aspect-4/5 overflow-hidden rounded-hair md:aspect-4/3">
            <ProductImage
              src={homeSettings.heroImage}
              alt={`${homeSettings.heroTitle} — ${homeSettings.heroEyebrow}`}
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
        <p className="eyebrow-label">{homeSettings.featuredEyebrow}</p>
        <h2 id="featured-h2" className="mt-2 font-display text-display-md text-ink-900">
          {homeSettings.featuredTitle}
        </h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => {
            const category = getCategoryName(product.category);
            const seedMap: Record<string, string[]> = {
              "Áo": ["/shop-tiktok/feat1.jpg"],
              "Váy & Đầm": ["/shop-tiktok/cat2.jpg"],
              "Set đồ": ["/shop-tiktok/cat3.jpg"],
              "Phụ kiện": ["/shop-tiktok/cat4.jpg"],
            };
            const productWithImages =
              product.images.length > 0
                ? product
                : { ...product, images: seedMap[category] ?? ["/shop-tiktok/feat2.jpg"] };

            return <ProductCard key={product.id} product={productWithImages} />;
          })}
        </div>
        <div className="mt-6">
          <Button to="/san-pham">{homeSettings.featuredCtaText}</Button>
        </div>
      </section>

      {/* Lifestyle (Figma 62:192): 4 ảnh caption scrim. */}
      <section className="container-page mt-16" aria-labelledby="life-h2">
        <p className="eyebrow-label">{homeSettings.lifestyleEyebrow}</p>
        <h2 id="life-h2" className="mt-2 font-display text-display-md text-ink-900">
          {homeSettings.lifestyleTitle}
        </h2>
        <p className="mt-2 text-sm text-ink-700">
          {homeSettings.lifestyleDescription}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {lifestyle.map((item, idx) => (
            <figure key={item.id || item.src || idx} className="hover-zoom rounded-hair">
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
        <p className="eyebrow-label">{homeSettings.lookbookEyebrow}</p>
        <h2 id="look-h2" className="mt-2 font-display text-display-md text-ink-900">
          {homeSettings.lookbookTitle}
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {lookbook.map((item, idx) => (
            <figure key={item.id || item.src || idx} className="hover-zoom rounded-hair">
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
          <p className="eyebrow-label text-lagoon-600">{homeSettings.brandStoryEyebrow}</p>
          <h2 className="mt-2 font-display text-display-md text-ink-900">
            {homeSettings.brandStoryTitle}
          </h2>
          <blockquote className="mt-4 font-display text-display-sm text-lagoon-600 italic">
            {homeSettings.brandStoryQuote}
          </blockquote>
          <div className="mt-5">
            <Button to={homeSettings.brandStoryCtaLink}>{homeSettings.brandStoryCtaText}</Button>
          </div>
          <p className="mt-4 text-sm text-ink-500">
            {homeSettings.brandStoryContact}
          </p>
        </div>
        <div className="hover-zoom animate-image-enter aspect-4/5 overflow-hidden rounded-hair">
          <ProductImage
            src={homeSettings.brandStoryImage}
            alt={homeSettings.brandStoryTitle}
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
            {homeSettings.tiktokEyebrow}
          </p>
          <p className="mt-2 font-display text-display-sm text-ink-900">
            {homeSettings.tiktokFollowersText} · {homeSettings.tiktokLikesText}
          </p>
        </div>
        <div className="md:text-right">
          <a
            href={homeSettings.tiktokUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="underline-reveal text-sm font-medium text-ink-900 hover:text-lagoon-700"
          >
            {homeSettings.tiktokCtaText}
          </a>
        </div>
      </section>

      {/* Giá tham khảo nhanh — giữ ProductCard làm nguồn sự thật hiển thị. */}
      <section className="container-page mt-16" aria-label="Giá tham khảo">
        <h2 className="font-display text-display-sm text-ink-900">
          Giá tham khảo: từ {formatVnd(165000)} đến {formatVnd(720000)}
        </h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-500">
          {products.slice(0, 6).map((p) => (
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
