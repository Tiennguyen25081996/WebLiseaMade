import { describe, it, expect } from "vitest";
import { isValidPhone, isValidEmail, validateCheckout, hasErrors } from "./orders";
import { validateOrderPayload } from "./validation";
import type { CheckoutInfo } from "@/types";

describe("Validation Unit Tests (UX & Security)", () => {
  describe("Vietnamese Phone Numbers (isValidPhone)", () => {
    it("chấp nhận các đầu số hợp lệ của các nhà mạng VN", () => {
      // Viettel (086, 096, 097, 098, 032-039)
      expect(isValidPhone("0987654321")).toBe(true);
      expect(isValidPhone("0385898952")).toBe(true);
      expect(isValidPhone("0868123456")).toBe(true);
      expect(isValidPhone("0961234567")).toBe(true);

      // Vinaphone (088, 091, 094, 081-085)
      expect(isValidPhone("0912345678")).toBe(true);
      expect(isValidPhone("0888123456")).toBe(true);
      expect(isValidPhone("0834567890")).toBe(true);

      // Mobifone (089, 090, 093, 070-079)
      expect(isValidPhone("0903123456")).toBe(true);
      expect(isValidPhone("0799123456")).toBe(true);
      expect(isValidPhone("0898123456")).toBe(true);

      // Vietnamobile & Gmobile (092, 056, 058, 099, 059)
      expect(isValidPhone("0923456789")).toBe(true);
      expect(isValidPhone("0567123456")).toBe(true);
      expect(isValidPhone("0993123456")).toBe(true);

      // Định dạng 9 chữ số bỏ số 0 đầu
      expect(isValidPhone("987654321")).toBe(true);
      expect(isValidPhone("385898952")).toBe(true);

      // Định dạng có khoảng trắng hoặc dấu gạch nối (sau khi clean digits)
      expect(isValidPhone("098 765 4321")).toBe(true);
      expect(isValidPhone("098-765-4321")).toBe(true);
    });

    it("từ chối các số điện thoại không hợp lệ", () => {
      // Đầu số cố định hoặc không tồn tại (01, 02, 04, 06...)
      expect(isValidPhone("0243123456")).toBe(false);
      expect(isValidPhone("0123456789")).toBe(false);
      expect(isValidPhone("0412345678")).toBe(false);

      // Độ dài không đủ hoặc vượt quá
      expect(isValidPhone("098123456")).toBe(false); // 9 số có số 0 đầu
      expect(isValidPhone("09812345678")).toBe(false); // 11 số
      expect(isValidPhone("")).toBe(false);
      expect(isValidPhone("abcdefghij")).toBe(false);
    });
  });

  describe("XSS Prevention on Input Fields", () => {
    it("xử lý an toàn chuỗi script hoặc HTML payload không gây ném lỗi", () => {
      const maliciousInfo: CheckoutInfo = {
        fullName: "<script>alert('xss')</script>",
        phone: "0987654321",
        email: "test<script>@example.com",
        address: "<img src=x onerror=alert(1)> Số 10 Tràng Tiền, Hoàn Kiếm",
        province: "Hà Nội",
        district: "Hoàn Kiếm",
        note: "javascript:void(0)",
        paymentMethod: "cod",
      };

      // Validation phải chạy bình thường không crash
      const errors = validateCheckout(maliciousInfo);
      // Email có ký tự <script> không hợp lệ phải bị bắt lỗi
      expect(errors.email).toBeDefined();
      // Địa chỉ có chứa thẻ HTML <img...> phải bị chặn vì không hợp lệ
      expect(errors.address).toBeDefined();
    });

    it("chặn chuỗi email chứa injection payload", () => {
      expect(isValidEmail("admin' OR '1'='1")).toBe(false);
      expect(isValidEmail("<script>@evil.com")).toBe(false);
      expect(isValidEmail("user@evil.com<script>")).toBe(false);
      expect(isValidEmail("normal.user@gmail.com")).toBe(true);
    });
  });

  describe("Boundary Values & Constraints", () => {
    const validBase: CheckoutInfo = {
      fullName: "Nguyễn Văn A",
      phone: "0987654321",
      email: "vana@gmail.com",
      address: "Số 123 Đường Cầu Giấy, Phường Dịch Vọng",
      province: "Hà Nội",
      district: "Cầu Giấy",
      note: "",
      paymentMethod: "cod",
    };

    it("bắt lỗi fullName dưới 2 ký tự hoặc chỉ chứa khoảng trắng", () => {
      expect(validateCheckout({ ...validBase, fullName: "A" }).fullName).toBeDefined();
      expect(validateCheckout({ ...validBase, fullName: "   " }).fullName).toBeDefined();
      expect(validateCheckout({ ...validBase, fullName: "An" }).fullName).toBeUndefined();
    });

    it("bắt lỗi address dưới 10 ký tự hoặc chỉ khoảng trắng", () => {
      expect(validateCheckout({ ...validBase, address: "Số 1 ABC" }).address).toBeDefined();
      expect(validateCheckout({ ...validBase, address: "          " }).address).toBeDefined();
      expect(validateCheckout({ ...validBase, address: "Số 10 Tràng Tiền HN" }).address).toBeUndefined();
    });

    it("bắt lỗi province và district để trống", () => {
      expect(validateCheckout({ ...validBase, province: "" }).province).toBeDefined();
      expect(validateCheckout({ ...validBase, province: "   " }).province).toBeDefined();
      expect(validateCheckout({ ...validBase, district: "" }).district).toBeDefined();
      expect(validateCheckout({ ...validBase, district: "   " }).district).toBeDefined();
    });

    it("hasErrors nhận diện đúng khi có hoặc không có lỗi", () => {
      expect(hasErrors(validateCheckout(validBase))).toBe(false);
      expect(hasErrors(validateCheckout({ ...validBase, fullName: "" }))).toBe(true);
    });
  });

  describe("Order Payload & Anti-Tampering (Backend Security)", () => {
    it("chấp nhận payload hợp lệ và trả về dữ liệu đã sanitized", () => {
      const validPayload = {
        code: "LM-ABC123",
        customerName: "Nguyễn Văn B",
        phone: "0901234567",
        email: "vanb@example.com",
        address: "Số 45 Lê Lợi, Phường Bến Nghé, Quận 1",
        province: "TP Hồ Chí Minh",
        district: "Quận 1",
        note: "Giao giờ hành chính",
        paymentMethod: "cod",
        shippingFee: 30000,
        total: 419000,
        items: [
          {
            productId: "p1",
            variantId: "v1",
            productName: "Áo sơ mi hoa dừa",
            variantLabel: "M",
            price: 389000,
            quantity: 1,
            lineTotal: 389000,
          },
        ],
      };

      const res = validateOrderPayload(validPayload);
      expect(res.valid).toBe(true);
      expect(res.sanitized?.customerName).toBe("Nguyễn Văn B");
      expect(res.sanitized?.total).toBe(419000);
    });

    it("từ chối khi client giả mạo tổng tiền không khớp", () => {
      const tampered = {
        code: "LM-ABC123",
        customerName: "Nguyễn Văn B",
        phone: "0901234567",
        address: "Số 45 Lê Lợi, Phường Bến Nghé, Quận 1",
        province: "TP Hồ Chí Minh",
        district: "Quận 1",
        paymentMethod: "cod",
        shippingFee: 30000,
        total: 1000, // Client cố tình gửi số tiền rẻ
        items: [
          {
            productId: "p1",
            variantId: "v1",
            price: 389000,
            quantity: 1,
            lineTotal: 389000,
          },
        ],
      };

      const res = validateOrderPayload(tampered);
      expect(res.valid).toBe(false);
      expect(res.errors.total).toBeDefined();
    });

    it("chặn số lượng âm hoặc số thập phân", () => {
      const invalidQty = {
        code: "LM-ABC123",
        customerName: "Nguyễn Văn B",
        phone: "0901234567",
        address: "Số 45 Lê Lợi, Phường Bến Nghé, Quận 1",
        province: "TP Hồ Chí Minh",
        district: "Quận 1",
        paymentMethod: "cod",
        items: [
          {
            productId: "p1",
            variantId: "v1",
            price: 389000,
            quantity: -5,
            lineTotal: -1945000,
          },
        ],
      };

      const res = validateOrderPayload(invalidQty);
      expect(res.valid).toBe(false);
    });
  });
});
