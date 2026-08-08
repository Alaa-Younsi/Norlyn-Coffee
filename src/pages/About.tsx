import { useRef } from "react";
import { Link } from "react-router-dom";
import { Flame, Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Photo } from "@/components/ui/Photo";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { Mascot } from "@/components/mascot/Mascot";
import { ScrollMascot } from "@/components/mascot/ScrollMascot";
import { CoffeeDivider } from "@/components/effects/CoffeeDivider";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { ScrollProgressBar } from "@/components/effects/ScrollProgressBar";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";
import { useParallaxItems, useRevealOnScroll } from "@/hooks/useScrollFX";
import { ABOUT_PALETTE } from "@/lib/mascot";
import { MEDIA } from "@/lib/media";
import type { TranslationKey } from "@/i18n/translations";

const VALUES: Array<{ icon: typeof Leaf; titleKey: TranslationKey; textKey: TranslationKey }> = [
  { icon: Leaf, titleKey: "about.value1.title", textKey: "about.value1.text" },
  { icon: Flame, titleKey: "about.value2.title", textKey: "about.value2.text" },
  { icon: ShieldCheck, titleKey: "about.value3.title", textKey: "about.value3.text" },
];

const STEPS: Array<{ titleKey: TranslationKey; textKey: TranslationKey; slot: string }> = [
  { titleKey: "about.step1.title", textKey: "about.step1.text", slot: "about.origin" },
  { titleKey: "about.step2.title", textKey: "about.step2.text", slot: "about.roastery" },
  { titleKey: "about.step3.title", textKey: "about.step3.text", slot: "about.packaging" },
  { titleKey: "about.step4.title", textKey: "about.step4.text", slot: "about.sealing" },
];

/** the two families, shown as what they are: eight cut-out capsules */
const RANGE: Array<{
  labelKey: TranslationKey;
  textKey: TranslationKey;
  keys: Array<keyof typeof MEDIA.capsule>;
}> = [
  {
    labelKey: "about.range.bio",
    textKey: "about.range.bioText",
    keys: ["black", "brown", "green", "gold"],
  },
  {
    labelKey: "about.range.flavours",
    textKey: "about.range.flavoursText",
    keys: ["hazelnut", "vanilla", "caramel", "chocolate"],
  },
];

