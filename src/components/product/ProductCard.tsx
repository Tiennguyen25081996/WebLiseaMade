import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { getCategoryName } from "@/data/categories";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { Rating } from "@/components/ui/Rating";
import { ProductImage } from "./ProductImage";

interface ProductCardProps {
  product: Product;
  /** Ảnh đầu tiên tải ngay (above the fold) thay vì lazy. */
  priority?: boolean;
}

/**
 * Thẻ sản phẩm editorial: chrome minimal, hairline, zoom cham slow 1.04.
 * Typography carry the card: ten san pham cò sach them display serif.
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const href = `/san-pham/${product.id}`;
  const totalStock = product.variants.filter((v) => v.inStock).length;
  const hasSecondary = Boolean(product.images[1]);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-hair bg-sand-100 transition-all duration-500 hover:shadow-[0_8px_24px_rgba(28,26,24,0.05)]">
      <Link to={href} className="hover-zoom aspect-4/5 relative overflow-hidden block" tabIndex={-1}>
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          seed={product.id}
          priority={priority}
          className={`animate-image-enter transition-opacity duration-700 ease-couture ${
            hasSecondary ? "group-hover:opacity-0" : ""
          }`}
        />
        {hasSecondary && (
          <ProductImage
            src={product.images[1]}
            alt={`${product.name} — góc nhìn thứ hai`}
            seed={`${product.id}-alt`}
            priority={false}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-couture group-hover:opacity-100"
          />
        )}
        {product.badges.length > 0 && (
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
            {product.badges.slice(0, 2).map((b) => (
              <Badge key={b} tone="neutral">
                {b}
              </Badge>
            ))}
          </div>
        )}
        {totalStock === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-sand-50/75 backdrop-blur-[1px]">
            <span className="border-1 border-ink-900/20 rounded-hair px-3 py-1 text-eyebrow uppercase tracking-[0.16em] text-ink-900">
              Tạm hết hàng
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <p className="eyebrow-label">{getCategoryName(product.category)}</p>

        <h3 className="font-display text-display-sm font-normal text-ink-900">
          <Link to={href} className="underline-reveal hover:text-lagoon-700">
            {product.name}
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-ink-500">
          {product.shortDescription}
        </p>

        <Rating value={product.rating} count={product.reviewCount} />

        <div className="mt-auto pt-3">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
        </div>
      </div>
    </article>
  );
}
