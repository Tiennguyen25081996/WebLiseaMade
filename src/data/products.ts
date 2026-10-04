import type { Product } from "@/types";

/**
 * ⚠️ CATALOG MẪU (PLACEHOLDER) — ĐỌC KỸ TRƯỚC KHI DÙNG ⚠️
 *
 * Tên, giá, mô tả và thông số dưới đây là DỮ LIỆU MẪU do team dựng web tự soạn,
 * KHÔNG phải danh mục hàng thật của shop. TikTok chặn truy cập API sản phẩm
 * (yêu cầu chữ ký số), nên chưa lấy được catalog thật từ
 * https://www.tiktok.com/@liseahawaiisummer
 *
 * ĐỂ THAY BẰNG DỮ LIỆU THẬT: sửa/xoá các object trong mảng `PRODUCTS`.
 * Schema bắt buộc xem tại `src/types.ts` (interface Product).
 *  - `id`      : slug duy nhất, dùng làm URL /san-pham/<id>
 *  - `images`  : dán URL ảnh thật vào đây; để [] thì web tự vẽ placeholder
 *  - `price`   : số nguyên VND, KHÔNG dùng dấu chấm/phẩy
 *  - `variants`: mỗi size/màu là một object; `swatch` chỉ dùng cho màu
 *
 * Thông tin thương hiệu CÓ THẬT (hotline, kênh social) nằm ở `src/data/site.ts`.
 */

/** Cờ để UI hiển thị nhãn "catalog mẫu" cho khách biết. */
export const CATALOG_IS_PLACEHOLDER = true;

const SIZE_S = { id: "s", label: "S", kind: "size" as const, inStock: true };
const SIZE_M = { id: "m", label: "M", kind: "size" as const, inStock: true };
const SIZE_L = { id: "l", label: "L", kind: "size" as const, inStock: true };
const SIZE_XL = { id: "xl", label: "XL", kind: "size" as const, inStock: true };

