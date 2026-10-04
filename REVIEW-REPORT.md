# REVIEW-REPORT — Review code strict (perf + correctness)

- Reviewer: Lead (agent team) — thay thay thế `reviewer` teammate (chết: "ran out of room before it finished", `subagent id ff2e2d8b-5afd-47a7-ba8b-95c9d24e3c30`).
- Date: 2026-10-04 (run validation lúc `16:33:46`).
- Scope: ALL file source (`src/**`, config, `index.html`) — 43 file lint, 51 file tracked trong commit `b2ecce8`.
- Method: doc `santa-method` (2 reviewer doc — B = Lead này file, A = `qa` teammate → file `QA-REPORT.md`), rubric identical, verdict gate `B PASS AND C PASS → NICE` else `NAUGHTY`.
- Rule: Cấm bịa dữ liệu. Muc ca cite `file:line` doc đọc bằng tool `read`. Nei test/lint/build chưa run → say "chưa run".

## Verdict

**FAIL** — 5 finding P1 chưa fix. Gate santa-method: `B = FAIL` → `NAUGHTY` (khong cand `qa` PASS rescue verdict B).

## P1 — Must fix (bug thực, user-facing)

| # | Finding | Evidence | Fix |
|---|---------|----------|-----|
| P1-1 | **Cart mutator khong có consumer**: UI khong can them add/sua/remove item cart. `useCart()` doc 1 consumer (`Header.tsx:16` doc c `itemCount`). `addItem/removeItem/setQuantity/clear/dismissDroppedNotice/droppedLineIds` → 0 consumer outside provider. | `grep -rn "useCart" src` → `Header.tsx:4,16` only. `grep -rn "addItem\|removeItem\|setQuantity\|dismissDroppedNotice\|droppedLineIds" src` (filter out `src/context`, `src/lib`, `src/types`) → **no match, exit code 1**. `src/pages/CartPage.tsx:1-3` = stub `"CartPage"`. `src/components/cart/` = **empty dir** (`find src/components -type d -empty`). | Implement `CartPage` + `src/components/cart/**` (AddToCartButton, LineItemRow, QuantityStepper, CartSummary) calling mutators. Pattern: **Dead Path / Missing Transition**. |
| P1-2 | **`isPlacedOrder` khong validate `info`** (field `info` REQUIRED trong `PlacedOrder` `types.ts`) → object localStorage `info` thi pass guard → `order.info.fullName` crash later. Guard check `code/createdAt/lines/totals` only; `lines` element khong check shape. | `src/lib/orders.ts:105-114` (`isPlacedOrder`) vs `src/types.ts` (`PlacedOrder{code,createdAt,lines,totals,info}`). | Add `info` check (`typeof o.info === "object"` + `fullName`/`phone` string) + validate each line `{productId,variantId,quantity}`. |
| P1-3 | **`FilterChips` bot `q` + `sort` khi đổi category**: link build from `DEFAULT_QUERY` spread, NOT current query → user tim "áo" sau click chip "Áo" → term tim lost. `SortPicker` thi correct (spread `{ ...query, sort }`) → inconsistent. | `src/components/catalog/FilterChips.tsx:50` `toSearchParams({ ...DEFAULT_QUERY, category: category.id })` vs `src/components/catalog/SortPicker.tsx:36` `toSearchParams({ ...query, sort: option.value })`. | `FilterChipsProps` them accept `query: CatalogQuery` (not only `active`) → build `{ ...query, category: category.id }`. |
| P1-4 | **FALSE POSITIVE — ALREADY CORRECT ON DISK** (original claim: `ProductCard` prop `priority` dead**): `CatalogPage` try `priority={index < 3}` (`CatalogPage.tsx:60`) but `ProductCard` destructure `{ product }` only → `priority` never forwarded to `ProductImage` (`loading="lazy"` hardcode `ProductImage.tsx:55`) → image above fold lazy-load → LCP worse. | `src/components/product/ProductCard.tsx:16` `ProductCardProps { product; priority?: boolean }`, `:17` `export function ProductCard({ product }: ProductCardProps)`; `src/components/product/ProductImage.tsx:13` `priority = false`, `:55` `loading={priority ? "eager" : "lazy"}`. | Forward: `priority={props.priority}` → `<ProductImage priority={priority} …>`. |
| P1-5 | **`dismissDroppedNotice` overwrite `dismissedIds` (stale closure)**: set `dismissedIds: visibleDropped` (REPLACE, not union). Sequence: dismiss A → new dropped line B appear → dismiss → `dismissedIds=[B]` → notice A **resurrect**. | `src/context/CartProvider.tsx:167-174` (`dismissDroppedNotice`), `:159` `visibleDropped = droppedLineIds.filter(id => !state.dismissedIds.includes(id))`. | Union: `dismissedIds: Array.from(new Set([...prev.dismissedIds, ...visibleDropped]))`. |

