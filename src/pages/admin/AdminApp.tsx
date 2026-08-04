import { Route, Routes } from "react-router-dom";
import { AdminLogin } from "./AdminLogin";
import { AdminLayout } from "./AdminLayout";
import { Dashboard } from "./Dashboard";
import { AdminProducts } from "./Products";
import { ProductForm } from "./ProductForm";
import { AdminCategories } from "./Categories";
import { AdminOrders } from "./Orders";
import { AdminOrderDetail } from "./OrderDetail";
import { AdminDeliveryPrices } from "./DeliveryPrices";
import { AdminReviews } from "./Reviews";
import { AdminSettings } from "./Settings";
import { AdminAccount } from "./Account";
import { AdminTeam } from "./Team";
import { AdminPixels } from "./Pixels";
import { AdminContent } from "./Content";
import { AdminArticles } from "./Articles";
import { AdminMessages } from "./Messages";
import { AdminFinance } from "./Finance";
import { AdminStoreLedger } from "./StoreLedger";

/** Lazy-loaded as one chunk — admin code never ships to shoppers. */
export function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="delivery" element={<AdminDeliveryPrices />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="articles" element={<AdminArticles />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="finance" element={<AdminFinance />} />
        <Route path="store" element={<AdminStoreLedger />} />
        <Route path="pixels" element={<AdminPixels />} />
        <Route path="team" element={<AdminTeam />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="account" element={<AdminAccount />} />
      </Route>
    </Routes>
  );
}
