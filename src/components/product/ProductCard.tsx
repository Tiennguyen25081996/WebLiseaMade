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

/** Thẻ sản phẩm dùng chung cho trang chủ và trang danh mục. */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const href = `/san-pham/${product.id}`;
  const totalStock = product.variants.filter((v) => v.inStock).length;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card bg-white ring-1 ring-sand-200 transition-shadow hover:shadow-lg hover:shadow-sand-300/40">
      <Link to={href} className="relative block aspect-4/5 overflow-hidden" tabIndex={-1}>
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          seed={product.id}
          priority={priority}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {product.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.badges.slice(0, 2).map((b) => (
              <Badge key={b} tone="coral">
                {b}
              </Badge>
            ))}
          </div>
        )}
        {totalStock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-ink-900/85 px-3 py-1 text-xs font-bold text-white">
              Tạm hết hàng
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-semibold tracking-wide text-lagoon-700 uppercase">
          {getCategoryName(product.category)}
        </p>

        <h3 className="font-semibold text-ink-900">
          <Link to={href} className="hover:text-lagoon-700">
            {product.name}
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm text-ink-500">{product.shortDescription}</p>

        <Rating value={product.rating} count={product.reviewCount} />

        <div className="mt-auto pt-2">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
      </div>
    </article>
  );
}
