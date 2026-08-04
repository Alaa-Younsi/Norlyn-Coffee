import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, Moon, ShieldAlert, Store, Sun, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { ADMIN_SECTIONS, routeToSection } from "@/lib/adminSections";
import type { AdminSection } from "@/lib/adminSections";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const { session, loading, signOut } = useAuth();
  const { isOwner, isActive, isLoading: profileLoading, hasSection } = useAdminProfile(
    session?.user.id,
  );
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { dir, t } = useLanguage();
  // The drawer remembers WHICH route it was opened from, so a route change
  // closes it by derivation instead of by a setState-in-effect (a redirect or
  // the back button changes the route with no click to hook into).
  const [openedFrom, setOpenedFrom] = useState<string | null>(null);
  const mobileOpen = openedFrom === pathname;
  const setMobileOpen = useCallback(
    (open: boolean) => setOpenedFrom(open ? pathname : null),
    [pathname],
  );
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading && !session) navigate("/admin/login", { replace: true });
  }, [loading, session, navigate]);

  // The scrolling element is <main>, not the window, so a global ScrollToTop
  // can't reach it — reset explicitly or every route change lands mid-page.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  /* ---- drawer: also close on Escape and at the lg breakpoint (it's
         lg:hidden, so a resize would otherwise strand it open with the
         scroll-lock applied to an invisible drawer) ---- */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const media = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = () => setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    media.addEventListener("change", onBreakpoint);
    return () => {
      window.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onBreakpoint);
    };
  }, [mobileOpen, setMobileOpen]);

  // Scroll-lock with position:fixed, NOT overflow:hidden — on iOS Safari the
  // latter doesn't stop the visual viewport rubber-banding under a touch-drag,
  // which drags the fixed drawer out of sync with real screen coordinates: a
  // tap that visually lands on X misses it and only a reload recovers.
  useEffect(() => {
    if (!mobileOpen) return;
    const scrollY = window.scrollY;
    const { body } = document;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [mobileOpen]);

  const canAccess = useCallback(
    (section: AdminSection) => {
      if (section.ownerOnly) return isOwner;
      if (section.always) return true;
      return hasSection(section.key);
    },
    [isOwner, hasSection],
  );

  const visibleSections = useMemo(
    () => ADMIN_SECTIONS.filter(canAccess),
    [canAccess],
  );

  // Hold the loading screen while the profile is still resolving, or the first
  // render has no grants yet and bounces a legitimate worker.
  if (loading || !session || (session && profileLoading)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg text-sm text-muted">
        {t("common.loading")}
      </div>
    );
  }

  // No profile row, or a deactivated worker: an explicit screen WITH a sign-out
  // button — never an empty dashboard and never a redirect loop.
  if (!isActive) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <ShieldAlert size={44} className="text-brand" strokeWidth={1.4} />
        <h1 className="font-display text-2xl">{t("admin.access.denied")}</h1>
        <p className="max-w-sm text-sm text-muted">{t("admin.access.deniedBody")}</p>
        <button
          onClick={() => void signOut()}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2 text-sm cursor-pointer hover:border-brand"
        >
          <LogOut size={15} />
          {t("admin.nav.logout")}
        </button>
      </div>
    );
  }

  // Guard direct-URL access with the same predicate the nav uses. The dashboard
  // is `always`, so the redirect target can never itself be forbidden.
  const current = routeToSection(pathname);
  if (current && !canAccess(current)) return <Navigate to="/admin" replace />;

  return (
    // h-dvh + overflow-hidden, NOT min-h-screen: with a scrolling window a
    // 300-row orders table drags the whole sidebar up out of view.
    <div className="flex h-dvh overflow-hidden bg-bg">
      <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-e border-line bg-panel p-5 lg:flex">
        <SidebarContent
          sections={visibleSections}
          onSignOut={() => void signOut()}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-line bg-panel px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="-m-2 p-2 cursor-pointer"
            aria-label="menu"
          >
            <Menu size={20} />
          </button>
          <img src="/images/norlyn-logo.webp" alt="Norlyn" className="norlyn-logo h-7 w-auto" />
          <QuickToggles />
        </div>
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
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
              aria-label={t("common.close")}
            />
            <motion.aside
              className="absolute top-0 flex h-full w-72 flex-col overflow-hidden border-e border-line bg-panel p-5 start-0"
              // physical offsets don't auto-flip with dir — branch explicitly
              initial={{ x: dir === "rtl" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: dir === "rtl" ? "100%" : "-100%" }}
              transition={{ type: "tween", duration: 0.28 }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 -m-2 p-2 end-4 cursor-pointer"
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
              <SidebarContent
                sections={visibleSections}
                onSignOut={() => void signOut()}
                onNavigate={() => setMobileOpen(false)}
              />
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
      <button
        onClick={toggleTheme}
        className="rounded-full border border-line p-1.5 cursor-pointer"
        aria-label="theme"
      >
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </div>
  );
}

/**
 * MODULE SCOPE, never inside AdminLayout's render body. Declared in the parent
 * it gets a new function identity every render, so React remounts the whole
 * drawer subtree on each re-render — and a touch tap only fires a `click` when
 * pointerdown and pointerup land on the SAME element. Any incidental re-render
 * mid-tap (auth refresh, a query refetch) then swallows the close button.
 */
function SidebarContent({
  sections,
  onSignOut,
  onNavigate,
}: {
  sections: AdminSection[];
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <img
        src="/images/norlyn-logo.webp"
        alt="Norlyn Coffee"
        className="norlyn-logo h-9 w-auto shrink-0 self-start"
      />

      {/* the scrollbar belongs to the LINKS alone: on <aside> it would scroll
          the wordmark and the footer (sign-out) out of reach. min-h-0 is the
          whole trick — a flex child defaults to min-height:auto and refuses to
          shrink below its content. */}
      <nav className="mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {sections.map((section) => (
          <NavLink
            key={section.key}
            to={section.route}
            end={section.exact}
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
            <section.icon size={17} strokeWidth={1.8} />
            {t(section.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 shrink-0 space-y-2 border-t border-line pt-4">
        <div className="flex items-center justify-between px-1">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-brand"
          >
            <Store size={15} />
            {t("admin.nav.viewStore")}
          </Link>
          <QuickToggles />
        </div>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-panel-2 hover:text-red-600 cursor-pointer"
        >
          <LogOut size={15} />
          {t("admin.nav.logout")}
        </button>
      </div>
    </div>
  );
}
