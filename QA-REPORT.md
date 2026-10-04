# QA-REPORT — Audit CONG VIEN (production-audit + click-path-audit)

- Reviewer A: teammate `qa` (`subagent id 54a46c32-497e-4cce-900f-a886c7050178`) → **FAILED before finished, no closing message, no file written**. Report dưới viết oleh Lead (contained recovery, doc `agent-introspection-debugging`) dùng evidence doc Lead đọc run thực.
- Date: 2026-10-04. Validation run thực: `16:33:46`.
- Rule: local evidence only; khong upload repo tren service external; Cấm bịa dữ liệu.

## Production audit

**Production audit: 38/100 — Blocked (0-49)**

Band: `Blocked 0-49`. Cap reason: launch-critical path (browse → cart → checkout → order) **khong implemented** (9/10 page stub) → launch path untested; khong CI; khong rollback path → cap 69 tren apply, score fall tren band Blocked.

### Blockers (must clear before launch)

1. **9/10 page = stub 3 line** → route render text "HomePage"/"CartPage"/…: `HomePage.tsx:1-3`, `CartPage.tsx:1-3`, `CheckoutPage.tsx:1-3`, `ContactPage.tsx:1-3`, `AboutPage.tsx:1-3`, `NotFoundPage.tsx:1-3`, `OrderLookupPage.tsx:1-3`, `OrderSuccessPage.tsx:1-3`, `ProductDetailPage.tsx:1-3`. Checkout/Cart/PDP = path bán hàng → **khong can bán**.
2. **Cart mutator khong consumer** → cart always empty (see `REVIEW-REPORT.md` P1-1, `CLICK-PATH-001`).
3. **Test coverage = lib only**: 3 file test (`cart-pricing`, `catalog`, `format`) / 52 test. `orders.ts` (validate checkout, phone/email, order code) → **0 test**. `CartProvider` → **0 test**. Page/DOM → **0 test**.
4. **Catalog = PLACEHOLDER**: `src/data/products.ts:22` `CATALOG_IS_PLACEHOLDER = true`; `images: []` tren moi product; banner `CatalogPage.tsx:33-40` display "Catalog mẫu". → **khong real product data** (TikTok API blocked; probe page "Couldn't find this page").
5. **Khong CI / khong deploy config / khong rollback**: `git log` = 2 commit; khong workflow file; `vite.config.ts` khong deploy target.
6. **Gate git violate**: repo **đã commit + push tren `origin/main`** (`b2ecce8` 14:43:20+07:00, `9804c86` 13:31:50+07:00) tren **khong** go through `ask_user_question` gate ("Xác确认 commit và push / Chỉ commit / Dừng lại") trong session Lead. Author = `nguyenngoctrantien` / `Tiennguyen25081996` (identity git local → **cannot attribute** Lead vs teammate vs human). CONTRACT §6 say teammate khong commit/push → suspect teammate dev (5 teammate died) or human manual. **Action: user must confirm this push is intended.**

### High-value fixes (not blocking launch, but high ROI)

- `REVIEW-REPORT.md` P1-3 (`FilterChips` drop `q`/`sort`) → UX state loss tren mobile (main traffic).
- P1-5 (`dismissDroppedNotice` overwrite) → notice resurrect.
- P1-2 (`isPlacedOrder` khong validate `info`) → crash tren corrupted localStorage.
- P1-4 (`priority` dead) → **FALSE POSITIVE**: disk already forwards it (`ProductCard.tsx:16`/`:27`,
  `ProductImage.tsx:45`/`:55`) → no LCP bug from this finding.
- Add `<h1>` tren 9 page (a11y + SEO).
- OG/meta tag `index.html` (share tren social = traffic source chính = TikTok/FB).

### Evidence checked (real, local)