export const PRODUCTS: Product[] = [
  /* ------------------------------- ÁO ------------------------------- */
  {
    id: "ao-so-mi-hoa-dua",
    name: "Áo sơ mi hoa dừa",
    price: 389000,
    compareAtPrice: 459000,
    category: "ao",
    images: [],
    shortDescription: "Sơ mi voan hoa dừa, form rộng, mặc hè cực mát.",
    description:
      "Chất voan mềm, nhẹ, thấm hút tốt, lên form rộng che khuyết điểm. Hoạ tiết hoa dừa tone xanh ngọc dễ phối với quần short jean hoặc chân váy trắng. Tay dài có thể xắn gọn khi cần năng động hơn.",
    materials: ["Voan polyester", "Không co rút", "Giặt máy nhẹ ở 30°C"],
    variants: [SIZE_S, SIZE_M, SIZE_L, { ...SIZE_XL, inStock: false }],
    rating: 4.8,
    reviewCount: 124,
    badges: ["Bán chạy"],
  },
  {
    id: "ao-thun-croptop-san-ho",
    name: "Áo thun croptop san hô",
    price: 235000,
    category: "ao",
    images: [],
    shortDescription: "Croptop cotton dày dặn, tone san hô nổi bật.",
    description:
      "Cotton 100% dày dặn, không xuyên vải. Form croptop ôm nhẹ, dài vừa phải nên không lo hở bụng quá nhiều. Đường may vai và cổ gia cố chắc chắn, giặt máy nhiều lần vẫn giữ form.",
    materials: ["Cotton 100%", "Co giãn nhẹ 2 chiều", "Giặt máy ở 30°C"],
    variants: [
      SIZE_S,
      SIZE_M,
      SIZE_L,
      { id: "san-ho", label: "San hô", kind: "color", swatch: "#ff7d6a", inStock: true },
      { id: "trang", label: "Trắng", kind: "color", swatch: "#fdfaf3", inStock: true },
      { id: "xanh-ngoc", label: "Xanh ngọc", kind: "color", swatch: "#3ecbc4", inStock: true },
    ],
    rating: 4.6,
    reviewCount: 87,
    badges: ["Mới về"],
  },
  {
    id: "ao-so-mi-linen-tay-ngan",
    name: "Áo sơ mi linen tay ngắn",
    price: 420000,
    compareAtPrice: 480000,
    category: "ao",
    images: [],
    shortDescription: "Linen tay ngắn, thoáng khí, hợp cả đi làm lẫn đi chơi.",
    description:
      "Chất linen pha cotton thoáng khí, thấm hút mồ hôi tốt — phù hợp thời tiết nóng ẩm. Cổ bản, tay ngắn, form suông nhẹ. Mặc được cả đi làm và đi biển, phối quần âu hay quần short đều ổn.",
    materials: ["Linen pha cotton 55/45", "Thoáng khí", "Ủi ở nhiệt độ vừa"],
    variants: [SIZE_S, SIZE_M, SIZE_L, SIZE_XL],
    rating: 4.7,
    reviewCount: 63,
    badges: [],
  },

  /* ---------------------------- VÁY & ĐẦM ---------------------------- */
  {
    id: "vay-maxi-hoa-anh-duong",
    name: "Váy maxi hoa anh đào",
    price: 559000,
    compareAtPrice: 690000,
    category: "vay-dam",
    images: [],
    shortDescription: "Đầm maxi dài, tùng xoè nhẹ, chuẩn đi biển.",
    description:
      "Đầm maxi dáng suông nhẹ, tùng váy xoè vừa phải giúp di chuyển thoải mái. Lưng có khoá kéo ẩn, có lớp lót trong nên không lo lộ. Phù hợp đi biển, chụp ảnh hoặc dạo phố mùa hè.",
    materials: ["Vải lụa mát", "Có lớp lót trong", "Giặt tay hoặc giặt máy nhẹ"],
    variants: [SIZE_S, SIZE_M, SIZE_L],
    rating: 4.9,
    reviewCount: 86,
    badges: ["Bán chạy", "Mới về"],
  },
  {
    id: "dam-suong-hoa-nhi-tiet",
    name: "Đầm suông hoạ tiết nhiệt đới",
    price: 475000,
    category: "vay-dam",
    images: [],
    shortDescription: "Đầm suông dài qua gối, hoạ tiết lá nhiệt đới.",
    description:
      "Dáng suông rộng rãi, che bụng tốt, mặc thoải mái cả ngày. Hoạ tiết lá nhiệt đới in sắc nét, màu bền sau nhiều lần giặt. Có túi hai bên hông — điểm cộng lớn cho ai thích tiện dụng.",
    materials: ["Vải đũi mềm", "Có túi hai bên", "Giặt máy nhẹ, phơi bóng râm"],
    variants: [SIZE_S, SIZE_M, SIZE_L, SIZE_XL],
    rating: 4.5,
    reviewCount: 52,
    badges: [],
  },
  {
    id: "vay-xoe-dang-yem",
    name: "Váy xoè dáng yếm",
    price: 445000,
    compareAtPrice: 520000,
    category: "vay-dam",
    images: [],
    shortDescription: "Váy yếm xoè, dây điều chỉnh được, trẻ trung.",
    description:
      "Dáng yếm hai dây bản nhỏ, có khoá điều chỉnh độ dài. Tùng váy xoè rộng tạo chuyển động đẹp khi chụp ảnh. Mặc cùng áo thun hoặc sơ mi mỏng bên trong đều hợp.",
    materials: ["Cotton pha", "Dây điều chỉnh được", "Giặt máy ở 30°C"],
    variants: [SIZE_S, SIZE_M, SIZE_L],
    rating: 4.7,
    reviewCount: 39,
    badges: ["Giá tốt"],
  },

  /* ----------------------------- SET ĐỒ ----------------------------- */
  {
    id: "set-do-linen-couple",
    name: "Set đồ linen couple",
    price: 720000,
    compareAtPrice: 850000,
    category: "set-do",
    images: [],
    shortDescription: "Set đôi linen mát, phối sẵn cho cả hai.",
    description:
      "Set gồm áo sơ mi linen và quần short đồng bộ. Chất linen thoáng khí, phù hợp thời tiết nóng. Có đủ size cho nam và nữ; đặt riêng từng phần vẫn được, chỉ cần ghi chú khi đặt hàng.",
    materials: ["Linen pha cotton", "Thoáng khí", "Ủi ở nhiệt độ vừa"],
    variants: [SIZE_S, SIZE_M, SIZE_L, SIZE_XL],
    rating: 4.7,
    reviewCount: 58,
    badges: ["Combo tiết kiệm"],
  },
  {
    id: "set-pyjama-dua-bien",
    name: "Set pyjama dừa biển",
    price: 385000,
    category: "set-do",
    images: [],
    shortDescription: "Set ngủ hai mảnh, mát, mặc nhà hay đi biển đều được.",
    description:
      "Set hai mảnh gồm áo cộc tay và quần dài lưng thun. Chất vải mát, nhẹ, nhanh khô. Nhiều khách mua mặc ở nhà rồi mang luôn đi du lịch vì quá tiện.",
    materials: ["Vải satin mát", "Lưng thun co giãn", "Giặt máy nhẹ"],
    variants: [
      SIZE_S,
      SIZE_M,
      SIZE_L,
      { id: "xanh-bien", label: "Xanh biển", kind: "color", swatch: "#178c89", inStock: true },
      { id: "hong-san-ho", label: "Hồng san hô", kind: "color", swatch: "#ffa89b", inStock: true },
    ],
    rating: 4.8,
    reviewCount: 71,
    badges: [],
  },
  {
    id: "set-the-thao-nang-dong",
    name: "Set thể thao năng động",
    price: 520000,
    compareAtPrice: 610000,
    category: "set-do",
    images: [],
    shortDescription: "Set áo tank + quần short, co giãn 4 chiều.",
    description:
      "Chất thun co giãn 4 chiều, thấm hút nhanh, phù hợp tập luyện hoặc đi dạo biển. Quần có lưng thun và dây rút, túi sau có khoá kéo giữ điện thoại an toàn.",
    materials: ["Thun co giãn 4 chiều", "Thấm hút nhanh", "Giặt máy ở 30°C"],
    variants: [SIZE_S, SIZE_M, SIZE_L, SIZE_XL],
    rating: 4.6,
    reviewCount: 45,
    badges: [],
  },

  /* ---------------------------- PHỤ KIỆN ---------------------------- */
  {
    id: "tui-coi-dan-cao-su",
    name: "Túi cói đan cao su",
    price: 275000,
    category: "phu-kien",
    images: [],
    shortDescription: "Túi cói đan tay, quai da, đựng vừa đồ đi biển.",
    description:
      "Túi cói đan thủ công, lót vải bên trong có khoá kéo. Quai da bản to chắc chắn. Sức chứa vừa đủ khăn tắm, kem chống nắng và một bình nước nhỏ.",
    materials: ["Cói tự nhiên", "Quai da PU", "Lót vải có khoá kéo"],
    variants: [
      { id: "tu-nhien", label: "Tự nhiên", kind: "color", swatch: "#dfb06a", inStock: true },
      { id: "nau-dam", label: "Nâu đậm", kind: "color", swatch: "#85512f", inStock: true },
    ],
    rating: 4.6,
    reviewCount: 41,
    badges: [],
  },
  {
    id: "non-rong-vanh-vai",
    name: "Nón rộng vành vải",
    price: 165000,
    compareAtPrice: 210000,
    category: "phu-kien",
    images: [],
    shortDescription: "Nón vành rộng che nắng tốt, gấp gọn mang theo được.",
    description:
      "Vành rộng che nắng cả mặt và vai. Có dây buộc cằm chống gió thổi bay. Chất vải mềm nên gấp gọn bỏ vali được, mang đi du lịch rất tiện.",
    materials: ["Vải canvas mềm", "Dây buộc cằm", "Gấp gọn được"],
    variants: [
      { id: "kem", label: "Kem", kind: "color", swatch: "#faf2e0", inStock: true },
      { id: "xanh-ngoc", label: "Xanh ngọc", kind: "color", swatch: "#74e2d9", inStock: true },
      { id: "den", label: "Đen", kind: "color", swatch: "#111827", inStock: false },
    ],
    rating: 4.4,
    reviewCount: 33,
    badges: ["Giá tốt"],
  },
  {
    id: "kinh-mat-phi-cong",
    name: "Kính mát gọng phi công",
    price: 195000,
    category: "phu-kien",
    images: [],
    shortDescription: "Gọng phi công, tròng chống UV, kèm hộp đựng.",
    description:
      "Tròng kính chống tia UV, gọng kim loại nhẹ đeo êm. Kèm hộp cứng và khăn lau. Dáng unisex, hợp cả nam và nữ.",
    materials: ["Gọng kim loại", "Tròng chống UV", "Kèm hộp cứng"],
    variants: [
      { id: "vang", label: "Vàng", kind: "color", swatch: "#d69848", inStock: true },
      { id: "bac", label: "Bạc", kind: "color", swatch: "#a9b1bd", inStock: true },
    ],
    rating: 4.5,
    reviewCount: 28,
    badges: [],
  },
];

/** Sản phẩm đang giảm giá — dùng cho section "Đang giảm giá" ở trang chủ. */
export function discountedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
}

/** Sản phẩm bán chạy — dùng cho section "Bán chạy" ở trang chủ. */
export function bestSellers(limit = 4): Product[] {
  return [...PRODUCTS]
    .sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount)
    .slice(0, limit);
}

/** Sản phẩm mới về — ưu tiên theo badge "Mới về", sau đó giá cao (đồ mới thường đắt hơn). */
export function newArrivals(limit = 4): Product[] {
  const flagged = PRODUCTS.filter((p) => p.badges.includes("Mới về"));
  const rest = PRODUCTS.filter((p) => !p.badges.includes("Mới về"));
  return [...flagged, ...rest].slice(0, limit);
}

/** Tra cứu nhanh theo id — dùng nhiều ở trang chi tiết và giỏ hàng. */
export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export default PRODUCTS;