## P2 — Should fix

| # | Finding | Evidence | Fix |
|---|---------|----------|-----|
| P2-1 | **9 page stub → 0 `<h1>`**: a11y CONTRACT §5 "one `<h1>`/page" violate tren 9/10 route. | `grep -rn "<h1" src` → **1 match only** `src/pages/CatalogPage.tsx:24`. Stub: `HomePage.tsx:1-3`, `CartPage.tsx:1-3`, `CheckoutPage.tsx:1-3`, `ContactPage.tsx:1-3`, `AboutPage.tsx:1-3`, `NotFoundPage.tsx:1-3`, `OrderLookupPage.tsx:1-3`, `OrderSuccessPage.tsx:1-3`, `ProductDetailPage.tsx:1-3`. | Each page render `<h1>` real Vietnamese. |
| P2-2 | **`aria-controls` dangling**: `Header.tsx:62` `aria-controls="menu-di-dong"` static, but `<nav id="menu-di-dong">` (`Header.tsx:72`) render ONLY khi `open` → khi menu close, ARIA reference non-existent id. | `src/components/layout/Header.tsx:62`, `:72`. | Remove `aria-controls` khi closed, or keep nav in DOM + `hidden`. |
| P2-3 | **`aria-label` tren `<div>` khong semantic** → AT ignore. | `src/components/ui/Rating.tsx:17` `<div className="flex items-center gap-1.5" aria-label="Đ đánh giá …">`. | `role="img"` + `aria-label`, or wrap stars `role="presentation"` + visually-hidden text. |
| P2-4 | **`removeItem` khong bailout**: always `setState` (new array identity) even khi key khong exist → re-render subtree churn. `clear()` thi correct (`CartProvider.tsx:155` return `prev` khi empty). | `src/context/CartProvider.tsx:119-127`. | `if (!prev.rawLines.some(...)) return prev;` |
| P2-5 | **`saveOrder` unbounded growth**: `orders` localStorage array prepend, khong cap → sau N order, `readOrders` parse JSON N entry mỗi call. | `src/lib/orders.ts:44` (`saveOrder`), `:30` (`readOrders` parse mỗi call). | Cap (example 50) + `findOrderByCode` cache parse. |
| P2-6 | **`CatalogPage` recompute filter/sort mỗi render**: `selectProducts` + `priceBounds` tren body render, no `useMemo`; cart mutation → subtree re-render → re-run. | `src/pages/CatalogPage.tsx:17-18`. | `useMemo` dep `[PRODUCTS, query.category, query.q, query.sort]`. |
| P2-7 | **`hydrateLines` O(n·m)**: `products.find` + `variants.find` inside loop (N+1 pattern). | `src/lib/cart-pricing.ts:29-30`. | Build `Map<id, product>` + `Map<variantId, variant>` once. |
| P2-8 | **`SearchField` `onChange` fire per keystroke** → `setQuery` per char → `setSearchParams` per char (chatty, re-render storm). | `src/components/catalog/SearchField.tsx:25-28`. | Debounce, or read value on `blur`/explicit submit button. |
| P2-9 | **lint weak**: `.oxlintrc.json` enable `categories: { correctness: "error" }` only → 100 rule; `react-performance`/`a11y` khong enable → P1-4 (dead prop) lint miss. | `.oxlintrc.json:8-10`. | Add `react-performance`, `a11y` category + `correctness` already error. |
| P2-10 | **`Layout` side effect tren route change**: `useEffect(() => window.scrollTo(0,0), [pathname])` — impure global scroll tren moi route change; combine `index.css:52` `scroll-behavior: smooth`. | `src/components/layout/Layout.tsx:11-13`; `src/index.css:52`. | Remove (browser handles scroll) or gate `if (scrollY !== 0)`. |

## P3 — Nice to have

