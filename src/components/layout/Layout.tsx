import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

/**
 * Luxury editorial layout with backdrop-blur for modal/overlay aesthetics.
 */
export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-hair focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-xs focus:tracking-[0.08em] focus:text-sand-50"
      >
        Bỏ qua tới nội dung chính
      </a>
      <Header />
      <main id="noi-dung" className="flex-1 animate-reveal-up backdrop-blur-[1px]/10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
