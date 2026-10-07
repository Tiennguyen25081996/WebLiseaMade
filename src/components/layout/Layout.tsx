import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { LayoutMobileWrapper } from "./LayoutMobile";

export function Layout() {
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return <LayoutMobileWrapper />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-sand-50 text-ink-900">
      <Header />
      <main className="flex-1 animate-reveal-up container-page">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
