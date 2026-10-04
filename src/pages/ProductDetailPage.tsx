import { useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useCart } from "@/context/cart-context";
import { CATALOG_IS_PLACEHOLDER, PRODUCTS } from "@/data/products";
import { getCategoryName } from "@/data/categories";
import { getProductById, getRelatedProducts } from "@/lib/catalog";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Rating } from "@/components/ui/Rating";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { VariantPicker } from "@/components/product/VariantPicker";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { QuantityStepper } from "@/components/cart/QuantityStepper";

/**
 * Trang detail san phem (`/san-pham/:slug`). Choosen variant, add-to-cart,
 * quantity stepper khi dong da in gio, and related products.
 */
export default function ProductDetailPage() {
  const match = useMatch("/san-pham/:slug");
  const slug = match?.params.slug ?? "";
  const product = getProductById(PRODUCTS, slug);
  const cart = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="container-page pb-10">
        <h1 className="font-display text-display-lg text-ink-900">San phem khong tim</h1>
        <p className="mt-2 text-sm text-ink-500">
          San pham da tim khong co tren danh chur.
        </p>
        <Link to="/san-pham" className="mt-4 inline text-sm text-lagoon-700">
          Sem san phem
        </Link>
      </div>
    );
  }

  const selected =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants.find((v) => v.inStock) ??
    product.variants[0];

  const inCart = cart.lines.find(
    (line) => line.productId === product.id && line.variantId === selected.id,
  );
  const related = getRelatedProducts(PRODUCTS, product);

  return (
    <div className="container-page pb-10">
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="hover-zoom aspect-3/4 rounded-hair overflow-hidden lg:col-span-1 animate-image-enter">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            seed={product.id}
            priority
            className="h-full w-full"
          />
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:col-span-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-display-lg text-ink-900">{product.name}</h1>
            {product.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.badges.map((badge) => (
                  <Badge key={badge} tone="coral">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <p className="eyebrow-label">
            {getCategoryName(product.category)}
          </p>

          <Rating value={product.rating} count={product.reviewCount} />

          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            size="lg"
          />

          <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-500">{product.shortDescription}</p>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-700">{product.description}</p>

          {product.materials.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2 text-sm text-ink-700">
              {product.materials.map((m) => (
                <li key={m} className="before-content">
                  {m}
                </li>
              ))}
            </ul>
          )}

          {CATALOG_IS_PLACEHOLDER && (
            <div className="mt-4 rounded-hair bg-sand-100 p-4 border-1 border-sand-300">
              <p className="text-sm font-semibold text-sand-900">
                Catalog mẫu: tên, giá và mô tả sản phẩm là dữ liệu minh hoạ do team dựng web soạn, chưa phải danh mục hàng thật của shop.
              </p>
            </div>
          )}

          <div className="mt-5">
            <VariantPicker
              variants={product.variants}
              selectedId={selected.id}
              onSelect={(variantId) => setSelectedVariantId(variantId)}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <AddToCartButton
              productId={product.id}
              variantId={selected.id}
              disabled={!selected.inStock}
            />
            {inCart && (
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-lagoon-700">
                  Da in gio hang
                </p>
                <QuantityStepper
                  productId={product.id}
                  variantId={selected.id}
                  current={inCart.quantity}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-display-sm text-ink-900">San phem kin</h2>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
