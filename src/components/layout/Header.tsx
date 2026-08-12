import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { CoffeeBagIcon, MoonIcon, SunIcon } from "@/components/ui/icons";
// PHONE PREVIEW — temporary recording rig, delete with the folder it points at
import { PhonePreviewButton } from "@/devtools/phone-preview/PhonePreviewButton";
import { useLanguage } from "@/i18n/LanguageProvider";
import { LANG_LABEL, LANG_NAME, nextLang } from "@/i18n/langs";
import { useTheme } from "@/theme/ThemeProvider";
import { useCart, cartCount } from "@/store/cart";
import { reactMascot } from "@/store/mascot";
import { cn } from "@/lib/utils";

/**
 * True once the page has left the top. Passive listener + a plain comparison,
 * so it re-renders the header twice per session rather than on every frame.
 * Lenis drives real window scroll, so this works on the landing page too.
 */
function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

export function Header() {
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.openCart);
  const count = cartCount(items);
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolled();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/shop", label: t("nav.shop") },
    { to: "/about", label: t("nav.about") },
    { to: "/journal", label: t("nav.blog") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    // At the top the header is a scrim over the hero; once the page scrolls it
    // condenses into a real bar. Without that, the wordmark — the one element
    // with no chip behind it — collides with whatever photo scrolls under it.
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        // the condensed bar keeps a little tail on phones: with pb-0 the fade
        // had nowhere to happen and the mask ate into the buttons themselves
        scrolled ? "pb-1.5 sm:pb-0" : "pb-3",
      )}
    >
      {/*
        The condensed bar's backdrop, as its own layer rather than as styles on
        the header.

        It used to be a flat `bg-bg/85` with a `border-b`, and both ends were
        visible against a dark hero: a hairline of --c-line straight across the
        page, and above it a panel a shade darker than what it covered. So the
        bar stops with a fade instead of an edge — the gradient takes the tint
        to zero and the mask takes the BLUR with it, which a background alone
        cannot do (an unmasked backdrop-filter keeps its own hard boundary
        however transparent the colour over it becomes).

        Why a child and not the header itself: the mobile menu is also a child
        of <header>, and a mask on the header would fade the bottom of that
        open panel too.
      */}
      {/*
        Where the fade stops matters more than it looks. At 60% the tint was
        already dropping through the row the logo and the buttons sit in, so on
        a phone — where the bar is barely taller than the wordmark — whatever
        scrolled underneath showed straight through the controls and the bar
        read as half-drawn. The opaque part now covers the full control row and
        only the last stretch fades, which is the part that exists to avoid a
        hard edge in the first place.
      */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 -z-10 h-full transition-opacity duration-300",
          "bg-gradient-to-b from-bg/96 via-bg/94 to-bg/0 backdrop-blur-lg",
          "[mask-image:linear-gradient(to_bottom,#000_82%,transparent_100%)]",
          "[-webkit-mask-image:linear-gradient(to_bottom,#000_82%,transparent_100%)]",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
      {/* the top-of-page scrim, which has always faded and needs no mask */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 -z-10 h-full transition-opacity duration-300",
          "bg-gradient-to-b from-bg/90 via-bg/50 to-transparent",
          scrolled ? "opacity-0" : "opacity-100",
        )}
      />
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6",
          // 8px of padding around a 36px wordmark left it all but touching the
          // top of the screen once the browser's own chrome slid away
          scrolled ? "py-2.5 sm:py-2" : "py-3",
        )}
      >
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

        {/*
          None of the chips in this bar are frosted any more, and the bar they
          sit in still is.

          `backdrop-filter` is not a colour — it promotes its element to its own
          compositing surface and re-reads and re-blurs the pixels behind it on
          every frame that anything moves. Six of those were pinned to the top
          of the screen for the entire scroll, each one blurring a backdrop that
          is either the bar's OWN blurred panel (already frosted, so the second
          pass adds nothing) or, at the top of the page, a flat cream gradient
          with nothing in it to blur. Raising the fill from /70 to /85 is
          visually indistinguishable and costs a paint instead of a surface.
        */}
        <nav className="hidden items-center gap-1 rounded-full border border-line/70 bg-panel/85 px-2 py-1 lg:flex">
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
          {/* the two toggles that change how the whole site looks or reads get
              a glance from the cup — see store/mascot.ts */}
          <button
            onClick={() => {
              setLang(nextLang(lang));
              reactMascot("playful");
            }}
            className="min-w-11 rounded-full border border-line/70 bg-panel/85 px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink cursor-pointer"
            aria-label={`Switch language — ${LANG_NAME[nextLang(lang)]}`}
          >
            {LANG_LABEL[nextLang(lang)]}
          </button>
          <button
            onClick={() => {
              toggleTheme();
              reactMascot("wink");
            }}
            className="rounded-full border border-line/70 bg-panel/85 p-2 text-muted transition-colors hover:text-ink cursor-pointer"
            aria-label={t("nav.theme")}
          >
            {theme === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
          </button>
          <button
            onClick={openCart}
            className="relative rounded-full border border-brand/50 bg-panel/85 p-2 text-brand transition-colors hover:bg-brand/10 cursor-pointer"
            aria-label={t("nav.cart")}
          >
            <CoffeeBagIcon size={17} />
            {count > 0 && (
              <span className="absolute -top-1.5 -end-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-cream">
                {count}
              </span>
            )}
          </button>
          {/* PHONE PREVIEW — temporary recording rig. Delete this line, its
              import, and src/devtools/phone-preview/ to remove. */}
          <PhonePreviewButton />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full border border-line/70 bg-panel/85 p-2 text-muted lg:hidden cursor-pointer"
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
