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
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
