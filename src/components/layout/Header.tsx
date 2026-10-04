import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { SITE } from "@/data/site";
import { useCart } from "@/context/cart-context";
import { CartIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/san-pham", label: "Sản phẩm" },
  { to: "/gioi-thieu", label: "Giới thiệu" },
  { to: "/lien-he", label: "Liên hệ" },
];

/** Header dùng chung: điều hướng, tìm kiếm nhanh và badge giỏ hàng. */
export function Header() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="font-display text-xl font-bold text-lagoon-800">
          {SITE.brand}
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "bg-lagoon-100 text-lagoon-800" : "text-ink-700 hover:bg-sand-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/gio-hang"
            className="relative rounded-full p-2 text-ink-700 hover:bg-sand-100"
            aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
          >
            <CartIcon className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-600 px-1 text-xs font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-ink-700 hover:bg-sand-100 md:hidden"
            aria-expanded={open}
            aria-controls="menu-di-dong"
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="menu-di-dong"
          className="border-t border-sand-200 bg-white md:hidden"
          aria-label="Điều hướng di động"
        >
          <ul className="container-page flex flex-col py-2">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-3 text-sm font-semibold ${
                      isActive ? "bg-lagoon-50 text-lagoon-800" : "text-ink-700"
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
