import type { Category, Product, HomePageSettings } from "@/types";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { useEffect, useState, useMemo } from "react";
import { normalizeGoogleDriveUrl } from "@/lib/media-api";
import {
  type ChatbotConfig,
  getChatbotConfig,
  saveChatbotConfig,
  resetChatbotConfig,
} from "@/lib/chatbot-service";

export interface DiscountEvent {
  id: string;
  code: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
}

const STORAGE_KEY_PRODUCTS = "liseamade.admin.products.v1";
const STORAGE_KEY_CATEGORIES = "liseamade.admin.categories.v1";
const STORAGE_KEY_DISCOUNTS = "liseamade.admin.discounts.v1";
export const STORAGE_KEY_HOMEPAGE = "liseamade.admin.homepage.v1";
const ADMIN_UPDATE_EVENT = "liseamade:admin-update";

export const DEFAULT_HOMEPAGE_SETTINGS: HomePageSettings = {
  heroEyebrow: "Thời trang & phụ kiện Hawaii Summer",
  heroTitle: "LiseaMade",
  heroDescription: "Voan, linen, cotton — nhẹ mát cho cả tuần nắng.",
  heroCtaText: "Khám phá bộ sưu tập →",
  heroCtaLink: "/san-pham",
  heroImage: "/figma-images/hero.png",

  featuredEyebrow: "Nổi bật mùa hè",
  featuredTitle: "Sản phẩm bán chạy",
  featuredCtaText: "Xem tất cả sản phẩm →",

  lifestyleEyebrow: "Phong cách sống Hawaii",
  lifestyleTitle: "Mặc hè như đi biển",
  lifestyleDescription: "Voan, linen, cotton — nhẹ, mát, phối sẵn cho cả tuần nắng.",
  lifestyleItems: [
    { id: "life-1", src: "/figma-images/lifestyle-1.png", caption: "Đi biển · Voan hoa" },
    { id: "life-2", src: "/figma-images/lifestyle-2.png", caption: "Dạo phố · Linen mát" },
    { id: "life-3", src: "/figma-images/lifestyle-3.png", caption: "Cafe sáng · Cotton nhẹ" },
    { id: "life-4", src: "/figma-images/lifestyle-4.png", caption: "Picnic · Summer 2026" },
  ],

  lookbookEyebrow: "Lookbook mùa hè",
  lookbookTitle: "Phối đồ theo khoảnh khắc",
  lookbookItems: [
    { id: "look-1", src: "/figma-images/lookbook-1.png", caption: "Nắng sớm · Sơ mi voan" },
    { id: "look-2", src: "/figma-images/lookbook-2.png", caption: "Chiều biển · Maxi bay" },
    { id: "look-3", src: "/figma-images/lookbook-3.png", caption: "Phố hè · Linen đôi" },
    { id: "look-4", src: "/figma-images/lookbook-4.png", caption: "Đêm tiệc · Croptop" },
  ],

  brandStoryEyebrow: "Câu chuyện thương hiệu",
  brandStoryTitle: "May cho mùa hè Việt",
  brandStoryQuote: "“Mỗi đường may đều hướng về biển — nhẹ, mát, tự do.”",
  brandStoryCtaText: "Câu chuyện của chúng tôi →",
  brandStoryCtaLink: "/gioi-thieu",
  brandStoryImage: "/figma-images/brand-story.png",
  brandStoryContact: "@liseamade · Hotline 0987 654 321",

  tiktokEyebrow: "@liseamade trên TikTok",
  tiktokFollowersText: "32K followers",
  tiktokLikesText: "480K likes",
  tiktokCtaText: "Follow @liseamade →",
  tiktokUrl: "https://tiktok.com/@liseamade",
};

export const INITIAL_DISCOUNT_EVENTS: DiscountEvent[] = [
  {
    id: "disc-summer",
    code: "SUMMER2026",
    name: "Lễ hội mùa hè Hawaii",
    type: "percentage",
    value: 15,
    minOrderValue: 300000,
    startDate: "2026-05-01",
    endDate: "2026-08-31",
    isActive: true,
    description: "Giảm 15% cho mọi đơn hàng từ 300.000₫ phong cách nhiệt đới.",
  },
  {
    id: "disc-welcome",
    code: "WELCOME50K",
    name: "Ưu đãi thành viên mới",
    type: "fixed",
    value: 50000,
    minOrderValue: 250000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    isActive: true,
    description: "Giảm trực tiếp 50.000₫ cho đơn hàng đầu tiên từ 250.000₫.",
  },
  {
    id: "disc-flash",
    code: "FLASH10",
    name: "Flash Sale Cuối Tuần",
    type: "percentage",
    value: 10,
    minOrderValue: 150000,
    startDate: "2026-10-10",
    endDate: "2026-10-15",
    isActive: false,
    description: "Giảm 10% chớp nhoáng cho các sản phẩm váy đầm và set đồ.",
  },
];

