import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, ShoppingBag, Sun, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { LANG_LABEL, LANG_NAME, nextLang } from "@/i18n/langs";
import { useTheme } from "@/theme/ThemeProvider";
import { useCart, cartCount } from "@/store/cart";
import { cn } from "@/lib/utils";

export function Header() {
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.openCart);
  const count = cartCount(items);
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/shop", label: t("nav.shop") },
    { to: "/about", label: t("nav.about") },
    { to: "/journal", label: t("nav.blog") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-bg/90 via-bg/50 to-transparent pb-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="Norlyn Coffee">
          <img
            src="/images/norlyn-logo.webp"
            alt="Norlyn Coffee"
            width={640}
            height={237}
            decoding="async"
            className="norlyn-logo h-9 w-auto sm:h-11"
          />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-line/70 bg-panel/70 px-2 py-1 backdrop-blur-md lg:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                pathname === link.to
                  ? "bg-brand/15 text-brand font-semibold"
                  : "text-muted hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLang(nextLang(lang))}
            className="min-w-11 rounded-full border border-line/70 bg-panel/70 px-3 py-1.5 text-sm font-semibold text-muted backdrop-blur-md transition-colors hover:text-ink cursor-pointer"
            aria-label={`Switch language — ${LANG_NAME[nextLang(lang)]}`}
          >
            {LANG_LABEL[nextLang(lang)]}
          </button>
          <button
            onClick={toggleTheme}
            className="rounded-full border border-line/70 bg-panel/70 p-2 text-muted backdrop-blur-md transition-colors hover:text-ink cursor-pointer"
            aria-label={t("nav.theme")}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={openCart}
            className="relative rounded-full border border-brand/50 bg-panel/70 p-2 text-brand backdrop-blur-md transition-colors hover:bg-brand/10 cursor-pointer"
            aria-label={t("nav.cart")}
          >
            <ShoppingBag size={16} />
            {count > 0 && (
              <span className="absolute -top-1.5 -end-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-cream">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full border border-line/70 bg-panel/70 p-2 text-muted backdrop-blur-md lg:hidden cursor-pointer"
            aria-label="menu"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="mx-4 rounded-2xl border border-line bg-panel p-2 shadow-xl lg:hidden"
            initial={{ y: -8 }}
            animate={{ y: 0 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "block rounded-xl px-4 py-3 text-sm",
                  pathname === link.to ? "bg-brand/10 text-brand font-semibold" : "text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
