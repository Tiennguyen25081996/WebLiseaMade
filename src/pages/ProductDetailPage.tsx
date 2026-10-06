import { useState, useMemo, useRef } from "react";
import { useMatch } from "react-router-dom";
import { useCart } from "@/context/cart-context";
import { PRODUCTS } from "@/data/products";
import { getCategoryName } from "@/data/categories";
import { getProductById, getRelatedProducts } from "@/lib/catalog";
import { Price } from "@/components/ui/Price";
import { ProductImage } from "@/components/product/ProductImage";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { Button } from "@/components/ui/Button";

/**
 * Trang detail sản phẩm (`/san-pham/:slug`).
 * Khớp chính xác Figma node 62-138 - Editorial Hawaii Luxury.
 */
export default function ProductDetailPage() {
  const match = useMatch("/san-pham/:slug");
  const slug = match?.params.slug ?? "";
  const product = getProductById(PRODUCTS, slug);
  const cart = useCart();

  const [selectedVariantId] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="container-page pb-10">
        <h1 className="font-display text-display-lg text-ink-900">Sản phẩm không tìm thấy</h1>
        <p className="mt-2 text-sm text-ink-500">Sản phẩm đã tìm không có trên danh mục.</p>
        <a href="/san-pham" className="mt-4 inline text-sm text-lagoon-700 underline-reveal">Xem sản phẩm khác</a>
      </div>
    );
  }

  // Default to first in-stock variant immediately
  const defaultVariantId = useMemo(() => {
    return product.variants.find((v) => v.inStock)?.id ?? product.variants[0]?.id ?? null;
  }, [product.variants]);

  const effectiveVariantId = selectedVariantId ?? defaultVariantId;

  const selected = useMemo(() => {
    if (!effectiveVariantId) return product.variants[0];
    return product.variants.find((v) => v.id === effectiveVariantId) ?? product.variants[0];
  }, [product.variants, effectiveVariantId]);

  const inCart = useMemo(() => {
    if (!cart?.lines) return undefined;
    return cart.lines.find((line) => line.productId === product.id && line.variantId === selected.id);
  }, [cart?.lines, product.id, selected.id]);

  const related = useMemo(() => getRelatedProducts(PRODUCTS, product), [product]);

  const productImage = product.images[0] ?? "/placeholder-product.jpg";

  // Build variant display string like Figma: "S · M · L · XL (hết hàng)"
  const variantLabels = product.variants.map((v) => 
    v.inStock ? v.label : `${v.label} (hết hàng)`
  ).join(" · ");

  const discountPercent = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  // Slider ref & scroll logic
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollRelated = (direction: 'prev' | 'next') => {
    const slider = sliderRef.current;
    if (!slider) return;
    const cardWidth = 362 + 32; // card width + gap
    const scrollAmount = direction === 'next' ? cardWidth : -cardWidth;
    slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="container-page pb-10 bg-sand-50">
      {/* Header breadcrumb */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-eyebrow text-ink-500">
          <li><a href="/" className="hover:text-ink-900 underline-reveal">Trang chủ</a></li>
          <li className="text-ink-300">/</li>
          <li><a href="/san-pham" className="hover:text-ink-900 underline-reveal">Sản phẩm</a></li>
          <li className="text-ink-300">/</li>
          <li className="text-ink-900" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Gallery - Left: 568x760 aspect */}
        <div className="relative aspect-[568/760] rounded-hair overflow-hidden bg-sand-200">
          <ProductImage
            src={productImage}
            alt={product.name}
            seed={product.id}
            priority
            className="h-full w-full object-cover"
            showPlaceholderNote={false}
          />
        </div>

        {/* Info - Right: 500px width */}
        <div className="flex flex-col gap-0">
          {/* Badge - Coral text */}
          {product.badges.length > 0 && (
            <span className="inline-block text-eyebrow font-medium text-coral-700 mb-4">
              {product.badges[0]}
            </span>
          )}

          {/* Product Name - Fraunces 56px (-0.03em tracking per style_adca7344) */}
          <h1 className="font-display text-[56px] leading-[1.15] tracking-[-0.03em] text-ink-900 mb-4">
            {product.name}
          </h1>

          {/* Category - Eyebrow style */}
          <p className="eyebrow-label text-ink-500 mb-6">{getCategoryName(product.category)}</p>

          {/* Price Row */}
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-[28px] font-medium text-ink-900 tabular-nums">
              {product.price.toLocaleString("vi-VN")} ₫
            </span>
            {product.compareAtPrice && discountPercent > 0 && (
              <span className="text-[15px] font-medium text-ink-500 tabular-nums">
                {product.compareAtPrice.toLocaleString("vi-VN")} ₫ · −{discountPercent}%
              </span>
            )}
          </div>

          {/* Short Description - Inter 18px */}
          <p className="text-[18px] leading-relaxed text-ink-500 mb-4 max-w-[500px]">
            {product.shortDescription}
          </p>

          {/* Long Description - Inter 18px */}
          <p className="text-[18px] leading-relaxed text-ink-700 mb-6 max-w-[500px]">
            {product.description}
          </p>

          {/* Materials - Inter 13px */}
          {product.materials.length > 0 && (
            <p className="text-[13px] leading-relaxed text-ink-700 mb-8 max-w-[500px]">
              {product.materials.join(" · ")}
            </p>
          )}

          {/* Variants Display - Text only, not interactive pills */}
          <p className="text-[17px] font-medium text-ink-900 mb-8 max-w-[500px]">
            {variantLabels}
          </p>

          {/* Action Buttons - Two buttons side by side: 240x48 each */}
          <div className="flex items-center gap-4 mb-6">
            {/* Add to Cart - Ink background */}
            <AddToCartButton
              productId={product.id}
              variantId={selected.id}
              disabled={!selected.inStock}
              ariaDisabled={!selected.inStock}
              size="lg"
              label="Thêm vào giỏ →"
              className="w-[240px] h-[48px] rounded-hair bg-ink-900 text-sand-50 hover:bg-ink-700 text-[18px] font-medium tracking-[0.02em]"
            />
            
            {/* Buy Now - Lagoon background */}
            <Button
              variant="primary"
              size="lg"
              className="w-[240px] h-[48px] rounded-hair bg-lagoon-600 text-sand-50 hover:bg-lagoon-700 text-[18px] font-medium tracking-[0.02em]"
              onClick={() => {
                // Add to cart then navigate to checkout
                cart.addItem(product.id, selected.id, 1);
                window.location.href = "/thanh-toan";
              }}
              disabled={!selected.inStock}
            >
              Mua ngay
            </Button>
          </div>

          {/* Shipping Note - Lagoon 13px */}
          <p className="text-[13px] text-lagoon-600 max-w-[500px]">
            Miễn ship đơn từ 500.000 ₫ · Đổi trả 7 ngày
          </p>

          {/* Quantity Stepper when in cart */}
          {inCart && (
            <div className="mt-6 flex items-center gap-3">
              <p className="text-sm font-medium text-lagoon-700">Đã ở trong giỏ hàng</p>
              <QuantityStepper
                productId={product.id}
                variantId={selected.id}
                current={inCart.quantity}
                aria-label="Số lượng sản phẩm trong giỏ hàng"
              />
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section - Luxury Slider */}
      {related.length > 0 && (
        <section className="mt-20 lg:col-span-2" aria-labelledby="related-heading">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p id="related-label" className="eyebrow-label text-coral-700 mb-2">SẢN PHẨM LIÊN QUAN</p>
                <h2 id="related-heading" className="font-display text-[56px] leading-[1.15] tracking-[-0.03em] text-ink-900">
                  Có thể bạn cũng thích
                </h2>
              </div>
              {/* Slider Navigation */}
              <div className="flex items-center gap-2 flex-shrink-0" aria-label="Điều hướng sản phẩm liên quan">
                <button
                  id="related-prev"
                  type="button"
                  className="rounded-hair bg-ink-900 text-sand-50 p-3 hover:bg-ink-700 transition-colors duration-500 ease-editorial focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lagoon-600"
                  aria-label="Sản phẩm trước"
                  onClick={() => scrollRelated('prev')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  id="related-next"
                  type="button"
                  className="rounded-hair bg-ink-900 text-sand-50 p-3 hover:bg-ink-700 transition-colors duration-500 ease-editorial focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lagoon-600"
                  aria-label="Sản phẩm tiếp theo"
                  onClick={() => scrollRelated('next')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              ref={sliderRef}
              className="flex gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
              role="region"
              aria-roledescription="carousel"
              aria-label="Sản phẩm liên quan"
            >
              {related.slice(0, 6).map((p, index) => (
                <article
                  key={p.id}
                  className="group relative bg-sand-100 rounded-hair overflow-hidden snap-start flex-shrink-0 transition-transform duration-700 ease-couture hover:scale-[1.01]"
                  style={{
                    width: '362px',
                    height: '480px',
                    flexShrink: 0,
                  }}
                >
                  <div className="relative aspect-[362/360] overflow-hidden">
                    <ProductImage
                      src={p.images[0] ?? "/placeholder-product.jpg"}
                      alt={p.name}
                      seed={p.id}
                      priority={index < 3}
                      className="h-full w-full object-cover transition-transform duration-[1600ms] ease-couture group-hover:scale-[1.04]"
                      showPlaceholderNote={false}
                    />
                    {p.badges.length > 0 && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {p.badges.map((badge) => (
                          <span
                            key={badge}
                            className="rounded-hair bg-coral-700/90 px-2 py-0.5 text-eyebrow font-medium text-sand-50"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em] text-ink-900 mb-3 group-hover:text-lagoon-600 transition-colors duration-500 ease-editorial">
                      {p.name}
                    </h3>
                    <div className="flex items-baseline gap-3">
                      <Price price={p.price} compareAtPrice={p.compareAtPrice} size="md" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}