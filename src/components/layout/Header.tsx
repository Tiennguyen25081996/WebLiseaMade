import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { SITE } from "@/data/site";
import { useCart } from "@/context/cart-context";
import { CartIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/san-pham", label: "Sản phẩm" },
  { to: "/gioi-thieu", label: "Giới thiệu" },
  { to: "/lien-he", label: "Liên hệ" },
];

/**
 * Header bar editorial: hairline, micro-tracking, underline reveal.
 * Tích hợp dynamic blur khi scroll và badge-pop animation.
 */
export function Header() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
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
      className={`sticky top-0 z-40 transition-all duration-500 ease-editorial ${
        scrolled
          ? "border-b border-sand-200/90 bg-sand-50/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(28,26,24,0.04)]"
          : "border-b border-transparent bg-sand-50/60 backdrop-blur-sm"
      }`}
    >
      <div className="container-page flex h-16 items-center gap-6">
        <Link
          to="/"
          className="font-display text-lg tracking-[0.01em] text-ink-900 transition-opacity hover:opacity-85"
        >
          {SITE.brand}
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `underline-reveal text-xs font-medium tracking-[0.1em] ${
                  isActive ? "text-ink-900" : "text-ink-500 hover:text-ink-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <Link
            to="/gio-hang"
            className="tap-feedback relative p-2 text-ink-700 transition-colors hover:text-ink-900"
            aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
          >
            <CartIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span
                key={itemCount}
                className="absolute -top-0.5 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink-900 px-1 text-2xs font-medium tabular-nums text-sand-50 animate-badge-pop shadow-sm"
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-ink-700 md:hidden"
            aria-expanded={open}
            aria-controls={open ? "menu-di-dong" : undefined}
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="menu-di-dong"
          className="border-t-1 border-sand-200 bg-sand-50 md:hidden animate-mask-wipe"
          aria-label="Điều hướng di động"
        >
          <ul className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block py-3 text-xs font-medium tracking-[0.1em] ${
                      isActive ? "text-ink-900" : "text-ink-500"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
