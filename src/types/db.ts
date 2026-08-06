export type ProductStatus = "active" | "draft";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type DeliveryType = "home" | "office";
/**
 * FR is the source language: every localized column exists as `*_fr` / `*_ar`,
 * and EN has no column of its own yet. `pickLang` in lib/localized.ts resolves
 * that — add a `*_en` column and pass it as the 4th argument to light it up.
 */
export type Lang = "fr" | "ar" | "en";

export interface Category {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  details_fr: string[];
  details_ar: string[];
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  stock: number;
  style_code: string | null;
  intensity: number | null;
  dosage: string | null;
  accent_color: string | null;
  colors: string[];
  sizes: string[];
  video_url: string | null;
  featured: boolean;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  wilaya: string;
  city: string;
  address: string | null;
  notes: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  language: Lang;
  delivery_type: DeliveryType;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name_fr: string;
  name_ar: string;
  price: number;
  quantity: number;
  color: string | null;
  size: string | null;
  image_url: string | null;
  /** Buy price frozen at sale time (0006) — margin must never re-join live. */
  unit_cost?: number;
}

export interface StoreSettings {
  id: number;
  shipping_fee: number;
  free_ship_threshold: number | null;
}

export interface DeliveryPrice {
  id: string;
  wilaya: string;
  home_price: number;
  office_price: number;
  active: boolean;
  updated_at: string;
}

export interface ClientReview {
  id: string;
  client_name: string;
  stars: number;
  review_text: string;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

/* ------------------------------------------------ staff accounts (0004) */

export interface AdminProfile {
  user_id: string;
  email: string | null;
  is_owner: boolean;
  sections: string[];
  active: boolean;
  created_at: string;
}

/* --------------------------------------------------- meta pixels (0005) */

export type PixelScope = "all" | "paths" | "products" | "landing";

export type PixelEventKey =
  | "page_view"
  | "view_content"
  | "add_to_cart"
  | "initiate_checkout"
  | "purchase"
  | "lead"
  | "search";

export interface MetaPixel {
  id: string;
  label: string;
  pixel_id: string;
  active: boolean;
  scope: PixelScope;
  match_values: string[];
  events: Partial<Record<PixelEventKey, boolean>>;
  test_event_code: string | null;
  currency: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------ business suite (0006) */

export type LedgerScope = "online" | "store";
export type StoreItemKind = "product" | "service";
export type PaymentMethod = "cash" | "card" | "transfer" | "other";
export type ExpenseCategory =
  | "rent"
  | "salary"
  | "marketing"
  | "delivery"
  | "supplies"
  | "utilities"
  | "other";

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export interface ProductCost {
  product_id: string;
  cost_price: number;
  supplier_id: string | null;
  notes: string | null;
  updated_at: string;
}

export interface StoreProduct {
  id: string;
  name: string;
  kind: StoreItemKind;
  sku: string | null;
  category: string | null;
  cost_price: number;
  price: number;
  stock: number;
  supplier_id: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockPurchase {
  id: string;
  scope: LedgerScope;
  product_id: string | null;
  store_product_id: string | null;
  label: string | null;
  supplier_id: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  purchased_at: string;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  scope: LedgerScope;
  label: string;
  category: ExpenseCategory;
  amount: number;
  spent_at: string;
  supplier_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface StoreSaleItem {
  id: string;
  sale_id: string;
  store_product_id: string | null;
  name: string;
  kind: StoreItemKind;
  unit_price: number;
  unit_cost: number;
  quantity: number;
  line_total: number;
}

export interface StoreSale {
  id: string;
  sale_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  cost_total: number;
  payment_method: PaymentMethod;
  sold_at: string;
  notes: string | null;
  created_at: string;
  store_sale_items?: StoreSaleItem[];
}

/* ------------------------------------------------- site content (0007) */

export type SlideKind = "image" | "video";
export type SlidePlacement = "hero" | "gallery";

export interface MediaSlide {
  id: string;
  kind: SlideKind;
  url: string;
  poster_url: string | null;
  title_fr: string | null;
  title_ar: string | null;
  subtitle_fr: string | null;
  subtitle_ar: string | null;
  link_url: string | null;
  placement: SlidePlacement;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteImage {
  slot: string;
  url: string;
  alt_fr: string | null;
  alt_ar: string | null;
  updated_at: string;
}

export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  slug: string;
  title_fr: string;
  title_ar: string;
  excerpt_fr: string | null;
  excerpt_ar: string | null;
  body_fr: string | null;
  body_ar: string | null;
  cover_url: string | null;
  tag_fr: string | null;
  tag_ar: string | null;
  author: string | null;
  read_minutes: number;
  featured: boolean;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageStatus = "new" | "read" | "archived";

export interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: MessageStatus;
  created_at: string;
}

export type SubscriberStatus = "subscribed" | "unsubscribed";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  /** where the signup came from — 'site' for the footer form */
  source: string;
  created_at: string;
  unsubscribed_at: string | null;
}

/** Minimal payload returned by the get_order_by_number RPC (guest-safe). */
export interface GuestOrder {
  order_number: string;
  customer_name: string;
  wilaya: string;
  city: string;
  delivery_type: DeliveryType;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  items: Array<{
    name_fr: string;
    name_ar: string;
    price: number;
    quantity: number;
    image_url: string | null;
  }>;
}
