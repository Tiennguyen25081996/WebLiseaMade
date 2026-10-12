import { describe, it, expect, beforeEach } from "vitest";
import {
  getAdminProducts,
  saveAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  saveAdminCategory,
  deleteAdminCategory,
  getAdminDiscountEvents,
  saveAdminDiscountEvent,
  toggleDiscountEventStatus,
  deleteAdminDiscountEvent,
  resetAdminData,
} from "./admin-store";
import type { DiscountEvent } from "./admin-store";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";
import type { Category, Product } from "@/types";

describe("admin-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Products CRUD", () => {
    it("trả về danh sách mặc định khi chưa có dữ liệu lưu", () => {
      const prods = getAdminProducts();
      expect(prods.length).toBe(PRODUCTS.length);
      expect(prods[0].id).toBe(PRODUCTS[0].id);
    });

    it("thêm mới sản phẩm thành công", () => {
      const newProduct: Product = {
        id: "p-test-new",
        name: "Áo Polo Hawaii Test",
        price: 299000,
        category: "ao",
        images: ["/test.jpg"],
        shortDescription: "Mô tả ngắn test",
        description: "Mô tả chi tiết test",
        materials: ["Cotton 100%"],
        variants: [{ id: "v1", label: "M", kind: "size", inStock: true }],
        rating: 5,
        reviewCount: 1,
        badges: ["Mới"],
      };

      saveAdminProduct(newProduct);
      const prods = getAdminProducts();
      expect(prods.length).toBe(PRODUCTS.length + 1);
      expect(prods[0].id).toBe("p-test-new");
      expect(prods[0].name).toBe("Áo Polo Hawaii Test");
    });

    it("cập nhật thông tin sản phẩm đã có", () => {
      const p1 = getAdminProducts()[0];
      const updated: Product = {
        ...p1,
        name: "Áo sơ mi hoa dừa (Bản đặc biệt)",
        price: 499000,
      };

      saveAdminProduct(updated);
      const found = getAdminProducts().find((p) => p.id === p1.id);
      expect(found?.name).toBe("Áo sơ mi hoa dừa (Bản đặc biệt)");
      expect(found?.price).toBe(499000);
    });

    it("xóa sản phẩm theo id", () => {
      const p1 = getAdminProducts()[0];
      const res = deleteAdminProduct(p1.id);
      expect(res).toBe(true);

      const prods = getAdminProducts();
      expect(prods.find((p) => p.id === p1.id)).toBeUndefined();
    });
  });

  describe("Categories CRUD", () => {
    it("trả về danh mục mặc định ban đầu", () => {
      const cats = getAdminCategories();
      expect(cats.length).toBe(CATEGORIES.length);
    });

    it("thêm mới danh mục", () => {
      const newCat: Category = {
        id: "giay-dep" as any,
        name: "Giày & Dép",
        description: "Dép đi biển cao cấp",
      };

      saveAdminCategory(newCat);
      const cats = getAdminCategories();
      expect(cats.some((c) => (c.id as string) === "giay-dep")).toBe(true);
    });

    it("chặn xóa danh mục khi còn sản phẩm thuộc danh mục đó", () => {
      const res = deleteAdminCategory("ao");
      expect(res.success).toBe(false);
      expect(res.message).toContain("Không thể xóa");
    });

    it("cho phép xóa danh mục khi không có sản phẩm nào", () => {
      const newCat: Category = {
        id: "do-boi" as any,
        name: "Đồ bơi",
        description: "Đồ bơi mùa hè",
      };
      saveAdminCategory(newCat);

      const res = deleteAdminCategory("do-boi");
      expect(res.success).toBe(true);
      const cats = getAdminCategories();
      expect(cats.some((c) => (c.id as string) === "do-boi")).toBe(false);
    });
  });

  describe("Discount Events CRUD", () => {
    it("trả về danh sách sự kiện giảm giá ban đầu", () => {
      const events = getAdminDiscountEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].code).toBe("SUMMER2026");
    });

    it("thêm mới mã sự kiện và chuẩn hóa viết hoa", () => {
      const newEvent: DiscountEvent = {
        id: "disc-new-test",
        code: "testsale20",
        name: "Giảm giá 20%",
        type: "percentage",
        value: 20,
        minOrderValue: 200000,
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        isActive: true,
      };

      saveAdminDiscountEvent(newEvent);
      const events = getAdminDiscountEvents();
      const found = events.find((e) => e.id === "disc-new-test");
      expect(found).toBeDefined();
      expect(found?.code).toBe("TESTSALE20");
    });

    it("bật/tắt trạng thái sự kiện", () => {
      const event = getAdminDiscountEvents()[0];
      const initialActive = event.isActive;

      toggleDiscountEventStatus(event.id);
      const after = getAdminDiscountEvents().find((e) => e.id === event.id);
      expect(after?.isActive).toBe(!initialActive);
    });

    it("xóa sự kiện giảm giá", () => {
      const event = getAdminDiscountEvents()[0];
      const res = deleteAdminDiscountEvent(event.id);
      expect(res).toBe(true);
      expect(getAdminDiscountEvents().find((e) => e.id === event.id)).toBeUndefined();
    });

    it("khôi phục dữ liệu gốc resetAdminData", () => {
      deleteAdminProduct(PRODUCTS[0].id);
      expect(getAdminProducts().length).toBe(PRODUCTS.length - 1);

      resetAdminData();
      expect(getAdminProducts().length).toBe(PRODUCTS.length);
    });
  });
});