function notifySubscribers() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ADMIN_UPDATE_EVENT));
  }
}

/* =====================================================================
 * 1. QUẢN LÝ SẢN PHẨM (PRODUCTS)
 * ===================================================================== */

export function getAdminProducts(): Product[] {
  if (typeof window === "undefined") return [...PRODUCTS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!raw) return [...PRODUCTS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...PRODUCTS];
  } catch {
    return [...PRODUCTS];
  }
}

export function saveAdminProduct(product: Product): Product {
  const current = getAdminProducts();
  const index = current.findIndex((p) => p.id === product.id);

  let updated: Product[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = product;
  } else {
    updated = [product, ...current];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
  }
  notifySubscribers();
  return product;
}

export function deleteAdminProduct(productId: string): boolean {
  const current = getAdminProducts();
  const next = current.filter((p) => p.id !== productId);
  if (next.length === current.length) return false;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
  }
  notifySubscribers();
  return true;
}

/**
 * Lấy danh sách sản phẩm đang sử dụng URL ảnh này.
 */
export function getProductsUsingImage(imageUrl: string): Product[] {
  const products = getAdminProducts();
  const normalizedTarget = normalizeGoogleDriveUrl(imageUrl);
  return products.filter((p) =>
    p.images.some(
      (img) => normalizeGoogleDriveUrl(img) === normalizedTarget || img === imageUrl
    )
  );
}

/**
 * Xóa một URL ảnh khỏi tất cả sản phẩm đang dùng nó (đồng bộ khi xóa ảnh trong Media Hub).
 */
export function removeImageUrlFromProducts(imageUrl: string): {
  affectedCount: number;
  affectedProducts: string[];
} {
  const products = getAdminProducts();
  const normalizedTarget = normalizeGoogleDriveUrl(imageUrl);
  const affectedProducts: string[] = [];

  const updated = products.map((p) => {
    const hasImage = p.images.some(
      (img) => normalizeGoogleDriveUrl(img) === normalizedTarget || img === imageUrl
    );
    if (!hasImage) return p;

    affectedProducts.push(p.name);
    const remaining = p.images.filter(
      (img) => normalizeGoogleDriveUrl(img) !== normalizedTarget && img !== imageUrl
    );
    return {
      ...p,
      images: remaining.length > 0 ? remaining : ["/figma-images/catalog-1.png"],
    };
  });

  if (affectedProducts.length > 0) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updated));
    }
    notifySubscribers();
  }

  return { affectedCount: affectedProducts.length, affectedProducts };
}

/* =====================================================================
 * 2. QUẢN LÝ DANH MỤC (CATEGORIES)
 * ===================================================================== */

export function getAdminCategories(): Category[] {
  if (typeof window === "undefined") return [...CATEGORIES];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) return [...CATEGORIES];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...CATEGORIES];
  } catch {
    return [...CATEGORIES];
  }
}

export function saveAdminCategory(category: Category): Category {
  const current = getAdminCategories();
  const index = current.findIndex((c) => c.id === category.id);

  let updated: Category[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = category;
  } else {
    updated = [...current, category];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
  }
  notifySubscribers();
  return category;
}

export function deleteAdminCategory(categoryId: string): { success: boolean; message?: string } {
  // Kiểm tra nếu đang có sản phẩm thuộc danh mục này
  const products = getAdminProducts();
  const inUse = products.some((p) => p.category === categoryId);
  if (inUse) {
    return {
      success: false,
      message: `Không thể xóa vì còn sản phẩm thuộc nhóm này. Hãy đổi nhóm sản phẩm trước khi xóa.`,
    };
  }

  const current = getAdminCategories();
  const next = current.filter((c) => c.id !== categoryId);
  if (next.length === current.length) {
    return { success: false, message: "Không tìm thấy danh mục để xóa." };
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(next));
  }
  notifySubscribers();
  return { success: true };
}

/* =====================================================================
 * 3. QUẢN LÝ EVENT GIẢM GIÁ (DISCOUNT EVENTS)
 * ===================================================================== */

export function getAdminDiscountEvents(): DiscountEvent[] {
  if (typeof window === "undefined") return [...INITIAL_DISCOUNT_EVENTS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISCOUNTS);
    if (!raw) return [...INITIAL_DISCOUNT_EVENTS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...INITIAL_DISCOUNT_EVENTS];
  } catch {
    return [...INITIAL_DISCOUNT_EVENTS];
  }
}

