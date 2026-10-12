/**
 * Hợp đồng kiểu dữ liệu (type contract) dùng chung cho toàn bộ WebLiseaMade.
 * File này do Lead sở hữu — teammates KHÔNG sửa, chỉ import.
 */

/** Nhóm sản phẩm hiển thị trên storefront. */
export type CategoryId = "ao" | "vay-dam" | "set-do" | "phu-kien";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

/** Một lựa chọn của sản phẩm: size hoặc màu. */
export interface ProductVariant {
  id: string;
  label: string;
  kind: "size" | "color";
  /** Hex dùng để vẽ swatch khi kind === "color". */
  swatch?: string;
  inStock: boolean;
}

export interface Product {
  /** Slug duy nhất, dùng luôn làm route param :slug và id giỏ hàng. */
  id: string;
  name: string;
  /** Giá bán tính bằng VND (số nguyên, không thập phân). */
  price: number;
  /** Giá gạch ngang nếu đang giảm giá. */
  compareAtPrice?: number;
  category: CategoryId;
  /**
   * Danh sách URL ảnh thật của shop.
   * Để rỗng [] khi chưa có ảnh thật -> ProductImage sẽ tự vẽ placeholder.
   */
  images: string[];
  shortDescription: string;
  description: string;
  materials: string[];
  variants: ProductVariant[];
  /** 0..5 */
  rating: number;
  reviewCount: number;
  badges: string[];
}

/** Một dòng trong giỏ hàng (dạng thô, lưu localStorage). */
export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

/** Dòng giỏ hàng đã join với catalog để hiển thị. */
export interface CartLineDetailed extends CartLine {
  product: Product;
  variant: ProductVariant;
  unitPrice: number;
  lineTotal: number;
}

export interface Totals {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

export type PaymentMethod = "cod" | "bank-transfer" | "e-wallet";

export interface CheckoutInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  district: string;
  note: string;
  paymentMethod: PaymentMethod;
}

export type OrderStatus = "pending" | "processing" | "shipping" | "delivered" | "cancelled";

export interface PlacedOrder {
  /** Mã đơn hiển thị cho khách, ví dụ "LM-8F3K2Q". */
  code: string;
  /** ISO timestamp. */
  createdAt: string;
  lines: CartLineDetailed[];
  totals: Totals;
  info: CheckoutInfo;
  /** Trạng thái đơn hàng quản lý trong Admin */
  status?: OrderStatus;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

/** Trạng thái filter/sort của trang danh mục, đồng bộ 2 chiều với URL search params. */
export interface CatalogQuery {
  category: CategoryId | "all";
  q: string;
  sort: SortKey;
}

/** Cấu hình các mục hiển thị dạng ảnh kèm chú thích trên trang chủ. */
export interface HomeSectionItem {
  id: string;
  src: string;
  caption: string;
}

/** Toàn bộ cấu hình văn bản và hình ảnh của Trang chủ. */
export interface HomePageSettings {
  // 1. Hero banner
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroImage: string;

  // 2. Featured
  featuredEyebrow: string;
  featuredTitle: string;
  featuredCtaText: string;

  // 3. Lifestyle
  lifestyleEyebrow: string;
  lifestyleTitle: string;
  lifestyleDescription: string;
  lifestyleItems: HomeSectionItem[];

  // 4. Lookbook
  lookbookEyebrow: string;
  lookbookTitle: string;
  lookbookItems: HomeSectionItem[];

  // 5. Brand Story
  brandStoryEyebrow: string;
  brandStoryTitle: string;
  brandStoryQuote: string;
  brandStoryCtaText: string;
  brandStoryCtaLink: string;
  brandStoryImage: string;
  brandStoryContact: string;

  // 6. TikTok / Social
  tiktokEyebrow: string;
  tiktokFollowersText: string;
  tiktokLikesText: string;
  tiktokCtaText: string;
  tiktokUrl: string;
}
