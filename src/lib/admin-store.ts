import type { Category, Product } from "@/types";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { useEffect, useState } from "react";

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
const ADMIN_UPDATE_EVENT = "liseamade:admin-update";

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
 * 4. RESET DỮ LIỆU VỀ MẶC ĐỊNH (RESET TO DEFAULTS)
 * ===================================================================== */

export function resetAdminData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_DISCOUNTS);
  }
  notifySubscribers();
}

/* =====================================================================
 * 5. REACT HOOK: useAdminStore()
 * ===================================================================== */

export function useAdminStore() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener(ADMIN_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(ADMIN_UPDATE_EVENT, handleUpdate);
  }, []);

  return {
    products: getAdminProducts(),
    categories: getAdminCategories(),
    discounts: getAdminDiscountEvents(),
    saveProduct: saveAdminProduct,
    deleteProduct: deleteAdminProduct,
    saveCategory: saveAdminCategory,
    deleteCategory: deleteAdminCategory,
    saveDiscount: saveAdminDiscountEvent,
    toggleDiscount: toggleDiscountEventStatus,
    deleteDiscount: deleteAdminDiscountEvent,
    resetToDefaults: resetAdminData,
    version,
  };
}