export function saveAdminDiscountEvent(event: DiscountEvent): DiscountEvent {
  const normalized: DiscountEvent = {
    ...event,
    code: event.code.trim().toUpperCase(),
  };

  const current = getAdminDiscountEvents();
  const index = current.findIndex((e) => e.id === normalized.id);

  let updated: DiscountEvent[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = normalized;
  } else {
    updated = [normalized, ...current];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_DISCOUNTS, JSON.stringify(updated));
  }
  notifySubscribers();
  return normalized;
}

export function toggleDiscountEventStatus(eventId: string): boolean {
  const current = getAdminDiscountEvents();
  const index = current.findIndex((e) => e.id === eventId);
  if (index === -1) return false;

  const updated = [...current];
  updated[index] = { ...updated[index], isActive: !updated[index].isActive };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_DISCOUNTS, JSON.stringify(updated));
  }
  notifySubscribers();
  return true;
}

export function deleteAdminDiscountEvent(eventId: string): boolean {
  const current = getAdminDiscountEvents();
  const next = current.filter((e) => e.id !== eventId);
  if (next.length === current.length) return false;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_DISCOUNTS, JSON.stringify(next));
  }
  notifySubscribers();
  return true;
}

/* =====================================================================
 * 4. CÀI ĐẶT TRANG CHỦ (HOMEPAGE SETTINGS)
 * ===================================================================== */

export function getAdminHomePageSettings(): HomePageSettings {
  if (typeof window === "undefined") return { ...DEFAULT_HOMEPAGE_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HOMEPAGE);
    if (!raw) return { ...DEFAULT_HOMEPAGE_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_HOMEPAGE_SETTINGS,
      ...parsed,
      lifestyleItems: Array.isArray(parsed.lifestyleItems)
        ? parsed.lifestyleItems
        : DEFAULT_HOMEPAGE_SETTINGS.lifestyleItems,
      lookbookItems: Array.isArray(parsed.lookbookItems)
        ? parsed.lookbookItems
        : DEFAULT_HOMEPAGE_SETTINGS.lookbookItems,
    };
  } catch {
    return { ...DEFAULT_HOMEPAGE_SETTINGS };
  }
}

export function saveAdminHomePageSettings(settings: HomePageSettings): HomePageSettings {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_HOMEPAGE, JSON.stringify(settings));
  }
  notifySubscribers();
  return settings;
}

export function resetAdminHomePageSettings(): HomePageSettings {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_HOMEPAGE);
  }
  notifySubscribers();
  return { ...DEFAULT_HOMEPAGE_SETTINGS };
}

/* =====================================================================
 * 5. RESET DỮ LIỆU VỀ MẶC ĐỊNH (RESET TO DEFAULTS)
 * ===================================================================== */

export function resetAdminData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_DISCOUNTS);
    localStorage.removeItem(STORAGE_KEY_HOMEPAGE);
    resetChatbotConfig();
  }
  notifySubscribers();
}

/* =====================================================================
 * 6. REACT HOOK: useAdminStore()
 * ===================================================================== */

export function useAdminStore() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener(ADMIN_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(ADMIN_UPDATE_EVENT, handleUpdate);
  }, []);

  const products = useMemo(() => getAdminProducts(), [version]);
  const categories = useMemo(() => getAdminCategories(), [version]);
  const discounts = useMemo(() => getAdminDiscountEvents(), [version]);
  const homeSettings = useMemo(() => getAdminHomePageSettings(), [version]);
  const chatbotConfig = useMemo(() => getChatbotConfig(), [version]);

  return {
    products,
    categories,
    discounts,
    homeSettings,
    chatbotConfig,
    saveProduct: saveAdminProduct,
    deleteProduct: deleteAdminProduct,
    saveCategory: saveAdminCategory,
    deleteCategory: deleteAdminCategory,
    saveDiscount: saveAdminDiscountEvent,
    toggleDiscount: toggleDiscountEventStatus,
    deleteDiscount: deleteAdminDiscountEvent,
    saveHomeSettings: saveAdminHomePageSettings,
    resetHomeSettings: resetAdminHomePageSettings,
    saveChatbotConfig: (cfg: ChatbotConfig) => {
      saveChatbotConfig(cfg);
      notifySubscribers();
      return cfg;
    },
    resetChatbotConfig: () => {
      resetChatbotConfig();
      notifySubscribers();
    },
    resetToDefaults: resetAdminData,
    getProductsUsingImage,
    removeImageUrlFromProducts,
    version,
  };
}
