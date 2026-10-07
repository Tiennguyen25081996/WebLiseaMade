/**
 * App — Mobile Desktop Responsive Routing with Layout Wrapper
 * - Layout handles viewport < 768px → render LayoutMobileWrapper (mobile menu)  
 * - Desktop view ≥ 768px → render Outlet + simple header without mobile menu
 */

import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";

// Page components are rendered inside Layout which handles responsive switch
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderLookupPage from "./pages/OrderLookupPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      {/* ALL routes wrapped in Layout for mobile/desktop switching */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/san-pham" element={<CatalogPage />} />
        <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
        <Route path="/gio-hang" element={<CartPage />} />
        <Route path="/thanh-toan" element={<CheckoutPage />} />
        <Route path="/dat-hang-thanh-cong" element={<OrderSuccessPage />} />
        <Route path="/tra-cuu-don" element={<OrderLookupPage />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/lien-he" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
