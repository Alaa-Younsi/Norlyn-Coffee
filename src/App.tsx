import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { MetaPixelProvider } from "@/components/MetaPixelProvider";
import { Landing } from "@/pages/Landing";
import { Shop } from "@/pages/Shop";
import { Product } from "@/pages/Product";
import { About } from "@/pages/About";
import { Journal } from "@/pages/Journal";
import { Article } from "@/pages/Article";
import { Contact } from "@/pages/Contact";
import { Checkout } from "@/pages/Checkout";
import { OrderConfirmation } from "@/pages/OrderConfirmation";
import { NotFound } from "@/pages/NotFound";

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
      {/* inside the router (it reads the route), outside the pages (it owns
          PageView for all of them) */}
      <MetaPixelProvider>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/about" element={<About />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/:slug" element={<Article />} />
            <Route path="/contact" element={<Contact />} />
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
      </MetaPixelProvider>
    </BrowserRouter>
  );
}
