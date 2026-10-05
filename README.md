# 🌺 LiseaMade - Thời trang Hawaii Summer Editoral Web Shop

> **Thương hiệu:** Thời trang & phụ kiện phong cách Hawaii Summer  
> **Hotline:** 0385.8989.52 · TikTok [@liseahawaiisummer](https://www.tiktok.com/@liseahawaiisummer)  
> **Design Philosophy:** "Mỗi đường may đều hướng về biển — nhẹ, mát, tự do."

---

## 🎯 Tổng quan Project

LiseaMade là web shop thời trang & phụ kiện với thiết kế **Editorial Hawaii** - minimal luxury style. Project bao gồm:

- ✅ **Catalog Page** (`/san-pham`) - Filter by category, sort options, search
- ✅ **Product Detail Pages** (`/san-pham/:slug`) - Detailed product info with ratings, badges
- ✅ **Shopping Cart** (`/gio-hang`) - Cart management with summary totals  
- ✅ **Checkout** (`/thanh-toan`) - COD + card payment form
- ✅ **About & Contact Pages** - Brand story and contact information

### 🎨 Design System ("Editorial Hawaii")

- **Typography:** Fraunces (serif display) + Inter (sans-serif body)  
- **Colors:** Sand warm ivory, ink charcoal, lagoon mint, coral accent
- **Layout:** 12-col grid responsive (375→1440px), hairline borders only

### 📱 Responsive Breakpoints

| Screen Size | Columns | Layout Style |
|-------------|---------|---|
| Mobile      | 1 col   | Stacked vertical layouts |  
| Tablet      | 2/3 cols| Hybrid grid systems |  
| Desktop     | Full col| Editorial horizontal grids |  

---

## ⚙️ Dependencies & Installation

```bash
# Navigate to project directory
cd /Users/nguyenngoctrantien/AI_dsh/WebLiseaMade

# Install dependencies using npm or pnpm
pnpm install           # Recommended - faster installs  
npm install            # Alternative - standard npm

# Verify build (optional)
pnpm run build         # Check TypeScript compilation
```

### 📦 Core Dependencies

```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.x", 
  "tailwindcss": "^4.x"
}
```

---

## 🏗️ File Structure

```
WebLiseaMade/
├── src/
│   ├── components/
│   │   ├── catalog/             # FilterChips, SortPicker, SearchField, AutoLayoutFilterBar
│   │   ├── product/             # ProductCard, ProductImage com
ponents
│   │   ├── ui/                  # Button, Badge, Price, Rating icons  
│   │   └── layout/              # Header, Footer components  
│   ├── pages/                   # CatalogPage, CartPage, Checkout, etc.
│   ├── hooks/
│   │   └── useCatalogQuery.ts   # Filter/sort/search state management
│   ├── lib/
│   │   ├── catalog.ts           # Filter logic, sort functions  
│   │   ├── format.ts            # Currency formatting helper
│   │   └── orders.test.ts       # Unit tests for order calculations
│   ├── data/
│   │   ├── products.ts          # Product data with image placeholders
│   │   └── categories.ts        # Category definitions (Áo, Váy, Set)
│   ├── types.ts                 # TypeScript type declarations  
│   └── App.tsx                  # React Router setup with layout wrapper  
├── public/                      # Static assets and hero images
├── tailwind.config.ts           # Tailwind v4 config with color tokens
└── README.md                    # This documentation file
```

---

## 🔗 Route Mapping Table

| Route | Component | File Path | Description |
|-------|-----------|-----------|---|
| `/` | HomePage | `src/pages/HomePage.tsx` | Homepage with hero + featured products |  
| `/san-pham` | CatalogPage | `src/pages/CatalogPage.tsx` | Main catalog/filtering page |
| `/san-pham/:slug` | ProductDetailPage | `src/pages/ProductDetailPage.tsx` | Single product detail view |
| `/gio-hang` | CartPage | `src/pages/CartPage.tsx` | Shopping cart management |  
| `/thanh-toan` | CheckoutPage | `src/pages/CheckoutPage.tsx` | Payment checkout form |
| `/dat-hang-thanh-cong` | OrderSuccessPage | `src/pages/OrderSuccessPage.tsx` | Order confirmation page |
| `/tra-cuu-don` | OrderLookupPage | `src/pages/OrderLookupPage.tsx` | Order tracking by code |  
| `/gioi-thieu` | AboutPage | `src/pages/AboutPage.tsx` | Brand story/about |
| `/lien-he` | ContactPage | `src/pages/ContactPage.tsx` | Contact information form |

---

## 🎨 Design System Tokens

### Color Palette

```css
/* Sand - warm ivory neutrals */
sand-50:  #fbf8f1    /* Background page */
sand-100: #f6f2e9    /* Surface cards/badges */  
sand-200: #ece6da    /* Border hairline default */
sand-300: #ddd4c3    /* Input borders strong */
sand-900: #3e3629    /* Notice text */

/* Ink - warm charcoal */
ink-500:  #6f6b65    /* Muted labels */
ink-700:  #3d3a36    /* Secondary text */
ink-900:  #1c1a18    /* Primary text & buttons */

/* Lagoon - mint accent */
lagoon-600: #41605a   /* Focus outline */
lagoon-700: #314945   /* Link hover states */

/* Coral - brick accent */
coral-50:  #faf5f2    /* Warning backgrounds */
coral-700: #7c4c3e    /* Price colors/errors */
```

### Typography Mapping

| Style Name | Font Family | Size(px) | Tracking | Usage |
|------------|-------------|----------|----------|-------|
| Display/LG | Fraunces Regular | 44px | -0.02em | Page h1 /san-pham |  
| Display/XL| Fraunces Regular | 64px | -0.03em | Home hero title | 
| Display/SM| Fraunces Regular | 22px | -0.01em | Card product name |
| Eyebrow   | Inter Medium | 11px | +0.22em | Category chips/badges |

### Shape Properties

| Property | Value(px) | Elements using this radius |  
|----------|-----------|-------------------------------| 
| hair      | 2         | Buttons, inputs, product cards |
| card      | 4         | Cart lines, summary boxes |  

---

## 🧩 Component Reference

### ProductCard Component API

```tsx
<ProductCard 
  product={{ id: "xxx", name: "...", price: ..., category: ... }}  
  priority={true}              // Above-the-fold loading
/>
```

**Layout structure:**
- Image area `aspect-[4/5]` with duotone gradient if placeholder
- Top-left badges for product status (Bán chạy, Mới)
- Text block padding x20/y16 gap 12:
  - Category eyebrow + product Display/SM name  
  - ShortDescription clamp-2 line  
  - Rating with star icons and review count  
  - Price in tabular numerics

### Filter Bar Layout (Farfetch Style)

```tsx
<AutoLayoutFilterBar query={query} className="p-6">
  {/* Categories: Áo · Váy · Set ... */}
  <Link to="/san-pham?nhom=category">Áo ({count})</Link>  
  <SortPicker> /* Nổi bật | Giá thấp→cao | Đánh giá */ </SortPicker>
</AutoLayoutFilterBar>
```

### SearchField Component

```tsx
<SearchField className="max-w-[340px]" onQueryChange={(value) => {}} />
```

**Luxury styling:**
- Minimal border bg-sand-100/85 (glassmorphism effect)  
- Icon left subtle opacity-50 tracking uppercase text  
- Label disappears/reduces when input has value  

### SortPicker Component Behavior

| State | Style Characteristics |
|-------|----------------------|---|
| Active | Fill sand-50 + border sand-300/active | 
| Inactive | Opaque 70%, italic tracking text |  
| Hover | Smooth 280ms transition duration |  

---

## 📊 Unit Testing

Run unit tests for order calculations and filter logic:

```bash
# Run all tests in project
pnpm run test           # ViTest/Jest runs catalog orders tests   
pnpm test --watch       # Live reload mode during development
```

**Target coverage:** Orders library > 80% line coverage.

---

## 🎨 Product Image Placeholders

When real images aren't available, use duotone gradients:

```css
background-color: linear-gradient(135deg, 
  #ece6da 0%,        /* from */  
  #c8bfa9 100%)      /* to - sand palette */
;
```

**Palette variations:**
- Sand: `#ece6da → #c8bfa9` · ink `{#574d3c}` (2 colors)
- Lagoon: `#e7ede8 → #c3d2c8` · `{#314945}`
- Coral: `#f4eae4 → #e0cfc4` · `{#61392f}`

Include "Ảnh minh họa" label in bottom-left corner (Eyebrow, border 15% opacity)

---

## 📺 Image Asset Locations

Product images for shop.tiktok:

```
public/shop-tiktok/
├── hero.jpg                   # Main hero image (278KB)
├── hero_fit.jpg              # Fitted hero version
├── cat1-jc12.jpg             # Category gallery products  
├── feat1-3.jpg               # Featured products showcase
├── feedback1-2.jpg           # Social proof images  
├── life1-4*.jpg              # Lifestyle content shots
└── look1-4.jpg               # Lookbook style images
```

---

## 📜 License & Attributions

**© 2026 LiseaMade** — Thời trang & phụ kiện Hawaii Summer  

All rights reserved. Trade mark and brand identity belong to LiseaMade LLC, Vietnam.  

---

<div align="center">
  Made with ❤️ in Ho Chi Minh City · Code by Tien Nguyen (@tnguyentien01)
</div>