| # | Finding | Evidence |
|---|---------|----------|
| P3-1 | `setQuantity` tren line khong exist → **CREATE** line (semantic surprising "set" = "add"). | `src/context/CartProvider.tsx:140-151` |
| P3-2 | `EmptyState` `role="status"` + `aria-live="polite"` redundant (role imply live). | `src/components/catalog/EmptyState.tsx:18-19` |
| P3-3 | `priceBounds` 1 result → copy "giá từ X đến X" (min==max). | `src/lib/catalog.ts:108-117`, `src/pages/CatalogPage.tsx:29` |
| P3-4 | `SITE.stats` (followers/likes/videos) + `facebookHandle` define tren **never render** anywhere → dead data. | `src/data/site.ts:16`, `:20-25`; `grep -rn "stats\.\|facebookHandle" src` → 0 consumer |
| P3-5 | `index.html` khong favicon → 404 request tren prod; khong OG tag → no social preview (shop share tren social = main traffic). | `index.html:1-17` |
| P3-6 | `theme-color #0f766e` off palette (lagoon-600 = `#178c89`). | `index.html:6` vs `src/index.css:14` |
| P3-7 | `formatDateTime` no explicit `timeZone` → output locale-dependent (order code display drift). | `src/lib/format.ts:32-44` |
| P3-8 | `formatNumber`/`formatCompact` construct `Intl.NumberFormat` per call vs module-level `vnd`. | `src/lib/format.ts:14`, `:25` |
| P3-9 | `Layout.tsx:16` `<a href="#noi-dung">` = fragment skip-link (khong internal route → CONTRACT §5 OK, but plain `<a>` tren SPA: confirm khong intercept). | `src/components/layout/Layout.tsx:16` |
| P3-10 | `README.md` = 1 line "# WebLiseaMade" → no run docs. | `README.md:1` |

## Validation thực (paste output, run 16:33:46)

```
=== TSC ===
TSC_EXIT=0
=== OXLINT ===
Found 0 warnings and 0 errors.
Finished in 28ms on 43 files with 100 rules using 10 threads.
=== VITEST ===
 RUN  v5.0.3 /Users/nguyenngoctrantien/AI_dsh/WebLiseaMade

 ✓ src/lib/cart-pricing.test.ts (19 tests) 5ms
 ✓ src/lib/catalog.test.ts (27 tests) 6ms
 ✓ src/lib/format.test.ts (6 tests) 3ms

 Test Files  3 passed (3)
      Tests  52 passed (52)
   Start at  16:33:46
   Duration  819ms (environment 82%, setup 11%, transform 5%, import 1%, worker 1%, tests 1%)
VITEST_EXIT=0
=== BUILD ===
✓ 57 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.62 kB │ gzip:  0.38 kB
dist/assets/index-CkP2bdru.css   21.99 kB │ gzip:  5.16 kB
dist/assets/index-CGu-WqlJ.js   290.38 kB │ gzip: 92.48 kB

✓ built in 125ms
=== GIT ===
## main...origin/main
DIFFCHECK_EXIT=0
```

- `git status --short --branch` → clean (no untracked) → **repo đã commit + push tren `origin/main`** (`b2ecce8`, `9804c86`). See `QA-REPORT.md` §Gate git.
- `git diff --check` → exit 0, no output (clean).
- Test coverage: **lib only** (cart-pricing, catalog, format). `src/lib/orders.ts` → **0 test**. `CartProvider` → **0 test**. Page → **0 test**.

## CORRECTION (Phase A — verified on disk, 17:12)

- P1-4 was a **false positive**: `src/components/product/ProductCard.tsx:16` already declares
  `export function ProductCard({ product, priority = false }: ProductCardProps)` and `:27` passes
  `priority={priority}` to `<ProductImage>`; `ProductImage.tsx:13` `priority?: boolean`, `:45`
  `priority = false`, `:55` `loading={priority ? "eager" : "lazy"}`. `CatalogPage.tsx:60`
  `priority={index < 3}` is therefore live. **No fix needed.** Real P1 count: **4**.
- Fixed in Phase A: P1-3 (`FilterChips`), P1-5 (`dismissDroppedNotice` union), P1-2 (`isPlacedOrder` strict).
- Added regression tests: `src/lib/orders.test.ts` (19 tests) covering the new strict `isPlacedOrder`.
- Validation after Phase A (run 17:12:50): TSC_EXIT=0, vitest 4 files / 71 tests pass, oxlint 0 warnings 0 errors,
  `vite build` ok, `git diff --check` clean.

## Fix cycle (santa-method)

