import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { ClipReveal } from "@/components/brand/ClipReveal";
import { KineticLine } from "@/components/brand/KineticLine";
import { Reveal } from "@/components/brand/Reveal";
import { RevealHeading } from "@/components/brand/RevealHeading";
import { ScrollTrigger } from "@/lib/gsap";
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

  // reading progress — the gold hairline fills as the ARTICLE (not the page)
  // is read; one transform write per scroll update
  const articleRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = articleRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 20%",
      end: "bottom 80%",
      onUpdate: (self) => {
        bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
      },
    });
    return () => trigger.kill();
  }, [article?.id]);
  const more = (all ?? []).filter((entry) => entry.slug !== slug).slice(0, 3);

  return (
    <main className="relative min-h-screen overflow-x-clip pb-24 pt-28">
      <div
        ref={barRef}
        aria-hidden
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-brand via-gold-hi to-brand rtl:origin-right"
      />

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
          <article ref={articleRef} className="mt-6 text-start">
            {(article.tag_fr || article.tag_ar) && (
              <p className="font-display text-lg italic text-brand">
                {pickLang(lang, article.tag_fr, article.tag_ar, article.tag_en)}
              </p>
            )}
            <h1 className="mt-2 font-display text-[3rem] leading-[0.98] font-medium tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              <KineticLine key={article.id} text={title} delay={0.45} stagger={0.025} />
            </h1>
            {excerpt && (
              <Reveal as="p" index={5} className="fx-accent mt-5 text-xl leading-relaxed text-ink/75 sm:text-2xl">
                {excerpt}
              </Reveal>
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
              <ClipReveal className="mt-10 aspect-[16/9] rounded-[2rem]" delay={0.6} parallax={50}>
                <img
                  src={article.cover_url}
                  srcSet={dbSrcSet(article.cover_url)}
                  sizes="(min-width: 768px) 64rem, 92vw"
                  alt=""
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </ClipReveal>
            )}

            <div className="mt-10 max-w-2xl space-y-5 text-base leading-[1.85] text-ink/85 sm:text-lg">
              {paragraphs.map((block, i) => {
                // the articles mark their chapters as short numbered lines
                // ("2. La torréfaction") — set those as real headings
                const heading = block.trim().match(/^(\d+)\.\s+(.{2,70})$/);
                if (heading) {
                  return (
                    <h2
                      key={i}
                      className="!mt-14 flex items-baseline gap-4 font-display text-2xl leading-tight font-medium text-ink sm:text-3xl"
                    >
                      <span className="font-sans text-xs tabular-nums tracking-[0.2em] text-brand">
                        {heading[1].padStart(2, "0")}
                      </span>
                      {heading[2]}
                    </h2>
                  );
                }
                return (
                  <Reveal
                    as="p"
                    key={i}
                    y={20}
                    className={
                      i === 0
                        ? "whitespace-pre-line first-letter:float-start first-letter:me-3 first-letter:mt-1 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-brand"
                        : "whitespace-pre-line"
                    }
                  >
                    {block}
                  </Reveal>
                );
              })}
            </div>
          </article>
        )}
      </div>

      {more.length > 0 && (
        <>
          <section className="mx-auto max-w-6xl px-6">
            <RevealHeading className="font-display text-[2.2rem] leading-[1.04] font-medium tracking-[-0.02em] sm:text-5xl">
              {t("blog.more")}
            </RevealHeading>
            <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-3">
              {more.map((entry, i) => (
                <Link key={entry.id} to={`/journal/${entry.slug}`} className="group">
                  <article>
                    <ClipReveal className="aspect-[4/3] rounded-[1.75rem] bg-panel-2" delay={i * 0.12} parallax={0}>
                      {entry.cover_url ? (
                        <img
                          src={entry.cover_url}
                          srcSet={dbSrcSet(entry.cover_url)}
                          sizes="(min-width: 640px) 33vw, 90vw"
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
                        />
                      ) : (
                        <div className="fx-podium h-full w-full" />
                      )}
                    </ClipReveal>
                    <Reveal as="p" index={i} className="pt-5 font-display text-2xl leading-snug transition-colors group-hover:text-brand">
                      {pickLang(lang, entry.title_fr, entry.title_ar, entry.title_en)}
                    </Reveal>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
