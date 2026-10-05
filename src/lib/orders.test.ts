import { describe, expect, it } from "vitest";
import {
  ORDERS_STORAGE_KEY,
  findOrderByCode,
  generateOrderCode,
  hasErrors,
  isValidEmail,
  isValidPhone,
  readOrders,
  saveOrder,
  validateCheckout,
} from "./orders";
import type {
  CheckoutInfo,
  PlacedOrder,
  Product,
  ProductVariant,
} from "@/types";

/** Storage gia test: localStorage khong co trong node, dung object gia thay thay. */
function makeStorage(initial: Record<string, string> = {}): Storage {
  const entries: Record<string, string> = { ...initial };
  const storage = {
    getItem: (key: string) => entries[key] ?? null,
    setItem: (key: string, value: string) => {
      entries[key] = value;
      return value.length;
    },
    removeItem: (key: string) => {
      delete entries[key];
    },
    clear: () => {
      for (const key of Object.keys(entries)) delete entries[key];
    },
  };
  return storage as unknown as Storage;
}

const PRODUCT: Product = {
  id: "p1",
  name: "San pham test",
  price: 320_000,
  category: "ao",
  images: [],
  shortDescription: "tom",
  description: "tom tom",
  materials: [],
  variants: [{ id: "p1-m", label: "M", kind: "size", inStock: true }],
  rating: 4,
  reviewCount: 3,
  badges: [],
};

const VARIANT: ProductVariant = PRODUCT.variants[0];

const VALID_ORDER: PlacedOrder = {
  code: "LM-ABCDEF",
  createdAt: "2026-10-04T14:00:00+07:00",
  lines: [
    {
      productId: "p1",
      variantId: "p1-m",
      quantity: 2,
      product: PRODUCT,
      variant: VARIANT,
      unitPrice: 320_000,
      lineTotal: 640_000,
    },
  ],
  totals: { subtotal: 640_000, shippingFee: 0, discount: 0, total: 640_000 },
  info: {
    fullName: "Nguyen Test",
    phone: "0385898952",
    email: "",
    address: "123 Duong Test, Ha Noi",
    province: "Ha Noi",
    district: "Cau Giay",
    note: "",
    paymentMethod: "cod",
  },
};

describe("generateOrderCode", () => {
  it("format LM- plus 6 character alphabet safe", () => {
    expect(generateOrderCode()).toMatch(/^LM-[A-HJ-NP-Z2-9]{6}$/);
  });

  it("200 code unique", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 200; i += 1) codes.add(generateOrderCode());
    expect(codes.size).toBe(200);
  });
});