Round 1: B FAIL (5 P1) → ship khong allowed. Fix order recommended: P1-1 (cart UI) → P1-3 (FilterChips) → P1-5 (dismiss union) → P1-2 (isPlacedOrder) → P1-4 (priority). Sau fix → re-run validation → re-review B + A until both PASS.

---

# KẾ HOẠCH SỬA — MASTER FIX PLAN

- Ngày lập: **2026-10-04** · validation chạy lúc **22:03**
- Nguồn: re-review toàn bộ `src/**` + config (đọc 53 file nguồn, 2 config thí nghiệm trong `/tmp`)
- Phạm vi: **gộp** finding của review perf/correctness (Phần 1) + review bảo mật + finding mới
- **Tài liệu này thay thế toàn bộ phần liệt kê lỗi chi tiết** — chỉ giữ lại **kế hoạch sửa**.

## Tổng quan

| Mức | Số mục | Ý nghĩa |
|---|---|---|
| P0 | **3** | Sửa ngay — mất dữ liệu / gate đỏ / thiếu header bảo mật |
| P1 | **4** | Sửa sớm — chất lượng, tuân thủ CONTRACT |
| P2 | **7** | Dọn dẹp hiệu năng & công cụ |
| P3 | **9** | Đẹp lên, không gấp |
| **Tổng** | **23** | Đã đóng sẵn: 10 mục P1/P2/P3 cũ + 1 false positive |

---

## Batch 1 — P0 (làm ngay, nhỏ & độc lập)

### ☐ S2 — Chống mất đơn hàng âm thầm

**Vấn đề:** `saveOrder` nuốt `QuotaExceededError` bằng `catch {}`, nhưng `CheckoutPage` vẫn `cart.clear()` và điều hướng tới trang thành công → **khách mất đơn + mất PII, shop không nhận gì, không thể hoàn tác**.
**File:** `src/lib/orders.ts:38-49` · `src/pages/CheckoutPage.tsx:167-180`

```ts
export function saveOrder(order: PlacedOrder, storage = safeStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([order, ...readOrders(storage)]));
    return true;
  } catch {
    return false;   // BÁO LẠI cho caller, không nuốt im lặng nữa
  }
}
```

```tsx
// CheckoutPage onClick — trước khi clear cart
if (!saveOrder(order)) {
  setError("Không lưu được đơn (bộ nhớ trình duyệt đã đầy). Vui lòng chụp màn hình đơn và gọi hotline.");
  return;          // GIỮ NGUYÊN cart.lines để khách thử lại — KHÔNG clear, KHÔNG navigate
}
cart.clear();
navigate(`/dat-hang-thanh-cong?ma=${code}`);
```

### ☐ N2 — Sửa override oxlint bị bỏ qua (1 dòng)

**Vấn đề:** trong `overrides[].rules`, oxlint **bắt buộc tên rule có tiền tố plugin**. Tên trần `"globals"` bị bỏ qua im lặng → CONTRACT §6 fail.
**File:** `.oxlintrc.json:34`

Đã thực nghiệm xác định nguyên nhân: đổi glob → vẫn lỗi; đổi `"globals"` → `"react/globals"` → **0 error**.

```diff
   "overrides": [{
     "files": ["**/*.test.tsx"],
     "rules": {
-      "globals": "off"
+      "react/globals": "off"
     }
   }]
```

> `npx oxlint --print-config` in ra `react/globals: allow` — **hiển thị sai, đừng tin**. Verify bằng exit code thật.

### ☐ S3 — Thêm security headers

**Vấn đề:** không CSP, không `X-Frame-Options` → **clickjacking** trên trang thanh toán. Đã kiểm tra: **không có file deploy config nào** trong repo.
**File:** `index.html:1-17` + tạo mới `_headers` *(Netlify / Cloudflare Pages / Vercel đều dùng được)*

```
/*
  Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
```

**Cần biết:** deploy lên host nào.


---

## Batch 2 — P1 (chất lượng & tuân thủ)

### ☐ S4 (= P2-5) — Cap storage, không phình vô hạn

**File:** `src/lib/orders.ts:44` — `[order, ...readOrders()]` prepend mãi; mỗi đơn còn snapshot cả object `product`+`variant`.

```ts
const MAX_ORDERS = 50;
const all = [order, ...readOrders(storage)].slice(0, MAX_ORDERS);   // cân nhắc cắt theo createdAt
```

