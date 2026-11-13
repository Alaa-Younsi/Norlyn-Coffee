import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CreditsFilm } from "@/components/brand/CreditsFilm";
import type { FilmScene } from "@/components/brand/CreditsFilm";
import { Panel } from "@/components/ui/Panel";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePublishedArticles } from "@/hooks/useSiteContent";
import { useSeo } from "@/hooks/useSeo";
import { formatDate } from "@/lib/format";
import { pickLang } from "@/lib/localized";

/**
 * The journal as a programme of films: a title card, then one scene per
 * article — its cover full-bleed and pushing in, its number, tag and date as
 * the credit, its title, its first lines, and the way in. Played by the
 * scroll (CreditsFilm). With nothing published yet it falls back to a quiet
 * card.
 */
export function Journal() {
  const { t, lang } = useLanguage();
  const { data: articles, isLoading } = usePublishedArticles();

  useSeo({
    title: `${t("blog.metaTitle")} — Norlyn Coffee`,
    description: t("blog.metaDesc"),
  });

  const rows = articles ?? [];

  if (isLoading) {
    return <main className="min-h-screen pt-40 text-center text-sm text-muted">{t("common.loading")}</main>;
  }

  if (rows.length === 0) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 pb-24 pt-32">
        <h1 className="font-display text-[3.4rem] leading-[0.95] font-medium tracking-[-0.035em] sm:text-7xl">
          {t("blog.title")}
        </h1>
        <ImageSlot slot="blog.hero" ratio="16/9" priority sizes="(min-width: 768px) 48rem, 92vw" className="mt-10" />
        {/* public copy only — a visitor must never be told to go and publish
            something from the admin panel */}
        <Panel className="mt-8 flex flex-col items-center p-10 text-center">
          <Mascot emotion="calm" palette={["calm"]} size={80} />
          <p className="mt-3 font-display text-xl">{t("blog.empty")}</p>
          <p className="mt-2 text-sm text-muted">{t("blog.emptyHint")}</p>
        </Panel>
      </main>
    );
  }

  const scenes: FilmScene[] = [
    {
      id: "title",
      slot: "blog.hero",
      dim: 0.66,
      title: t("blog.title"),
      body: t("blog.subtitle"),
    },
    ...rows.map((article, i): FilmScene => {
      const tag = pickLang(lang, article.tag_fr, article.tag_ar, article.tag_en);
      const meta = [
        article.published_at ? formatDate(article.published_at, lang) : null,
        `${article.read_minutes} ${t("blog.minutes")}`,
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        id: article.id,
        src: article.cover_url ?? undefined,
        inset: article.cover_url ? { src: article.cover_url } : undefined,
        creditsFirst: true,
        dim: 0.8,
        credits: [
          {
            role: `${String(i + 1).padStart(2, "0")}${tag ? ` — ${tag}` : ""}`,
            name: <span className="text-lg text-on-shade/70 sm:text-xl">{meta}</span>,
          },
        ],
        title: pickLang(lang, article.title_fr, article.title_ar, article.title_en),
        body: pickLang(lang, article.excerpt_fr, article.excerpt_ar, article.excerpt_en),
        extra: (
          <Link
            to={`/journal/${article.slug}`}
            className="group inline-flex items-center gap-3 border-b border-on-shade/40 pb-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-on-shade transition-colors hover:border-gold-hi"
          >
            {t("blog.readMore")}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
        ),
      };
    }),
  ];

  return (
    <main className="relative">
      <CreditsFilm scenes={scenes} label={t("blog.title")} />
    </main>
  );
}
