/**
 * Mobile-only layout wrapper — Luxury Couture Navigation (Jacquemus / Loewe / Khaite aesthetic)
 * Khớp chuẩn Figma (109:403 Header + 109:405 Footer) với motion tokens & couture micro-interactions.
 */
import { useState, useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { SITE } from "@/data/site";
import { useCart } from "@/context/cart-context";

function MobileHeader() {
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 h-16 flex-none transition-all duration-500 ease-editorial ${
        scrolled
          ? "border-b border-sand-200/90 bg-sand-50/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(28,26,24,0.04)]"
          : "border-b border-transparent bg-sand-50/60 backdrop-blur-sm"
      }`}
      aria-label="Menu di động"
    >
      <nav className="flex items-center justify-between h-full w-full max-w-[390px] mx-auto px-5">
        <Link 
          to="/"
          className="tap-feedback font-display text-lg tracking-[0.04em] font-normal text-ink-900 hover:opacity-80 transition-opacity focus-visible:outline-1 focus-visible:outline-lagoon-600 rounded-hair px-2 py-1"
          aria-label="Trang chủ LiseaMade"
        >
          {SITE.brand}
        </Link>
        <Link 
          to="/gio-hang" 
          className="tap-feedback relative min-w-[44px] min-h-[44px] flex items-center justify-center text-ink-700 hover:text-ink-900 rounded-hair transition-colors" 
          aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
        >
          {/* Couture Cart Icon */}
          <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          {itemCount > 0 && (
            <span
              key={itemCount}
              className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink-900 px-1 text-[10px] font-medium text-sand-50 shadow-sm animate-badge-pop tabular-nums"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}

// Couture Icons for Bottom Navigation
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function ProductIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.614A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 0c.315.207.676.335 1.06.375" />
    </svg>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function SearchDocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function ContactIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Trang chủ", icon: HomeIcon },
  { to: "/san-pham", label: "Sản phẩm", icon: ProductIcon },
  { to: "/gio-hang", label: "Giỏ hàng", icon: BagIcon },
  { to: "/tra-cuu-don", label: "Tra cứu", icon: SearchDocIcon },
  { to: "/lien-he", label: "Liên hệ", icon: ContactIcon },
];

function MobileFooter() {
  const { itemCount } = useCart();

  return (
    <footer className="sticky bottom-0 inset-x-0 h-16 luxury-glass border-t border-sand-200/60 max-w-[390px] mx-auto px-2 z-50 flex items-center justify-between" aria-label="Điều hướng chính di động">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isCart = item.to === "/gio-hang";

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `tap-feedback relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] py-1 transition-all duration-300 ease-editorial ${
                isActive
                  ? "text-ink-900 font-medium"
                  : "text-ink-500 hover:text-ink-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center">
                  <Icon className={`h-5 w-5 transition-transform duration-300 ease-editorial ${isActive ? "scale-110 stroke-[1.8]" : "stroke-[1.3]"}`} />
                  {isCart && itemCount > 0 && (
                    <span
                      key={itemCount}
                      className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-coral-700 px-1 text-[9px] font-bold text-sand-50 tabular-nums animate-badge-pop shadow-sm"
                    >
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </div>
                <span className={`mt-1 text-[10px] tracking-[0.06em] leading-none ${isActive ? "text-ink-900 font-semibold" : "text-ink-500"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 h-[2px] w-4 rounded-full bg-ink-900 animate-fade-in-slow" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </footer>
  );
}

function LayoutMobileWrapper() {
  return (
    <section className="mobile-layout min-h-screen flex flex-col bg-sand-50 w-full" aria-label="Nội dung di động">
      <MobileHeader />
      
      {/* Mobile content container — Figma frame max-width 390px */}
      <main id="nout-content-mobile" className="flex-1 w-full max-w-[390px] mx-auto px-3 pb-20 md:hidden">
        <Outlet />
      </main>

      <MobileFooter />
      
      {/* Accessibility: skip navigation link */}
      <a href="#nout-content-mobile" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:bg-ink-900 focus:text-sand-50 focus:px-3 focus:py-2 focus:rounded-hair focus:text-xs tracking-tight"
        id="skip-link">
        Bỏ qua tới nội dung chính
      </a>
    </section>
  );
}

export { LayoutMobileWrapper };