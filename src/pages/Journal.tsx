import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { ScrollProgressBar } from "@/components/effects/ScrollProgressBar";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePublishedArticles } from "@/hooks/useSiteContent";
import { useSeo } from "@/hooks/useSeo";
import { useRevealOnScroll } from "@/hooks/useScrollFX";
import { formatDate } from "@/lib/format";
import type { Article } from "@/types/db";

export function Journal() {
  const { t, lang } = useLanguage();
  const { data: articles, isLoading } = usePublishedArticles();
  const rootRef = useRef<HTMLElement>(null);
  useRevealOnScroll(rootRef, [articles?.length]);

  useSeo({
    title: `${t("blog.metaTitle")} — Norlyn Coffee`,
    description: t("blog.metaDesc"),
  });

  const rows = articles ?? [];
  const [lead, ...rest] = rows;

  return (
    <main ref={rootRef} className="relative min-h-screen overflow-x-clip pb-24 pt-28">
      <ScrollProgressBar />
      <FloatingBeans count={7} seed={11} />
      <CoffeeRing className="fx-spin-slow -start-24 top-32 w-72 opacity-10" />

      <header className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-brand sm:text-sm">
          {t("blog.kicker")}
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold sm:text-6xl">
          <span className="fx-accent fx-gold-text-deep">{t("blog.title")}</span>
        </h1>
        <p className="mt-5 text-balance font-display text-lg leading-relaxed text-ink/75 sm:text-xl">
          {t("blog.subtitle")}
        </p>
      </header>

      <div className="mx-auto mt-10 max-w-5xl px-6">
        <ImageSlot slot="blog.hero" ratio="16/9" priority />
      </div>

      {isLoading && (
        <p className="mt-16 text-center text-sm text-muted">{t("common.loading")}</p>
      )}

      {!isLoading && rows.length === 0 && (
        <Panel className="mx-auto mt-16 max-w-lg p-10 text-center">
          <p className="font-display text-xl">{t("blog.empty")}</p>
          <p className="mt-2 text-sm text-muted">{t("blog.emptyHint")}</p>
        </Panel>
      )}

      {lead && (
        <section className="mx-auto mt-16 max-w-6xl px-6">
          <Link
            to={`/journal/${lead.slug}`}
            className="group grid gap-6 md:grid-cols-2 md:items-center"
          >
            <div className="overflow-hidden rounded-3xl border border-line bg-panel-2">
              {lead.cover_url ? (
                <img
                  src={lead.cover_url}
                  alt=""
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="fx-podium aspect-[16/10] w-full" />
              )}
            </div>
            <div className="text-start">
              <span className="text-xs uppercase tracking-[0.3em] text-brand">
                {t("blog.featured")}
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {lang === "ar" ? lead.title_ar : lead.title_fr}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {lang === "ar" ? lead.excerpt_ar : lead.excerpt_fr}
              </p>
              <ArticleMeta article={lead} />
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand">
                {t("blog.readMore")}
                <ArrowRight size={15} className="rtl:rotate-180" />
              </span>
            </div>
          </Link>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mx-auto mt-16 grid max-w-6xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <Link key={article.id} to={`/journal/${article.slug}`} data-reveal className="group">
              <Panel className="h-full overflow-hidden">
                <div className="overflow-hidden bg-panel-2">
                  {article.cover_url ? (
                    <img
                      src={article.cover_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="fx-podium aspect-[4/3] w-full" />
                  )}
                </div>
                <div className="p-6 text-start">
                  {(article.tag_fr || article.tag_ar) && (
                    <span className="text-[11px] uppercase tracking-[0.25em] text-brand">
                      {lang === "ar" ? article.tag_ar : article.tag_fr}
                    </span>
                  )}
                  <h3 className="mt-2 font-display text-xl leading-snug">
                    {lang === "ar" ? article.title_ar : article.title_fr}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                    {lang === "ar" ? article.excerpt_ar : article.excerpt_fr}
                  </p>
                  <ArticleMeta article={article} />
                </div>
              </Panel>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

function ArticleMeta({ article }: { article: Article }) {
  const { t, lang } = useLanguage();
  return (
    <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
      {article.published_at && <span>{formatDate(article.published_at, lang)}</span>}
      <span className="inline-flex items-center gap-1">
        <Clock size={12} />
        <span dir="ltr">{article.read_minutes}</span> {t("blog.minutes")}
      </span>
    </p>
  );
}
