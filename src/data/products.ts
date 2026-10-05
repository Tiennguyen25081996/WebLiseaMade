import type { Product, ProductVariant } from "@/types";

/**
 * ⚠️ CATALOG MẪU (PLACEHOLDER) — dữ liệu mẫu do team tự soạn,
 * KHÔNG phải danh mục hàng thật của shop.
 * Schema bắt buộc xem tại `src/types.ts` (interface Product).
 *  - `id`      : slug duy nhất, dùng làm URL /san-pham/<id>
 *  - `images`  : dán URL ảnh thật vào đây; để [] thì web tự vẽ placeholder
 *  - `price`   : số nguyên VND, KHÔNG dùng dấu chấm/phẩy
 *  - `variants`: mỗi size/màu là một object; `swatch` chỉ dùng cho màu
 *
 * Nhóm hàng khai báo tập trung tại `src/data/categories.ts`.
 * Thông tin thương hiệu CÓ THẬT (hotline, kênh social) nằm ở `src/data/site.ts`.
 */

/** Cờ để UI hiển thị nhãn "catalog mẫu" cho khách biết. */
export const CATALOG_IS_PLACEHOLDER = true;

/** Helper rút gọn cho variant kiểu size. */
const size = (id: string, label: string, inStock = true): ProductVariant => ({
  id,
  label,
  kind: "size",
  inStock,
});

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Áo sơ mi hoa dừa",
    price: 389000,
    compareAtPrice: 459000,
    category: "ao",
    images: [],
    shortDescription: "Áo sơ mi hoa dừa với họa tiết tinh tế, phù hợp cho kỳ nghỉ hè.",
    description:
      "Chất vải mềm mại, thoáng mát, họa tiết hoa dừa tone nhiệt đới dễ phối với quần short hoặc chân váy. Form rộng thoải mái, phù hợp đi biển hay dạo phố.",
    materials: ["Polyester pha", "Giặt máy nhẹ ở 30°C", "Không tẩy trắng"],
    variants: [size("v1", "M"), size("v2", "L")],
    rating: 4.8,
    reviewCount: 124,
    badges: ["Bán chạy"],
  },
  {
    id: "p2",
    name: "Váy maxi hoa anh đào",
    price: 1118000,
    compareAtPrice: 1300000,
    category: "vay-dam",
    images: [],
    shortDescription: "Váy maxi hoa anh đào nhẹ nhàng và phóng khoáng.",
    description:
      "Váy maxi dáng dài thướt tha với họa tiết hoa anh đào, chất vải bay bổng nhẹ nhàng. Cạp thun co giãn thoải mái, phù hợp đi biển và chụp ảnh.",
    materials: ["Voan chiffon", "Lót trong thoáng khí", "Giặt tay hoặc giặt nhẹ"],
    variants: [size("v3", "S"), size("v4", "M")],
    rating: 4.5,
    reviewCount: 80,
    badges: ["Mới"],
  },
  {
    id: "p3",
    name: "Set đồ linen couple",
    price: 720000,
    compareAtPrice: 850000,
    category: "set-do",
    images: [],
    shortDescription: "Set đồ linen couple cho buổi hẹn hò lãng mạn.",
    description:
      "Set linen hai mảnh phong cách tối giản, chất vải linen thoáng mát, mặc couple hoặc mặc riêng đều đẹp. Nhẹ, ít nhăn, dễ phối đồ.",
    materials: ["Linen pha cotton", "Giặt máy nhẹ", "Không sấy nóng"],
    variants: [size("v5", "M")],
    rating: 4.9,
    reviewCount: 45,
    badges: ["Hàng hot"],
  },
  {
    id: "p4",
    name: "Túi cói đan cao su",
    price: 275000,
    compareAtPrice: 320000,
    category: "phu-kien",
    images: [],
    shortDescription: "Túi cói đan thủ công tỉ mỉ.",
    description:
      "Túi cói đan thủ công chắc chắn, quai xách tiện dụng, đủ rộng để mang theo đồ đi biển. Tạo điểm nhấn phóng khoáng cho mọi set đồ.",
    materials: ["Cói đan thủ công", "Lót vải trong", "Lau khô khi bị ướt"],
    variants: [size("v6", "One-size")],
    rating: 4.7,
    reviewCount: 30,
    badges: [],
  },
  {
    id: "p5",
    name: "Đầm suông nhiệt đới",
    price: 475000,
    compareAtPrice: 550000,
    category: "vay-dam",
    images: [],
    shortDescription: "Đầm suông thời trang, thoải mái.",
    description:
      "Đầm suông dáng dài họa tiết nhiệt đới, form rộng che khuyết điểm, chất vải nhẹ thoáng mát. Phù hợp đi biển, đi chơi hay dạo phố mùa hè.",
    materials: ["Cotton pha viscose", "Giặt máy nhẹ ở 30°C", "Để khô tự nhiên"],
    variants: [size("v7", "S"), size("v8", "M")],
    rating: 4.6,
    reviewCount: 25,
    badges: ["Bán chạy"],
  },
  {
    id: "p6",
    name: "Váy xòe dáng yếm",
    price: 445000,
    compareAtPrice: 520000,
    category: "vay-dam",
    images: [],
    shortDescription: "Váy xòe dáng yếm trẻ trung, hiện đại.",
    description:
      "Váy xòe dáng yếm khoe eo nhẹ nhàng, dáng váy bồng bềnh trẻ trung. Dễ phối với áo croptop hoặc áo thun đơn giản.",
    materials: ["Cotton pha", "Giặt máy nhẹ", "Không tẩy trắng"],
    variants: [size("v9", "M")],
    rating: 4.8,
    reviewCount: 18,
    badges: [],
  },
  {
    id: "p7",
    name: "Nón rộng vành vải",
    price: 165000,
    compareAtPrice: 190000,
    category: "phu-kien",
    images: [],
    shortDescription: "Nón rộng vành vải nhẹ, mát.",
    description:
      "Nón rộng vành vải mềm, nhẹ, che nắng hiệu quả và dễ gấp gọn mang theo du lịch. Phù hợp đi biển và dạo phố.",
    materials: ["Vải cotton", "Co giãn nhẹ", "Giặt tay"],
    variants: [size("v10", "One-size")],
    rating: 4.5,
    reviewCount: 15,
    badges: [],
  },
  {
    id: "p8",
    name: "Set pyjama dừa biển",
    price: 385000,
    compareAtPrice: 450000,
    category: "set-do",
    images: [],
    shortDescription: "Set pyjama dừa biển thoải mái cho kỳ nghỉ.",
    description:
      "Set pyjama họa tiết dừa biển, chất vải mềm mịn thoải mái khi ngủ hoặc mặc nhà. Phong cách nhiệt đới vui mắt, phù hợp kỳ nghỉ.",
    materials: ["Cotton 100%", "Giặt máy nhẹ", "Không sấy nóng"],
    variants: [size("v11", "M")],
    rating: 4.7,
    reviewCount: 22,
    badges: ["Mới"],
  },
  {
    id: "p9",
    name: "Set thể thao năng động",
    price: 520000,
    compareAtPrice: 600000,
    category: "set-do",
    images: [],
    shortDescription: "Set thể thao năng động, thoải mái.",
    description:
      "Set thể thao hai mảnh co giãn tốt, thấm hút mồ hôi, phù hợp tập gym, yoga hay chạy bộ. Form ôm gọn nhưng vẫn thoải mái.",
    materials: ["Spandex pha polyester", "Thấm hút mồ hôi", "Giặt máy nhẹ"],
    variants: [size("v12", "L")],
    rating: 4.6,
    reviewCount: 12,
    badges: [],
  },
  {
    id: "p10",
    name: "Túi cói đan cao su",
    price: 275000,
    compareAtPrice: 320000,
    category: "phu-kien",
    images: [],
    shortDescription: "Túi cói đan thủ công tỉ mỉ.",
    description:
      "Túi cói đan thủ công chắc chắn, quai xách tiện dụng, đủ rộng để mang theo đồ đi biển. Tạo điểm nhấn phóng khoáng cho mọi set đồ.",
    materials: ["Cói đan thủ công", "Lót vải trong", "Lau khô khi bị ướt"],
    variants: [size("v13", "One-size")],
    rating: 4.7,
    reviewCount: 30,
    badges: [],
  },
  {
    id: "p11",
    name: "Nón rộng vành vải",
    price: 165000,
    compareAtPrice: 190000,
    category: "phu-kien",
    images: [],
    shortDescription: "Nón rộng vành vải nhẹ, mát.",
    description:
      "Nón rộng vành vải mềm, nhẹ, che nắng hiệu quả và dễ gấp gọn mang theo du lịch. Phù hợp đi biển và dạo phố.",
    materials: ["Vải cotton", "Co giãn nhẹ", "Giặt tay"],
    variants: [size("v14", "One-size")],
    rating: 4.5,
    reviewCount: 15,
    badges: [],
  },
  {
    id: "p12",
    name: "Kính mát gọng phi công",
    price: 195000,
    compareAtPrice: 220000,
    category: "phu-kien",
    images: [],
    shortDescription: "Kính mát gọng phi công thời trang.",
    description:
      "Kính mát gọng phi công kinh điển, tròng chống UV400, form unisex phù hợp mọi khuôn mặt. Bảo vệ mắt và tăng điểm nhấn cho set đồ.",
    materials: ["Nhựa TR90", "Tròng chống UV400", "Kèm khăn lau"],
    variants: [size("v15", "One-size")],
    rating: 4.8,
    reviewCount: 10,
    badges: [],
  },
];

export default PRODUCTS;
