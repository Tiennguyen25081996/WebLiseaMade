# HỢP ĐỒNG KỸ THUẬT — WebLiseaMade (ĐỌC TRƯỚC KHI VIẾT CODE)

Tài liệu này **đóng băng** các interface dùng chung. Teammates **KHÔNG được sửa** file
trong mục "Lead sở hữu". Nếu thấy cần đổi, `send_message` cho `lead` rồi chờ.

---

## 1. Stack & lệnh bắt buộc

| Việc | Lệnh |
|---|---|
| Typecheck | `npx tsc --noEmit` |
| Lint | `npx oxlint` |
| Test | `npx vitest run` |
| Build | `npx vite build` |

- React 19 + Vite 8 + TypeScript 7 + Tailwind v4 (`@import "tailwindcss"` + `@theme`).
- **Node engine**: máy đang chạy Node v22.20.0, một số package con cảnh báo `EBADENGINE`.
  Đây là **warning, không phải lỗi** — không được coi là blocker.
- `npm` phải chạy với `npm_config_cache=/Users/nguyenngoctrantien/AI_dsh/.npm-cache`
  (cache mặc định `~/.npm` bị lỗi quyền). **Không** sửa config ngoài workspace.
- Alias import: `@/` → `src/`. Dùng `import { x } from "@/lib/format"`.
- `verbatimModuleSyntax: true` → **bắt buộc** `import type { X }` cho import chỉ-dùng-type.
- `noUnusedLocals` + `noUnusedParameters` bật → không để biến/tham số thừa.

---

## 2. File do LEAD sở hữu — TUYỆT ĐỐI không sửa

```
package.json  tsconfig.json  vite.config.ts  .oxlintrc.json  index.html  .npmrc  CONTRACT.md
src/types.ts            ← hợp đồng kiểu dữ liệu, nguồn sự thật
src/lib/format.ts       ← formatVnd, formatNumber, discountPercent, formatCompact, formatDateTime
src/lib/catalog.ts      ← normalizeText, selectProducts, sortProducts, parse/toSearchParams, getRelatedProducts…
src/lib/cart-pricing.ts ← computeTotals, hydrateLines, computeShippingFee, clampQuantity, FREE_SHIPPING_THRESHOLD
src/lib/orders.ts       ← generateOrderCode, saveOrder, readOrders, findOrderByCode, validateCheckout, isValidPhone
src/context/cart-context.ts  ← interface CartContextValue + useCart() + lineKey()
src/data/site.ts        ← SITE (thông tin thật của shop) + ZALO_URL
src/data/categories.ts  ← CATEGORIES (4 nhóm), getCategoryName
src/components/ui/*     ← Button, ButtonLink, Badge, Rating, Price, icons
src/components/layout/* ← Header, Footer, Layout
src/components/product/ProductCard.tsx, ProductImage.tsx
src/hooks/useCatalogQuery.ts
src/App.tsx  src/main.tsx  src/index.css  src/test/setup.ts
```

`src/data/products.ts` do **catalog-dev** sở hữu (mở rộng danh mục mẫu).

---

## 3. Bảng phân công write-scope (không được ghi ra ngoài)

| Owner | Write scope |
|---|---|
| `lead` | các file ở mục 2 |
| `catalog-dev` | `src/data/products.ts`, `src/pages/CatalogPage.tsx`, `src/components/catalog/**` |
| `pdp-dev` | `src/pages/ProductDetailPage.tsx`, `src/components/product/ProductGallery.tsx`, `src/components/product/VariantPicker.tsx`, `src/components/product/QuantityStepper.tsx` |
| `cart-dev` | `src/context/CartProvider.tsx`, `src/pages/CartPage.tsx`, `src/components/cart/**` |
| `checkout-dev` | `src/pages/CheckoutPage.tsx`, `src/pages/OrderSuccessPage.tsx`, `src/pages/OrderLookupPage.tsx` |
| `home-dev` | `src/pages/HomePage.tsx`, `src/pages/AboutPage.tsx`, `src/pages/ContactPage.tsx`, `src/pages/NotFoundPage.tsx`, `src/components/home/**` |
| `qa` | **read-only toàn bộ** + `QA-REPORT.md` |
| `reviewer` | **read-only toàn bộ** + `REVIEW-REPORT.md` |

Test: đặt cạnh file nguồn, tên `<tên>.test.ts(x)` — **trong write-scope của mình**.

---