export function About() {
  const { t } = useLanguage();
  const rootRef = useRef<HTMLElement>(null);

  // Every block on this page is now either static copy or an ImageSlot, and a
  // slot reserves its ratio before its picture arrives — so the page's height
  // is settled on first paint and the scroll triggers need no re-measure.
  useRevealOnScroll(rootRef);
  useParallaxItems(rootRef);

  useSeo({
    title: `${t("about.metaTitle")} — Norlyn Coffee`,
    description: t("about.metaDesc"),
  });

  return (
    <main ref={rootRef} className="relative min-h-screen overflow-x-clip pb-24 pt-28">
      <ScrollProgressBar />
      <ScrollMascot palette={ABOUT_PALETTE} />
      <FloatingBeans count={8} seed={7} />
      <CoffeeRing className="fx-spin-slow -end-24 top-40 w-72 opacity-10" />

      {/* -------------------------------------------------------- opening */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2">
        <div className="text-start">
          <div className="flex items-center gap-3">
            <Mascot emotion="happy" palette={["happy"]} size={44} float={false} />
            <p className="text-xs uppercase tracking-[0.35em] text-brand sm:text-sm">
              {t("about.kicker")}
            </p>
          </div>
          <h1 className="mt-4 font-display text-5xl leading-[0.98] font-semibold sm:text-6xl lg:text-7xl">
            {t("about.title")}{" "}
            <span className="fx-accent fx-gold-text-deep">{t("about.titleAccent")}</span>
          </h1>
          <p className="mt-6 max-w-lg text-balance font-display text-lg leading-relaxed text-ink/75 sm:text-xl">
            {t("about.lead")}
          </p>
        </div>
        <ImageSlot
          slot="about.hero"
          priority
          sizes="(min-width: 1024px) 28rem, 90vw"
          className="mx-auto w-full max-w-md"
        />
      </section>

      <CoffeeDivider className="my-16" />

      {/* ------------------------------------------------ the bio promise */}
      {/* The claim that carries the brand, so it gets the page's widest band
          and the only photograph that shows the material itself. */}
      <section className="mx-auto max-w-7xl px-6" data-mascot="determined">
        <Panel className="overflow-hidden p-0">
          <div className="grid items-stretch lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-64">
              <ImageSlot
                slot="about.promise"
                fill
                flat
                // eager: this one is absolutely positioned, so it has no
                // height of its own until the grid row resolves — a lazy
                // loader that measures it before that sees a zero-height box
                // and can leave the band showing nothing but its scrim
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
              {/* plain vertical scrim: Tailwind has no logical gradient
                  direction, and a physical one would point the wrong way in RTL */}
              <span
                className="absolute inset-0 bg-gradient-to-t from-shade/55 via-transparent to-transparent"
                aria-hidden
              />
            </div>
            <div className="p-8 text-start sm:p-10">
              <p className="text-xs uppercase tracking-[0.35em] text-brand">
                {t("about.promise.kicker")}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                {t("about.promise.title")}
              </h2>
              <p className="mt-4 leading-relaxed text-muted">{t("about.promise.text")}</p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { n: "100 %", l: t("about.promise.stat1") },
                  { n: "0 %", l: t("about.promise.stat2") },
                  { n: "0 %", l: t("about.promise.stat3") },
                ].map((stat) => (
                  <li key={stat.l} className="rounded-2xl border border-line bg-panel-2/50 px-4 py-4">
                    <p className="fx-gold-text font-display text-3xl font-bold" dir="ltr">
                      {stat.n}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-muted">{stat.l}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-panel/70 px-4 py-1.5 text-xs font-medium text-brand">
                <Sparkles size={14} />
                {t("about.promise.badge")}
              </p>
            </div>
          </div>
        </Panel>
      </section>

      {/* --------------------------------------------------------- story */}
      <section className="mx-auto mt-24 grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="text-start" data-reveal>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            {t("about.story.title")}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-ink/80 sm:text-lg">
            <p>{t("about.story.p1")}</p>
            <p>{t("about.story.p2")}</p>
            <p>{t("about.story.p3")}</p>
          </div>
        </div>
        {/* two shots, offset — a collage reads as a workshop, a single photo
            beside body copy reads as stock */}
        <div className="grid grid-cols-2 gap-4">
          <div data-parallax="26">
            <ImageSlot slot="about.story.1" sizes="(min-width: 1024px) 22vw, 45vw" />
          </div>
          <div className="mt-10 space-y-4" data-parallax="-22">
            <ImageSlot slot="about.story.2" sizes="(min-width: 1024px) 22vw, 45vw" />
            <ImageSlot slot="about.story.3" sizes="(min-width: 1024px) 22vw, 45vw" />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- values */}
      <section className="mx-auto mt-24 max-w-7xl px-6">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand">
            {t("about.values.kicker")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            {t("about.values.title")}
          </h2>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <Panel key={value.titleKey} className="p-7 text-start" data-reveal>
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brand/30 text-brand">
                <value.icon size={20} strokeWidth={1.6} />
              </span>
              <h3 className="mt-4 font-display text-xl">{t(value.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(value.textKey)}</p>
            </Panel>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- process */}
      <section className="mx-auto mt-24 max-w-7xl px-6" data-mascot="surprised">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand">
            {t("about.process.kicker")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            {t("about.process.title")}
          </h2>
        </header>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.titleKey} data-reveal data-parallax={i % 2 === 0 ? "18" : "-14"}>
              <ImageSlot
                slot={step.slot}
                ratio="1/1"
                rounded="rounded-[1.75rem]"
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
              />
              <p className="mt-4 font-display text-sm text-brand">
                <span dir="ltr">0{i + 1}</span>
              </p>
              <h3 className="mt-1 font-display text-xl">{t(step.titleKey)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(step.textKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- the two lines */}
      <section className="mx-auto mt-24 max-w-7xl px-6" data-mascot="love">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand">{t("about.range.kicker")}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            {t("about.range.title")}
          </h2>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {RANGE.map((family) => (
            <Panel key={family.labelKey} className="p-7 text-start" data-reveal>
              <h3 className="font-display text-2xl">{t(family.labelKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(family.textKey)}</p>
              <div className="mt-6 grid grid-cols-4 gap-3">
                {family.keys.map((key) => (
                  <Photo
                    key={key}
                    media={MEDIA.capsule[key]}
                    alt=""
                    fit="contain"
                    sizes="(min-width: 1024px) 10vw, 22vw"
                    className="fx-float w-full drop-shadow-[0_16px_18px_rgb(var(--c-ink)/0.25)]"
                  />
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- the fleet */}
      <section className="mx-auto mt-24 max-w-7xl px-6" data-mascot="playful">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="text-start" data-reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-brand">
              {t("about.fleet.kicker")}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              {t("about.fleet.title")}
            </h2>
            <p className="mt-4 leading-relaxed text-muted">{t("about.fleet.text")}</p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-panel/70 px-4 py-1.5 text-xs font-medium text-brand">
              <Truck size={14} />
              {t("about.fleet.badge")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ImageSlot slot="about.fleet.1" sizes="(min-width: 1024px) 45vw, 92vw" />
            </div>
            {/* the yard shot and the studio rear view, not the two yard shots
                — side by side those read as the same photo twice */}
            <ImageSlot slot="about.fleet.2" sizes="(min-width: 1024px) 22vw, 45vw" />
            <ImageSlot slot="about.fleet.3" sizes="(min-width: 1024px) 22vw, 45vw" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ retail + machines */}
      <section className="mx-auto mt-24 grid max-w-7xl gap-6 px-6 lg:grid-cols-2">
        <Panel className="overflow-hidden p-0" data-reveal>
          <ImageSlot slot="about.retail" flat sizes="(min-width: 1024px) 45vw, 92vw" />
          <div className="p-7 text-start">
            <p className="text-xs uppercase tracking-[0.35em] text-brand">
              {t("about.retail.kicker")}
            </p>
            <h3 className="mt-2 font-display text-2xl">{t("about.retail.title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("about.retail.text")}</p>
          </div>
        </Panel>

        <Panel className="overflow-hidden p-0" data-reveal>
          <div className="relative">
            <ImageSlot slot="about.machines" flat sizes="(min-width: 1024px) 45vw, 92vw" />
            <span className="absolute end-4 top-4 rounded-full border border-brand/40 bg-panel/85 px-3 py-1 text-[11px] uppercase tracking-widest text-brand backdrop-blur">
              {t("about.machines.badge")}
            </span>
          </div>
          <div className="p-7 text-start">
            <p className="text-xs uppercase tracking-[0.35em] text-brand">
              {t("about.machines.kicker")}
            </p>
            <h3 className="mt-2 font-display text-2xl">{t("about.machines.title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("about.machines.text")}</p>
          </div>
        </Panel>
      </section>

      {/* ------------------------------------------------------ the team */}
      <section className="mx-auto mt-24 max-w-5xl px-6" data-reveal>
        <ImageSlot slot="about.team" ratio="16/9" sizes="(min-width: 1024px) 64rem, 92vw" />
        <p className="mt-3 text-center text-sm text-muted">{t("about.team.caption")}</p>
      </section>

      {/* ----------------------------------------------------------- CTA */}
      <section className="mx-auto mt-24 max-w-4xl px-6">
        <Panel className="fx-podium p-10 text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            {t("about.cta.title")}
          </h2>
          <p className="mt-2 text-muted">{t("about.cta.text")}</p>
          <Link to="/shop" className="mt-6 inline-block">
            <Button size="lg">{t("about.cta.button")}</Button>
          </Link>
        </Panel>
      </section>
    </main>
  );
}

