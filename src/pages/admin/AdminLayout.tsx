import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Sun,
  Truck,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dir } = useLanguage();

  useEffect(() => {
    if (!loading && !session) navigate("/admin/login", { replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) return null;

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-line bg-panel lg:block">
        <SidebarContent onSignOut={() => void signOut()} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-line bg-panel px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-1 cursor-pointer" aria-label="menu">
            <Menu size={20} />
          </button>
          <img src="/images/norlyn-logo.webp" alt="Norlyn" className="norlyn-logo h-7 w-auto" />
          <QuickToggles />
        </div>
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              className="absolute inset-0 h-full w-full bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-label="close"
            />
            <motion.aside
              className="absolute top-0 h-full w-72 border-e border-line bg-panel start-0"
              // physical offsets don't auto-flip with dir — branch explicitly
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "tween", duration: 0.28 }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 p-1 end-4 cursor-pointer"
                aria-label="close"
              >
                <X size={18} />
              </button>
              <SidebarContent onSignOut={() => void signOut()} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickToggles() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
        className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold cursor-pointer"
      >
        {lang === "fr" ? "ع" : "FR"}
      </button>
      <button onClick={toggleTheme} className="rounded-full border border-line p-1.5 cursor-pointer" aria-label="theme">
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </div>
  );
}

function SidebarContent({
  onSignOut,
  onNavigate,
}: {
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  const { t } = useLanguage();

  const links = [
    { to: "/admin", end: true, icon: LayoutDashboard, label: t("admin.nav.dashboard") },
    { to: "/admin/products", icon: Package, label: t("admin.nav.products") },
    { to: "/admin/categories", icon: FolderTree, label: t("admin.nav.categories") },
    { to: "/admin/orders", icon: ShoppingCart, label: t("admin.nav.orders") },
    { to: "/admin/delivery", icon: Truck, label: t("admin.nav.delivery") },
    { to: "/admin/reviews", icon: Star, label: t("admin.nav.reviews") },
    { to: "/admin/settings", icon: Settings, label: t("admin.nav.settings") },
  ];

  return (
    <div className="flex h-full flex-col p-5">
      <img src="/images/norlyn-logo.webp" alt="Norlyn Coffee" className="norlyn-logo h-9 w-auto self-start" />
      <nav className="mt-8 flex-1 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-brand/12 font-semibold text-brand"
                  : "text-muted hover:bg-panel-2 hover:text-ink",
              )
            }
          >
            <link.icon size={17} strokeWidth={1.8} />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-line pt-4">
        <div className="flex items-center justify-between px-1">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-brand transition-colors"
          >
            <Store size={15} />
            {t("admin.nav.viewStore")}
          </Link>
          <QuickToggles />
        </div>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-muted hover:bg-panel-2 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          {t("admin.nav.logout")}
        </button>
      </div>
    </div>
  );
}
