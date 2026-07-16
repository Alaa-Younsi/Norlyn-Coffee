import { Panel } from "@/components/ui/Panel";
import { useLanguage } from "@/i18n/LanguageProvider";

export function StorySection() {
  const { t } = useLanguage();
  const stats = [
    { n: t("story.stat1n"), l: t("story.stat1l") },
    { n: t("story.stat2n"), l: t("story.stat2l") },
    { n: t("story.stat3n"), l: t("story.stat3l") },
  ] as const;

  return (
    <section id="story" className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-24">
      {/* text on the start side — the capsule parks on the end side of the viewport */}
      <div className="max-w-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-brand">{t("story.kicker")}</p>
        <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-6xl">
          {t("story.title")}
        </h2>
        <p className="mt-6 leading-relaxed text-muted">{t("story.p1")}</p>
        <p className="mt-4 leading-relaxed text-muted">{t("story.p2")}</p>

        <div className="mt-10 grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Panel key={stat.l} className="px-4 py-5 text-center">
              <p className="fx-gold-text font-display text-4xl font-bold">{stat.n}</p>
              <p className="mt-1 text-xs text-muted">{stat.l}</p>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}
