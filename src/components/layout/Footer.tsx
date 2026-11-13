import { Link } from "react-router-dom";
import { ArrowUpRight, PackageCheck, Truck } from "lucide-react";
import { GoldDust } from "@/components/brand/GoldDust";
import { MorivaLogo } from "@/components/brand/Logos";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF, CONTACT_LOCATION } from "@/lib/contact";
import { LEGAL_DOCS, LEGAL_ORDER } from "@/data/legal";
import { useConsent } from "@/store/consent";

/**
 * The end of every page: espresso black and gold, the Moriva box itself,
 * drawn in the theme-invariant `shade` / `on-shade` pair.
 */
export function Footer() {
  const { t, lang } = useLanguage();
  const year = new Date().getFullYear();
  const reopenConsent = useConsent((state) => state.reopen);

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/shop", label: t("nav.shop") },
    { to: "/about", label: t("nav.about") },
    { to: "/journal", label: t("nav.blog") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <footer className="relative mt-16 bg-shade text-on-shade">
      {/* the cup has stayed up too late — it peeks over the footer's edge */}
      <div className="pointer-events-none absolute -top-14 end-8 sm:end-16" aria-hidden>
        <Mascot emotion="sleepy" palette={["sleepy"]} size={84} />
      </div>

      <div className="relative overflow-clip">
        {/* a fine glitter of the box's gold dust, held to the top corner so
            nothing ever sits behind a line of text */}
        <GoldDust className="end-0 top-0 h-72 w-full max-w-3xl opacity-60" corner="top-end" seed={41} count={420} />
        {/* one gold horizon across the top — the crema line */}
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-hi/50 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-10">
          <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <MorivaLogo className="w-56 text-on-shade sm:w-72" title="Moriva" />
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-on-shade/60">
                {t("footer.desc")}
              </p>
            </div>

            {/* the one thing a footer should make easy: getting in touch */}
            <div className="lg:pt-2">
              <p className="font-display text-2xl italic text-on-shade/80 sm:text-3xl">
                {t("footer.ctaTitle")}
              </p>
              <a
                href={CONTACT_EMAIL_HREF}
                dir="ltr"
                className="group mt-4 inline-flex items-center gap-3 border-b border-gold-hi/40 pb-2 font-display text-xl text-gold-hi transition-colors hover:border-gold-hi sm:text-2xl"
              >
                {CONTACT_EMAIL}
                <ArrowUpRight
                  size={22}
                  className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </a>
            </div>
          </div>

          <div className="mt-16 grid gap-10 border-t border-on-shade/10 pt-10 sm:grid-cols-3">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-gold-hi/80">
                {t("footer.links")}
              </h3>
              <ul className="mt-5 space-y-2.5">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="font-display text-lg text-on-shade/75 transition-colors hover:text-on-shade"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-gold-hi/80">
                {t("footer.delivery")}
              </h3>
              <ul className="mt-5 space-y-4 text-sm text-on-shade/70">
                <li className="flex gap-3">
                  <PackageCheck size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-hi" />
                  {t("footer.cod")}
                </li>
                <li className="flex gap-3">
                  <Truck size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-hi" />
                  {t("footer.wilayas")}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-gold-hi/80">
                {t("footer.contact")}
              </h3>
              <p className="mt-5 text-sm text-on-shade/70">{CONTACT_LOCATION}</p>
            </div>
          </div>
        </div>

        {/* the legal documents and the cookie choice, one tap from every page */}
        <nav aria-label={t("legal.nav")} className="relative border-t border-on-shade/10">
          <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-5 text-xs text-on-shade/60 sm:justify-start">
            {LEGAL_ORDER.map((slug) => (
              <li key={slug}>
                <Link to={`/legal/${slug}`} className="transition-colors hover:text-on-shade">
                  {LEGAL_DOCS[slug].title[lang]}
                </Link>
              </li>
            ))}
            <li>
              <button type="button" onClick={reopenConsent} className="cursor-pointer transition-colors hover:text-on-shade">
                {t("footer.manageCookies")}
              </button>
            </li>
          </ul>
        </nav>

        <div className="relative border-t border-on-shade/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 py-5 text-center text-xs text-on-shade/50 sm:flex-row sm:justify-between sm:text-start">
            <p>
              © {year} Norlyn Coffee — {t("footer.rights")}
            </p>
            <p dir="ltr">
              Website Developed by{" "}
              <a
                href="https://alaayounsi.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold-hi underline-offset-4 hover:underline"
              >
                Alaa Younsi
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
