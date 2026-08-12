import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageProvider";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF, CONTACT_LOCATION } from "@/lib/contact";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line bg-panel-2/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <img
            src="/images/norlyn-logo.webp"
            alt="Norlyn Coffee"
            width={640}
            height={237}
            loading="lazy"
            decoding="async"
            className="norlyn-logo h-10 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{t("footer.desc")}</p>
        </div>
        <div>
          <h3 className="font-display text-xl">{t("footer.links")}</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link to="/" className="hover:text-brand transition-colors">
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-brand transition-colors">
                {t("nav.shop")}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-brand transition-colors">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link to="/journal" className="hover:text-brand transition-colors">
                {t("nav.blog")}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-brand transition-colors">
                {t("nav.contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-xl">{t("footer.contact")}</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>{CONTACT_LOCATION}</li>
            {/* a printed address is a dead end on a phone — the one place a
                shopper is most likely to be standing when they read it */}
            <li dir="ltr">
              <a href={CONTACT_EMAIL_HREF} className="hover:text-brand transition-colors">
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/70 py-5 text-center text-xs text-muted">
        © {year} Norlyn Coffee — {t("footer.rights")}
      </div>
    </footer>
  );
}
