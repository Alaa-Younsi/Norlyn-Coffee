import { Link, Navigate, useParams } from "react-router-dom";
import { RevealHeading } from "@/components/brand/RevealHeading";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";
import { LEGAL_DOCS, LEGAL_ORDER, LEGAL_UPDATED, isLegalSlug } from "@/data/legal";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";
import { cn } from "@/lib/utils";

/** `{email}` / `{phone}` tokens in the legal copy come from lib/contact.ts */
function fill(text: string): string {
  return text.replaceAll("{email}", CONTACT_EMAIL).replaceAll("{phone}", CONTACT_PHONE);
}

/**
 * One template for the four legal documents (/legal/:slug), set like a
 * printed booklet: a row of tabs across the documents, a large title and its
 * one-line purpose, then numbered sections with a sticky table of contents on
 * wide screens. The content lives in src/data/legal.ts.
 */
export function Legal() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const doc = isLegalSlug(slug) ? LEGAL_DOCS[slug] : null;

  useSeo({
    title: doc ? `${doc.title[lang]} — Norlyn Coffee` : "Norlyn Coffee",
    description: doc?.intro[lang],
  });

  if (!doc) return <Navigate to="/legal/mentions-legales" replace />;
  const sections = doc.sections[lang];
  const updated = new Date(LEGAL_UPDATED).toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "en" ? "en-GB" : "fr-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 sm:pt-36">
      {/* the four documents, always one tap apart */}
      <nav aria-label={t("legal.nav")} className="-mx-6 overflow-x-auto px-6">
        <ul className="flex min-w-max gap-2 border-b border-line">
          {LEGAL_ORDER.map((key) => (
            <li key={key}>
              <Link
                to={`/legal/${key}`}
                aria-current={key === doc.slug ? "page" : undefined}
                className={cn(
                  "-mb-px block border-b px-1 pb-3 pe-6 text-sm transition-colors",
                  key === doc.slug ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {LEGAL_DOCS[key].title[lang]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <header className="mt-14 max-w-3xl">
        <RevealHeading
          as="h1"
          key={doc.slug}
          className="font-display text-[2.7rem] leading-[1] font-medium tracking-[-0.03em] sm:text-6xl lg:text-7xl"
        >
          {doc.title[lang]}
        </RevealHeading>
        <p className="mt-6 max-w-2xl font-display text-xl leading-relaxed italic text-ink/75">{doc.intro[lang]}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-muted">
          {t("legal.updated")} · {updated}
        </p>
      </header>

      <div className="mt-16 grid gap-12 lg:grid-cols-[14rem_1fr] lg:gap-20">
        {/* table of contents — sticky beside the text on wide screens */}
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <p className="text-[11px] uppercase tracking-[0.3em] text-brand">{t("legal.onThisPage")}</p>
            <ol className="mt-5 space-y-3 border-s border-line ps-5 text-sm">
              {sections.map((section, i) => (
                <li key={section.h}>
                  <a href={`#s-${i + 1}`} className="text-muted transition-colors hover:text-ink">
                    {section.h}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <div className="max-w-2xl">
          {sections.map((section, i) => (
            <section key={section.h} id={`s-${i + 1}`} className="scroll-mt-32 border-t border-line py-10 first:border-t-0 first:pt-0">
              <h2 className="flex items-baseline gap-4 font-display text-2xl font-medium sm:text-3xl">
                <span className="font-sans text-xs tabular-nums tracking-[0.2em] text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.h}
              </h2>
              <div className="mt-5 space-y-4 leading-[1.8] text-ink/80">
                {section.p.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{fill(paragraph)}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