### ☐ N1 — Class Tailwind động `delay-${...}` không tồn tại

**File:** `src/pages/HomePage.tsx:60` — `animate-reveal-up delay-${index * 150}`. Tailwind không quét được class ghép động, và `delay-*` không phải utility mặc định.
**Verify:** `grep -c 'delay-' dist/assets/*.css` → **0** → animation so-le trang chủ **chết hoàn toàn**.

```tsx
const STAGGER = ["delay-0", "delay-150", "delay-300"] as const;
// ...
className={`animate-reveal-up ${STAGGER[index] ?? "delay-0"}`}
```

```css
/* src/index.css */
@utility delay-0   { animation-delay: 0ms; }
@utility delay-150 { animation-delay: 150ms; }
@utility delay-300 { animation-delay: 300ms; }
```

### ☐ N3 — Bổ dấu toàn bộ copy UI tiếng Việt

**Vi phạm CONTRACT §5** ("Toàn bộ copy UI tiếng Việt"). Đang trộn lẫn không dấu / có dấu.
**File:** `CartPage.tsx:23,96` · `CheckoutPage.tsx:35,36,38,44,71,182,184,190` · `OrderLookupPage.tsx:18,25,48,61,62` · `OrderSuccessPage.tsx:18,29,37,39,51` · `ProductDetailPage.tsx:31,33,67,83,116,129,144` · `AboutPage.tsx:12,17,21,34,39` · `ContactPage.tsx:11,37`

| Sai | Đúng |
|---|---|
| `"Gio hang"` / `"Rut gio hang"` | `"Giỏ hàng"` / `"Rút giỏ hàng"` |
| `"Hoy ten"` / `"So dien tho"` | `"Họ tên"` / `"Số điện thoại"` |
| `"Rut card"` / `"Dat don"` | `"Rút card"` / `"Đặt đơn"` |
| `"Tra cò sach don"` | `"Tra cứu đơn hàng"` |

> Sửa **thuần copy**, không đụng logic. Nên gom 1 commit riêng cho dễ review.

### ☐ S1 — Giảm nhẹ PII trong localStorage

**File:** `src/lib/orders.ts:3` — lưu trọn họ tên / SĐT / email / địa chỉ, **không mã hoá, không TTL, không có UI xoá**.
- Tự xoá đơn cũ > 90 ngày.
- Thêm nút **"Xoá dữ liệu của tôi"** ở `/tra-cuu-don`.

> **Đây chỉ là giảm nhẹ, không giải quyết triệt để.** PII trên máy khách **về bản chất không mã hoá an toàn được**. Mã hoá client-side là **ảo và có thể tệ hơn** (false sense of security). Giải pháp đúng là **không lưu PII ở client** → cần backend.


---

## Batch 3 — P2 (hiệu năng & công cụ)

| ☐ | Mã | Vấn đề | File:line | Cách sửa |
|---|---|---|---|---|
| ☐ | **S6** | Khống chống trùng mã đơn → khách nhận **sai đơn** | `orders.ts:8-22` | `let c = generateOrderCode(); while (readOrders().some(o => o.code === c)) c = generateOrderCode();` |
| ☐ | **S5** | Tra cứu đơn không throttle | `orders.ts:51-57` | Ghi nhận ràng buộc thiết kế (xem "Không cần sửa") |
| ☐ | **P2-6** | `selectProducts`+`priceBounds` gọi trong body, không `useMemo` | `CatalogPage.tsx:17-18` | `useMemo` dep `[PRODUCTS, query.category, query.q, query.sort]` |
| ☐ | **P2-7** | `hydrateLines` O(n·m) — `.find()` trong vòng lặp | `cart-pricing.ts:29-30` | Build `Map<id, product>` + `Map<variantId, variant>` một lần |
| ☐ | **P2-8** | `setSearchParams` **mỗi keystroke**, không debounce | `SearchField.tsx:25-28` | Debounce ~250ms hoặc submit on blur / nút |
| ☐ | **S7** | `.npmrc` tắt `npm audit`, **không có CI** | `.npmrc:3` | Bỏ `audit=false`; thêm CI chạy `tsc`+`oxlint`+`vitest`+`audit` |
| ☐ | **P2-9** | Thiếu category `a11y` + `react-perf` trong lint | `.oxlintrc.json:13-16` | Thêm 2 category (plugin đã khai báo ở `:3-8` nhưng chưa bật) |

---

## Batch 4 — P3 (đẹp lên)