describe("isValidPhone", () => {
  it("so so true", () => {
    expect(isValidPhone("0385898952")).toBe(true);
    expect(isValidPhone("038 589 89 52")).toBe(true);
  });

  it("so so false", () => {
    expect(isValidPhone("12345678")).toBe(false);
    expect(isValidPhone("0385898952123")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("email format true", () => {
    expect(isValidEmail("a@bc.vn")).toBe(true);
  });

  it("email format false", () => {
    expect(isValidEmail("abc")).toBe(false);
    expect(isValidEmail("@x.vn")).toBe(false);
  });
});

describe("validateCheckout", () => {
  it("info valid khong error", () => {
    const info: CheckoutInfo = {
      fullName: "Nguyen Test",
      phone: "0385898952",
      email: "",
      address: "123 Duong Test, Ha Noi",
      province: "Ha Noi",
      district: "Cau Giay",
      note: "",
      paymentMethod: "cod",
    };
    expect(validateCheckout(info)).toEqual({});
    expect(hasErrors(validateCheckout(info))).toBe(false);
  });

  it("fullName qua short set key fullName", () => {
    const errors = validateCheckout({
      fullName: "A",
      phone: "0385898952",
      email: "",
      address: "123 Duong Test, Ha Noi",
      province: "Ha Noi",
      district: "Cau Giay",
      note: "",
      paymentMethod: "cod",
    });
    expect(errors.fullName).toBeDefined();
    expect(hasErrors(errors)).toBe(true);
  });

  it("phone invalid set key phone", () => {
    const errors = validateCheckout({
      fullName: "Nguyen Test",
      phone: "abc",
      email: "",
      address: "123 Duong Test, Ha Noi",
      province: "Ha Noi",
      district: "Cau Giay",
      note: "",
      paymentMethod: "cod",
    });
    expect(errors.phone).toBeDefined();
  });

  it("email invalid set key email", () => {
    const errors = validateCheckout({
      fullName: "Nguyen Test",
      phone: "0385898952",
      email: "not-an-email",
      address: "123 Duong Test, Ha Noi",
      province: "Ha Noi",
      district: "Cau Giay",
      note: "",
      paymentMethod: "cod",
    });
    expect(errors.email).toBeDefined();
  });

  it("address qua short set key address", () => {
    const errors = validateCheckout({
      fullName: "Nguyen Test",
      phone: "0385898952",
      email: "",
      address: "Ha Noi",
      province: "Ha Noi",
      district: "Cau Giay",
      note: "",
      paymentMethod: "cod",
    });
    expect(errors.address).toBeDefined();
  });

  it("province/district trong set key tuong ung", () => {
    const errors = validateCheckout({
      fullName: "Nguyen Test",
      phone: "0385898952",
      email: "",
      address: "123 Duong Test, Ha Noi",
      province: "",
      district: "",
      note: "",
      paymentMethod: "cod",
    });
    expect(errors.province).toBeDefined();
    expect(errors.district).toBeDefined();
  });
});

describe("readOrders filter", () => {
  it("storage empty return empty array", () => {
    expect(readOrders(makeStorage())).toEqual([]);
  });

  it("json invalid return empty array", () => {
    expect(
      readOrders(makeStorage({ [ORDERS_STORAGE_KEY]: "{not json" })),
    ).toEqual([]);
  });

  it("order valid doc storage", () => {
    const storage = makeStorage({
      [ORDERS_STORAGE_KEY]: JSON.stringify([VALID_ORDER]),
    });
    expect(readOrders(storage)).toEqual([VALID_ORDER]);
  });

  it("REGRESSION P1-2: order missing info must be rejected", () => {
    const broken: Record<string, unknown> = {
      code: VALID_ORDER.code,
      createdAt: VALID_ORDER.createdAt,
      lines: VALID_ORDER.lines,
      totals: VALID_ORDER.totals,
    };
    const storage = makeStorage({
      [ORDERS_STORAGE_KEY]: JSON.stringify([broken]),
    });
    expect(readOrders(storage)).toEqual([]);
  });

  it("REGRESSION P1-2: line missing productId must be rejected", () => {
    const broken = JSON.parse(JSON.stringify(VALID_ORDER)) as Record<string, unknown>;
    (broken.lines as unknown[])[0] = { variantId: "p1-m", quantity: 2 };
    const storage = makeStorage({
      [ORDERS_STORAGE_KEY]: JSON.stringify([broken]),
    });
    expect(readOrders(storage)).toEqual([]);
  });

  it("REGRESSION P1-2: quantity not number must be rejected", () => {
    const broken = JSON.parse(JSON.stringify(VALID_ORDER)) as Record<string, unknown>;
    (broken.lines as unknown[])[0] = {
      ...(broken.lines as unknown[])[0] as Record<string, unknown>,
      quantity: "2",
    };
    const storage = makeStorage({
      [ORDERS_STORAGE_KEY]: JSON.stringify([broken]),
    });
    expect(readOrders(storage)).toEqual([]);
  });

  it("REGRESSION S1: order older than MAX_ORDER_AGE_DAYS is pruned", () => {
    const stale = JSON.parse(JSON.stringify(VALID_ORDER)) as PlacedOrder;
    stale.createdAt = new Date(
      Date.now() - 91 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const storage = makeStorage({
      [ORDERS_STORAGE_KEY]: JSON.stringify([VALID_ORDER, stale]),
    });
    expect(readOrders(storage)).toEqual([VALID_ORDER]);
  });

  it("REGRESSION S1: unparseable createdAt is pruned", () => {
    const stale = JSON.parse(JSON.stringify(VALID_ORDER)) as PlacedOrder;
    stale.createdAt = "not-a-date";
    const storage = makeStorage({
      [ORDERS_STORAGE_KEY]: JSON.stringify([stale]),
    });
    expect(readOrders(storage)).toEqual([]);
  });
});

describe("saveOrder and findOrderByCode", () => {
  it("saveOrder then readOrders round trip", () => {
    const storage = makeStorage();
    saveOrder(VALID_ORDER, storage);
    expect(readOrders(storage)).toEqual([VALID_ORDER]);
  });

  it("findOrderByCode case insensitive and trim", () => {
    const storage = makeStorage({
      [ORDERS_STORAGE_KEY]: JSON.stringify([VALID_ORDER]),
    });
    expect(findOrderByCode("  lm-abcdef ", storage)).toEqual(VALID_ORDER);
    expect(findOrderByCode("LM-ZZZZZZ", storage)).toBeUndefined();
  });
});
