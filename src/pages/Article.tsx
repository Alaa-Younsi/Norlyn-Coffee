import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { CoffeeDivider } from "@/components/effects/CoffeeDivider";
import { ScrollProgressBar } from "@/components/effects/ScrollProgressBar";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useArticle, usePublishedArticles } from "@/hooks/useSiteContent";
import { useSeo } from "@/hooks/useSeo";
import { formatDate } from "@/lib/format";
import { pickLang } from "@/lib/localized";
import { dbSrcSet } from "@/lib/media";

export function Article() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const { data: article, isLoading } = useArticle(slug);
  const { data: all } = usePublishedArticles();

  const title = article ? pickLang(lang, article.title_fr, article.title_ar, article.title_en) : "";
  const excerpt = article ? pickLang(lang, article.excerpt_fr, article.excerpt_ar, article.excerpt_en) : "";
  const body = article ? pickLang(lang, article.body_fr, article.body_ar, article.body_en) : "";

  useSeo({
    title: article ? `${title} — Norlyn Coffee` : t("blog.metaTitle"),
    description: excerpt ?? undefined,
    image: article?.cover_url ?? undefined,
    jsonLd: article
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description: excerpt ?? undefined,
          image: article.cover_url ?? undefined,
          datePublished: article.published_at ?? undefined,
          author: { "@type": "Organization", name: article.author ?? "Norlyn Coffee" },
        }
      : undefined,
  });

  // blank lines separate paragraphs (the admin editor's contract)
  const paragraphs = (body ?? "").split(/\n\s*\n/).filter((block) => block.trim());
  const more = (all ?? []).filter((entry) => entry.slug !== slug).slice(0, 3);

  return (
    <main className="relative min-h-screen overflow-x-clip pb-24 pt-28">
      <ScrollProgressBar />

      <div className="mx-auto max-w-3xl px-6">
        <Link
          to="/journal"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-brand"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("blog.back")}
        </Link>

        {isLoading && <p className="mt-10 text-sm text-muted">{t("common.loading")}</p>}
        {!isLoading && !article && <p className="mt-10 text-sm text-muted">{t("blog.notFound")}</p>}

        {article && (
          <article className="mt-6 text-start">
            {(article.tag_fr || article.tag_ar) && (
              <p className="text-xs uppercase tracking-[0.3em] text-brand">
                {pickLang(lang, article.tag_fr, article.tag_ar, article.tag_en)}
              </p>
            )}
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {title}
            </h1>
            {excerpt && (
              <p className="fx-accent mt-4 text-xl leading-relaxed text-ink/75 sm:text-2xl">
                {excerpt}
              </p>
            )}

            <p className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted">
              {article.author && (
                <span>
                  {t("blog.by")} {article.author}
                </span>
              )}
              {article.published_at && <span>{formatDate(article.published_at, lang)}</span>}
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                <span dir="ltr">{article.read_minutes}</span> {t("blog.minutes")}
              </span>
            </p>

            {article.cover_url && (
              <img
                src={article.cover_url}
                srcSet={dbSrcSet(article.cover_url)}
                sizes="(min-width: 768px) 768px, 92vw"
                alt=""
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="mt-8 aspect-[16/9] w-full rounded-3xl border border-line object-cover"
              />
            )}

            <div className="mt-8 space-y-5 text-base leading-relaxed text-ink/85 sm:text-lg">
              {paragraphs.map((block, i) => (
                <p key={i} className="whitespace-pre-line">
                  {block}
                </p>
              ))}
            </div>
          </article>
        )}
      </div>

      {more.length > 0 && (
        <>
          <CoffeeDivider className="my-16" />
          <section className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-2xl font-semibold">{t("blog.more")}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {more.map((entry) => (
                <Link key={entry.id} to={`/journal/${entry.slug}`} className="group">
                  <Panel className="h-full overflow-hidden">
                    <div className="overflow-hidden bg-panel-2">
                      {entry.cover_url ? (
                        <img
                          src={entry.cover_url}
                          srcSet={dbSrcSet(entry.cover_url)}
                          sizes="(min-width: 640px) 33vw, 90vw"
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="fx-podium aspect-[4/3] w-full" />
                      )}
                    </div>
                    <p className="p-5 font-display text-lg leading-snug">
                      {pickLang(lang, entry.title_fr, entry.title_ar, entry.title_en)}
                    </p>
                  </Panel>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