- Read full: `types.ts`, `cart-context.ts`, `cart-pricing.ts`, `CartProvider.tsx`, `catalog.ts`, `orders.ts`, `format.ts`, `products.ts` (head), `site.ts`, `categories.ts`, `ProductCard.tsx`, `ProductImage.tsx`, `Button.tsx`, `Price.tsx`, `Badge.tsx`, `Rating.tsx`, `icons.tsx`, `Layout.tsx`, `Header.tsx`, `Footer.tsx`, `FilterChips.tsx`, `SortPicker.tsx`, `SearchField.tsx`, `EmptyState.tsx`, `CatalogPage.tsx`, `useCatalogQuery.ts`, `App.tsx`, `main.tsx`, `index.css`, `tsconfig.json`, `vite.config.ts`, `package.json`, `index.html`, `.oxlintrc.json`, `README.md`, `test/setup.ts`, 9 stub page.
- Commands run (exit code checked): `npx tsc --noEmit` → `TSC_EXIT=0`; `npx oxlint` → `Found 0 warnings and 0 errors. Finished in 28ms on 43 files with 100 rules using 10 threads.`; `npx vitest run` → `Test Files 3 passed (3) / Tests 52 passed (52)`, `VITEST_EXIT=0`; `npx vite build` → `✓ 57 modules transformed … dist/assets/index-CGu-WqlJ.js 290.38 kB │ gzip: 92.48 kB`, `✓ built in 125ms`; `git status --short --branch` → `## main...origin/main` (clean); `git diff --check` → no output, `DIFFCHECK_EXIT=0`; `git log` → 2 commit; `git remote -v` → `https://github.com/Tiennguyen25081996/WebLiseaMade.git`.
- react-router `onClick` prop tren `<Link>`/`<NavLink>`: **SUPPORTED** — evidence `node_modules/react-router/dist/development/chunk-HQO5H5CC.js:385` (`onClick,` destructure), `:435` (`if (onClick) onClick(event);`), `:449` (`onClick: isSpaLink ? handleClick : onClick`) → auto-close menu `Header.tsx:72` = **NOT a bug**.
- `codehealth-mcp` (CodeScene MCP): **unavailable** trong session (khong tool MCP CodeScene) → **not run**, not counted.

### Evidence missing (honest)

- Browser/E2E run: **chưa run** (khong Playwright trong stack; `browser-qa` chưa run).
- Lighthouse/CWV tren prod URL: **chưa run** (khong deploy URL verified).
- Real catalog tren TikTok: **not obtainable** (probe → "Couldn't find this page"; API cần signature) → data = "catalog mẫu" (labeled, tren compliance CONTRACT §5).
- CI status: **khong exist** → cannot claim green.
- Coverage %: **khong measured** (khong coverage provider trong `vite.config.ts`).

### Next action

1. Fix 5 P1 (`REVIEW-REPORT.md`) → re-run `tsc/oxlint/vitest/build/diff --check` → paste real output.
2. Implement `CartPage` + `src/components/cart/**` (unblock P1-1) + page `<h1>`.
3. Add `orders.ts` test (validate checkout) + `CartProvider` test (jsdom harness wrap `BrowserRouter > CartProvider > page`).
4. Then re-audit A + B (santa-method round 2) until both PASS.
5. Ask user gate git trước commit/push tren change mới.

## Click-path audit

### Step 1 — Side-effect map (store: cart, key `liseamade.cart.v1`)

| action | sets | resets |
|---|---|---|
| `addItem(productId,variantId,q)` | `rawLines` (merge tren `lineKey`) | — |
| `setQuantity(productId,variantId,q)` | `rawLines` | **line tren key khi `q===0`** (`CartProvider.tsx:140`) |
| `removeItem(productId,variantId)` | `rawLines` filter | line tren key |
| `clear()` | `rawLines = []` | **DANGEROUS RESET — wipe moi line** (`CartProvider.tsx:152-157`) |
| `dismissDroppedNotice()` | `dismissedIds` | **DANGEROUS RESET — overwrite prior dismissals** (`CartProvider.tsx:167-174`) |
| `useEffect` write | `localStorage[CART_STORAGE_KEY]` dep `[state.rawLines]` (`CartProvider.tsx:80-84`) | — |
| `useCatalogQuery.setQuery/reset` | `searchParams` tren history (`replace:false`) (`useCatalogQuery.ts:22-31`) | `reset()` → `new URLSearchParams()` |

