import {
  AtSign,
  BarChart3,
  FolderTree,
  Image,
  LayoutDashboard,
  Mail,
  Newspaper,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Target,
  Truck,
  UserCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

/**
 * One source of truth for the admin sidebar, the route→section map, and the
 * owner's grant checklist.
 *
 * ⚠ KEEP IN SYNC — three lists, and a mismatch fails SILENTLY:
 *   1. the `key`s below
 *   2. the has_section('…') strings in supabase/migrations/0004, 0006, 0007, 0010
 *   3. ALLOWED_SECTIONS in supabase/functions/create-worker/index.ts
 * A key in the nav but missing from the whitelist is granted in the UI and
 * dropped on save — the worker sees a nav item that redirects.
 */
export interface AdminSection {
  key: string;
  route: string;
  exact?: boolean;
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** visible to every admin — no grant needed (overview, global config, own account) */
  always?: boolean;
  /** only the owner */
  ownerOnly?: boolean;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { key: "dashboard", route: "/admin", exact: true, labelKey: "admin.nav.dashboard", icon: LayoutDashboard, always: true },
  { key: "orders", route: "/admin/orders", labelKey: "admin.nav.orders", icon: ShoppingCart },
  { key: "products", route: "/admin/products", labelKey: "admin.nav.products", icon: Package },
  { key: "categories", route: "/admin/categories", labelKey: "admin.nav.categories", icon: FolderTree },
  { key: "delivery", route: "/admin/delivery", labelKey: "admin.nav.delivery", icon: Truck },
  { key: "reviews", route: "/admin/reviews", labelKey: "admin.nav.reviews", icon: Star },
  { key: "content", route: "/admin/content", labelKey: "admin.nav.content", icon: Image },
  { key: "articles", route: "/admin/articles", labelKey: "admin.nav.articles", icon: Newspaper },
  { key: "messages", route: "/admin/messages", labelKey: "admin.nav.messages", icon: Mail },
  { key: "newsletter", route: "/admin/newsletter", labelKey: "admin.nav.newsletter", icon: AtSign },
  { key: "finance", route: "/admin/finance", labelKey: "admin.nav.finance", icon: BarChart3 },
  { key: "store", route: "/admin/store", labelKey: "admin.nav.store", icon: Store },
  { key: "pixels", route: "/admin/pixels", labelKey: "admin.nav.pixels", icon: Target },
  { key: "team", route: "/admin/team", labelKey: "admin.nav.team", icon: ShieldCheck, ownerOnly: true },
  { key: "settings", route: "/admin/settings", labelKey: "admin.nav.settings", icon: Settings, always: true },
  { key: "account", route: "/admin/account", labelKey: "admin.nav.account", icon: UserCog, always: true },
];

/** What the owner can tick for a worker. */
export const GRANTABLE_SECTIONS = ADMIN_SECTIONS.filter((s) => !s.always && !s.ownerOnly);

/**
 * Resolve a pathname to its section key. The exact `/admin` overview is tried
 * first, then the LONGEST matching route prefix — otherwise `/admin` shadows
 * everything as a prefix and `/admin/products/new` never maps to `products`.
 */
export function routeToSection(pathname: string): AdminSection | undefined {
  const clean = pathname.replace(/\/+$/, "") || "/admin";
  const exact = ADMIN_SECTIONS.find((s) => s.exact && s.route === clean);
  if (exact) return exact;

  return ADMIN_SECTIONS.filter((s) => !s.exact)
    .filter((s) => clean === s.route || clean.startsWith(`${s.route}/`))
    .sort((a, b) => b.route.length - a.route.length)[0];
}
