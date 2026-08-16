import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { MetaPixelProvider } from "@/components/MetaPixelProvider";
/*
  What ships in the FIRST download, and what waits to be asked for.

  Eager: the buying path. Landing → Shop → Product → Checkout is the route this
  store exists to serve, and it is walked on mobile data in Algeria — putting a
  network round trip between a shopper and the next step of a purchase to save
  a few kilobytes is the wrong trade every time. They stay in the entry chunk.

  Lazy: everything a shopper reaches deliberately or not at all. The journal,
  the about page, contact, the confirmation screen and the 404 were all being
  parsed by every single visitor who landed on the home page and never went
  anywhere near them.
*/
import { Landing } from "@/pages/Landing";
import { Shop } from "@/pages/Shop";
import { Product } from "@/pages/Product";
import { Checkout } from "@/pages/Checkout";

const About = lazy(() => import("@/pages/About").then((m) => ({ default: m.About })));
const Journal = lazy(() => import("@/pages/Journal").then((m) => ({ default: m.Journal })));
const Article = lazy(() => import("@/pages/Article").then((m) => ({ default: m.Article })));
const Contact = lazy(() => import("@/pages/Contact").then((m) => ({ default: m.Contact })));
const OrderConfirmation = lazy(() =>
  import("@/pages/OrderConfirmation").then((m) => ({ default: m.OrderConfirmation })),
);
const NotFound = lazy(() => import("@/pages/NotFound").then((m) => ({ default: m.NotFound })));

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
      {/* Inside the store layout, not the router root: /admin is a tool its
          operator opens dozens of times a day, and a brand curtain in front of
          a spreadsheet is a delay, not a welcome. */}
      <SplashScreen />
      <Header />
      <CartDrawer />
      {/* The fallback is a full-height blank, not a spinner. These chunks are
          tens of kilobytes and usually arrive within a frame or two, so a
          spinner would mostly render as a flash of one — but the height has to
          be reserved either way, or the footer jumps up under the header and
          then back down as the page lands. */}
      <Suspense fallback={<div className="min-h-screen" />}>
        <Outlet />
      </Suspense>
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
