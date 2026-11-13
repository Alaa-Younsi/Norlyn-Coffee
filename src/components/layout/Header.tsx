import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CoffeeBagIcon } from "@/components/ui/icons";
import { GoldDust } from "@/components/brand/GoldDust";
import { NorlynLogo } from "@/components/brand/Logos";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { LANG_LABEL, LANG_NAME, nextLang } from "@/i18n/langs";
import { useCart, cartCount } from "@/store/cart";
import { reactMascot } from "@/store/mascot";
import { useHeaderStore } from "@/store/header";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/contact";
import { lockScroll, unlockScroll } from "@/lib/lenis";
import { cn } from "@/lib/utils";

const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Header state from scroll: `scrolled` once the page leaves the top (the bar
 * condenses into its floating capsule) and `hidden` while the visitor is
 * reading downward — it slides away to give the page the whole screen and
 * comes back the moment they scroll up, which is when they want it.
 * Passive listener; React only re-renders when one of the two flips.
 */
function useHeaderScroll(): { scrolled: boolean; hidden: boolean } {
  const [state, setState] = useState({ scrolled: false, hidden: false });
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      last = y;
      setState((prev) => {
        const scrolled = y > 24;
        // a dead-band so a trackpad's jitter doesn't flicker the bar
        const hidden = y < 420 ? false : delta > 6 ? true : delta < -6 ? false : prev.hidden;
        return prev.scrolled === scrolled && prev.hidden === hidden ? prev : { scrolled, hidden };
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return state;
}

/** Cut-out capsules that drift behind the open menu — the real AluSense colours. */
const MENU_CAPSULES = [
  { src: "/images/capsules/hd/gold-side-md.webp", className: "end-[-6%] top-[14%] w-40 rotate-[18deg] sm:w-52" },
  { src: "/images/capsules/hd/green-side-md.webp", className: "end-[22%] bottom-[18%] w-24 -rotate-[24deg] sm:w-32" },
  { src: "/images/capsules/hd/black-side-md.webp", className: "end-[4%] bottom-[-4%] w-36 rotate-[36deg] sm:w-44" },
] as const;

export function Header() {
  const { t, lang, setLang, dir } = useLanguage();
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.openCart);
  const count = cartCount(items);
  const { pathname } = useLocation();
  // the menu remembers which page it was opened on, so navigating anywhere
  // closes it without an effect — it is simply not open on the new path
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const menuOpen = openedOn === pathname;
  const setMenuOpen = (open: boolean) => setOpenedOn(open ? pathname : null);
  const { scrolled, hidden } = useHeaderScroll();
  // publish it for sticky elements that sit under the header
  useEffect(() => useHeaderStore.setState({ hidden: hidden && !menuOpen }), [hidden, menuOpen]);

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/shop", label: t("nav.shop") },
    { to: "/about", label: t("nav.about") },
    { to: "/journal", label: t("nav.blog") },
    { to: "/contact", label: t("nav.contact") },
  ];

  // the page under an open menu must not scroll — Lenis included
  useEffect(() => {
    if (!menuOpen) return;
    lockScroll();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const toggleLang = () => {
    setLang(nextLang(lang));
    reactMascot("playful");
  };

  // the menu's circle opens from the button's corner, whichever side that is
  const origin = dir === "rtl" ? "8% 3.5%" : "92% 3.5%";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 px-3 transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)] sm:px-5",
          hidden && !menuOpen ? "-translate-y-[130%]" : "translate-y-0",
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4 transition-all duration-500 ease-[cubic-bezier(.76,0,.24,1)]",
            scrolled
              ? // frosted on desktop only: a backdrop-filter re-blurs the page under
              // it on every scrolled frame, and on a phone that is the jank
              "mt-3 max-w-6xl rounded-full border border-line/60 bg-panel/95 py-1.5 ps-5 pe-1.5 shadow-[0_18px_40px_-22px_rgb(var(--c-shade)/0.55)] md:bg-panel/80 md:backdrop-blur-md"
              : "mt-0 max-w-7xl border border-transparent py-4 ps-1 pe-1",
          )}
        >
          <Link to="/" className="shrink-0 text-ink" aria-label="Norlyn Coffee">
            <NorlynLogo
              className={cn(
                "w-auto transition-all duration-500",
                scrolled ? "h-8 sm:h-9" : "h-10 sm:h-12",
              )}
            />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t("nav.menu")}>
            {links.map((link) => {
              const active = pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative px-4 py-2 font-display text-[15px] transition-colors",
                    active ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {link.label}
                  {/* hairline that grows out from the centre on hover; the
                      active page keeps a single gold bean under its name */}
                  <span
                    aria-hidden
                    className="absolute inset-x-4 bottom-1 h-px origin-center scale-x-0 bg-brand transition-transform duration-500 group-hover:scale-x-100"
                  />
                  {active && (
                    <motion.span
                      layoutId="nav-bean"
                      aria-hidden
                      className="absolute -bottom-0.5 left-1/2 h-1.5 w-1 -translate-x-1/2 rounded-full bg-brand"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleLang}
              className="hidden h-10 min-w-10 cursor-pointer rounded-full px-3 font-display text-sm text-muted transition-colors hover:text-ink sm:block"
              aria-label={`Switch language — ${LANG_NAME[nextLang(lang)]}`}
            >
              {LANG_LABEL[nextLang(lang)]}
            </button>

            {/* the cart is the one solid object in the bar — cream on espresso */}
            <button
              type="button"
              onClick={openCart}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-ink ps-3.5 pe-4 text-bg transition-transform duration-300 hover:-translate-y-0.5"
              aria-label={`${t("nav.cart")} (${count})`}
            >
              <CoffeeBagIcon size={16} />
              <span className="relative h-5 min-w-3 overflow-hidden font-display text-sm tabular-nums leading-5">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={count}
                    className="block"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.35, ease: EASE }}
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative z-[61] flex h-10 cursor-pointer items-center gap-2.5 rounded-full ps-3 pe-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-ink lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
            >
              <span className="sr-only sm:not-sr-only">{t("nav.menu")}</span>
              <span className="relative block h-3 w-5" aria-hidden>
                <span className="absolute inset-x-0 top-0 h-px bg-current" />
                <span className="absolute bottom-0 end-0 h-px w-3 bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
            className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-shade text-on-shade lg:hidden"
            initial={{ clipPath: `circle(0% at ${origin})` }}
            animate={{ clipPath: `circle(150% at ${origin})` }}
            exit={{ clipPath: `circle(0% at ${origin})` }}
            transition={{ duration: 0.75, ease: EASE }}
          >
            <GoldDust className="inset-0 h-full w-full opacity-70" seed={23} count={260} />
            {MENU_CAPSULES.map((capsule, i) => (
              <motion.img
                key={capsule.src}
                src={capsule.src}
                alt=""
                aria-hidden
                width={520}
                height={650}
                decoding="async"
                className={cn("pointer-events-none absolute drop-shadow-2xl", capsule.className)}
                initial={{ y: 120, rotate: -20 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ duration: 1.1, delay: 0.25 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}

            <div className="relative flex items-center justify-between px-5 pt-5">
              <NorlynLogo className="h-10 w-auto text-on-shade" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-3.5 text-xs font-semibold uppercase tracking-[0.2em]"
              >
                {t("nav.close")}
                <span className="relative block h-4 w-4" aria-hidden>
                  <span className="absolute left-0 top-1/2 h-px w-4 rotate-45 bg-current" />
                  <span className="absolute left-0 top-1/2 h-px w-4 -rotate-45 bg-current" />
                </span>
              </button>
            </div>

            <nav className="relative mt-[8vh] flex flex-col px-6">
              {links.map((link, i) => (
                <span key={link.to} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      to={link.to}
                      className={cn(
                        "flex items-baseline gap-4 py-1.5 font-display text-[2.6rem] leading-tight sm:text-6xl",
                        pathname === link.to ? "text-gold-hi" : "text-on-shade",
                      )}
                    >
                      <span className="w-7 font-sans text-xs tabular-nums text-gold-hi/70">
                        0{i + 1}
                      </span>
                      {link.label}
                    </Link>
                  </motion.span>
                </span>
              ))}
            </nav>

            <motion.div
              className="relative mt-auto flex items-end justify-between gap-4 px-6 pb-8"
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="space-y-3 text-sm">
                <a href={CONTACT_EMAIL_HREF} dir="ltr" className="block text-on-shade/70">
                  {CONTACT_EMAIL}
                </a>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleLang}
                    className="cursor-pointer rounded-full border border-on-shade/25 px-4 py-2 font-display"
                  >
                    {LANG_LABEL[nextLang(lang)]}
                  </button>
                </div>
              </div>
              <Mascot emotion="wink" palette={["wink"]} size={72} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