| ☐ | Mã | Vấn đề | File:line | Cách sửa |
|---|---|---|---|---|
| ☐ | **N4** | Typo **"Giassm don"** hiển thị thẳng cho khách | `CheckoutPage.tsx:19,39` | Đổi `id` + `label` thành `ghi-chu` / `"Ghi chú đơn (không bắt buộc)"` |
| ☐ | **P3-5** | Không favicon + không OG tag | `index.html` | Thêm favicon + `og:title/og:image/og:description`. **Share social là kênh traffic chính** |
| ☐ | **P3-3** | Copy "giá từ X đến X" khi chỉ 1 sản phẩm | `CatalogPage.tsx:27-29` | Rẽ nhánh: `results.length === 1` → chỉ in giá |
| ☐ | **P3-4** | `facebookHandle` vẫn 0 consumer | `site.ts:16` | Render ở Footer/ContactPage hoặc xoá khỏi data |
| ☐ | **P3-6** | `theme-color` lệch palette | `index.html:6` | `#0f766e` → `#178c89` (lagoon-600, `index.css:14`) |
| ☐ | **P3-7** | `formatDateTime` không set `timeZone` | `format.ts:35-42` | Thêm `timeZone: "Asia/Ho_Chi_Minh"` → giờ hiển thị nhất quán |
| ☐ | **P3-8** | `Intl.NumberFormat` dựng lại mỗi lần gọi | `format.ts:14,25-28` | Nâng module-level const như `vnd` ở `:1` |
| ☐ | **P3-10** | `README.md` 1 dòng, không hướng dẫn chạy | `README.md` | Thêm mô tả + `npm install/dev/test/build` |
| ☐ | **N5** | Indentation thừa | `EmptyState.tsx:35`, `Button.tsx:46-47` | Dọn khi chạm vào file |


---

## KHÔNG cần sửa (đã verify)

| Mã | Lý do |
|---|---|
| **P1-4** | **False positive.** `priority` đã sống: `ProductCard.tsx:19` destructure, `:30` truyền xuống `ProductImage`. |
| **P1-1 / P1-2 / P1-3 / P1-5** | Đã fix. Đường bán hàng đã thông (cart mutator có consumer thật). |
| **P2-1 / P2-2 / P2-3 / P2-4 / P2-10** | Đã fix. 10/10 route có `<h1>`; `aria-controls` có điều kiện; `Rating` đã có `role="img"`. |
| **P3-1 / P3-2** | Đã fix. `setQuantity` không tạo line; `EmptyState` bỏ `aria-live` thừa. |
| **P3-9** | Skip-link `<a href="#noi-dung">` là **đúng** (`Layout.tsx:8-13`), không cần `<Link>`. |
| **S5** (mức hiện tại) | **Không phải IDOR khai thác được** — orders nằm trong localStorage của chính người tra cứu. Chỉ ghi nhận **ràng buộc thiết kế**: khi chuyển order history lên server (hướng đúng, để giải quyết S1) thì phải thêm throttle + rate limit. |
| **S1 phần "mã hoá PII"** | **Vô nghĩa trên client.** Đã nêu ở Batch 2. |

---

## Baseline validation (trước khi bắt đầu sửa)

Chạy lại sau **mỗi batch** theo thứ tự, dán output thật (CONTRACT §6):

```bash
cd /Users/nguyenngoctrantien/AI_dsh/WebLiseaMade
npx tsc --noEmit        # baseline: 0 error
npx oxlint              # baseline: 1 error  <- N2, kỳ vọng về 0 sau Batch 1
npx vitest run          # baseline: 82/82 pass (5 files)
npx vite build          # baseline: OK
git diff --check        # baseline: sạch
```

> **Gate hiện tại: ĐỎ** — `oxlint` 1 error. Sau Batch 1 phải xanh trở lại.
> **Không `git commit` / `git push`** (CONTRACT §6) — chỉ Lead commit sau khi user xác nhận.

## Ghi chú

- Tài liệu này **thay thế** các phần liệt kê lỗi chi tiết trước đó — đã xoá để tránh trùng lặp.
- **Phần 1 (review gốc của Lead, dòng 1–105) giữ nguyên** — không sửa.
- Bản sao lưu 590 dòng trước khi rút gọn: `/tmp/REVIEW-REPORT.backup.md`.
- Kế hoạch này **thuần đọc + kế hoạch** — chưa sửa file nguồn nào.