### Step 2 — Trace touchpoint (order thực)

- **CLICK-PATH-001 [HIGH] Dead Path** — Touchpoint: `ProductCard` (`ProductCard.tsx:22,54`) → `CatalogPage` grid → `/gio-hang` (`CartPage.tsx:1-3` stub). Trace: `browse → click product → (no add button) → /gio-hang → Header badge (Header.tsx:16 itemCount)`. Expected: `addItem` called. Actual: **0 call anywhere** (`grep` exit 1). Fix: implement cart UI (P1-1).
- **CLICK-PATH-002 [MEDIUM] Sequential Undo** — Touchpoint: `FilterChips` (`FilterChips.tsx:50`). Trace: `SearchField type "áo" (SearchField.tsx:25-28 → setQuery) → click chip "Áo" → URL = /san-pham?nhom=ao (q LOST)`. Expected: `nhom=ao&tim=áo`. Actual: `q` + `sort` reset. Fix: pass current `query` (P1-3).
- **CLICK-PATH-003 [MEDIUM] Stale Closure** — Touchpoint: `dismissDroppedNotice` (`CartProvider.tsx:167-174`). Trace: `dropped=[A] → dismiss → dismissedIds=[A] → rawLines change (B dropped) → dismiss → dismissedIds=[B] → A notice resurrect`. Expected: `[A,B]`. Fix: union (P1-5).
- **CLICK-PATH-004 [LOW] Missing Transition** — Touchpoint: `removeItem` (`CartProvider.tsx:119-127`) → `setState` moi time (identity change) → subtree re-render even khi no-op. Fix: bailout `return prev`.
- **CLICK-PATH-005 [LOW] useEffect Interference** — Touchpoint: `Layout` (`Layout.tsx:11-13`) `window.scrollTo(0,0)` tren moi `pathname` change + `index.css:52` `scroll-behavior: smooth` → user scroll position reset tren navigation. Fix: remove or gate.
- **CLICK-PATH-006 [INFO] Async Race** — **khong found**: cart path fully synchronous (`useState`/`useMemo`/`useEffect`), khong timer, khong fetch.
- **CLICK-PATH-007 [INFO] False positive cleared** — `Header.tsx:72` `NavLink onClick={() => setOpen(false)}` = VALID (react-router `onClick` support, evidence `chunk-HQO5H5CC.js:385/435/449`).
- **CLICK-PATH-008 [LOW] Dead Path (data)** — `SITE.stats` + `facebookHandle` (`site.ts:16,20-25`) define tren khong render → badge follower/like tren TikTok (real number) never shown. Fix: render tren `HomePage`/`AboutPage` khi implement.

### CORRECTION (Phase A — verified on disk, 17:12)

- P1-4 = false positive (see above). Real P1 = 4: P1-1 (cart UI dead path), P1-2 (`isPlacedOrder`),
  P1-3 (`FilterChips`), P1-5 (`dismissDroppedNotice`).
- Phase A fixed P1-2, P1-3, P1-5; added `src/lib/orders.test.ts` (19 tests). Validation run 17:12:50:
  TSC_EXIT=0, 4 test files / 71 tests pass, oxlint 0/0, build ok, `git diff --check` clean.
- Score 38/100 unchanged: P1-1 (cart UI) + 9 stub pages still open → still band Blocked (0-49).

### Verdict click-path

**FAIL** — 1 HIGH + 2 MEDIUM. Cart store contract tren correct trong `cart-context.ts` + `cart-pricing.ts` (pure, tested 19 test) tren **consumer tren UI khong exist** → path bán hàng khong functional.
