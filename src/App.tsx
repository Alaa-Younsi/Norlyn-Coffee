import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Landing } from "@/pages/Landing";
import { Shop } from "@/pages/Shop";
import { Product } from "@/pages/Product";
import { Checkout } from "@/pages/Checkout";
import { OrderConfirmation } from "@/pages/OrderConfirmation";
import { NotFound } from "@/pages/NotFound";
import { trackPageView } from "@/lib/pixel";

// admin never ships to shoppers
const AdminApp = lazy(() =>
  import("@/pages/admin/AdminApp").then((m) => ({ default: m.AdminApp })),
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * SPA route-change PageView. Value-compared ref (not a boolean flag) so
 * StrictMode's dev double-invoke can't double-fire; the base snippet already
 * tracked the initial full-document load; /admin/* is staff traffic.
 */
function PixelPageView() {
  const { pathname } = useLocation();
  const prevPathname = useRef<string | null>(null);
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    const isFirstRender = prevPathname.current === null;
    prevPathname.current = pathname;
    if (isFirstRender || pathname.startsWith("/admin")) return;
    trackPageView();
  }, [pathname]);
  return null;
}

function StoreLayout() {
  return (
    <>
      <Header />
      <CartDrawer />
      <Outlet />
      <Footer />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <PixelPageView />
      <Routes>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