## 4. Hợp đồng giỏ hàng (đọc kỹ)

`useCart()` trả về `CartContextValue`. `cart-dev` triển khai đầy đủ trong
`src/context/CartProvider.tsx`; các trang khác chỉ **đọc** qua `useCart()`.

```ts
const { lines, itemCount, totals, addItem, removeItem, setQuantity, clear,
        droppedLineIds, dismissDroppedNotice } = useCart();
```

Yêu cầu bắt buộc của `CartProvider`:

1. Lưu/đọc **localStorage** key `liseamade.cart.v1`; dữ liệu hỏng → bỏ qua, không ném lỗi.
2. `addItem(productId, variantId, qty)` — đã có cùng cặp thì **cộng dồn** quantity.
3. Mọi quantity đi qua `clampQuantity()` (1..99). `setQuantity(..., n<=0)` → xoá dòng.
4. `lines` = kết quả `hydrateLines(rawLines, PRODUCTS)` → dòng mồ côi vào `droppedLineIds`.
5. `totals` = `computeTotals(lines)` — **không tự viết lại công thức**.
6. `useMemo`/`useCallback` cho value để không re-render thừa.
7. Ghi localStorage phải bọc `try/catch` (chế độ riêng tư của Safari có thể ném lỗi).

---

## 5. Luật UI/UX bắt buộc

- **Ngôn ngữ: tiếng Việt**, giọng thân thiện, xưng "shop"/"bạn". Toàn bộ copy UI tiếng Việt.
- **Dữ liệu thật vs mẫu**: hotline `0385.8989.52`, TikTok `@liseahawaiisummer`,
  IG `Liseahawaii.Made`, FB `Liseahawaii Made` là **thật**.
  Tên/giá/mô tả sản phẩm là **mẫu** → UI phải có nhãn cho khách biết.
  **Cấm bịa** thông tin chưa kiểm chứng: địa chỉ shop, mã số thuế, chính sách đổi trả
  cụ thể, cam kết giao hàng, số điện thoại khác, email, giải thưởng, số liệu bán ra.
- Mọi ảnh sản phẩm đi qua `<ProductImage>` (tự vẽ placeholder "Ảnh minh hoạ" khi `images: []`).
- Giá luôn qua `<Price>` hoặc `formatVnd()`. Không hardcode chuỗi giá.
- Trạng thái rỗng phải có UI riêng (giỏ trống, không tìm thấy, đơn không tồn tại).
- Accessibility: nút chỉ có icon phải có `aria-label`; input phải có `<label>`;
  lỗi form gắn `aria-invalid` + `aria-describedby`; giữ thứ tự heading hợp lý (1 × `<h1>`/trang).
- Responsive: 375px → 1440px. Kiểm tra bằng Tailwind breakpoints.
- Không dùng `<a href>` cho route nội bộ — dùng `<Link>`/`<NavLink>` của react-router.
- Tôn trọng `prefers-reduced-motion` (đã xử lý ở `index.css`).

---

## 6. Luật validation sau MỌI thay đổi code

Chạy đủ, theo thứ tự, và **dán output thật** vào báo cáo:

```bash
cd /Users/nguyenngoctrantien/AI_dsh/WebLiseaMade
npx tsc --noEmit        # phải 0 error
npx oxlint              # phải 0 error
npx vitest run          # phải all pass
npx vite build          # phải build thành công
git diff --check        # phải sạch (không trailing whitespace / conflict marker)
```

- **Cấm bịa kết quả test.** Không có output thật thì nói thẳng "chưa chạy".
- Warning được phép: `EBADENGINE`, chunk > 500 kB.
- Sửa xong phải tự review: rò rỉ listener/timer, `useEffect` thiếu deps, object/array
  tạo mới mỗi render truyền xuống con, N+1 kiểu `.find()` trong vòng lặp lớn,
  `key` dùng index cho list có thể đổi thứ tự.
- **Không** `git commit` / `git push`. Chỉ Lead làm, sau khi user xác nhận.

---

## 7. Cách báo cáo về Lead

Khi xong task, gửi `send_message` cho `lead`, nội dung:

1. Task id + trạng thái.
2. Danh sách file đã tạo/sửa (đường dẫn tương đối).
3. Output **thật** của 4 lệnh validation (tóm tắt số dòng, dán phần kết luận).
4. Quyết định thiết kế đáng chú ý + điều còn do dự / chưa làm được.
