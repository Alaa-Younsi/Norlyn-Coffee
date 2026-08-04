import { useRef } from "react";
import { Link } from "react-router-dom";
import { Flame, Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { ProductCard } from "@/components/product/ProductCard";
import { CoffeeDivider } from "@/components/effects/CoffeeDivider";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { ScrollProgressBar } from "@/components/effects/ScrollProgressBar";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useProducts } from "@/hooks/useProducts";
import { useSeo } from "@/hooks/useSeo";
import { useParallaxItems, useRevealOnScroll } from "@/hooks/useScrollFX";
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

export function About() {
  const { t } = useLanguage();
  const { data: products } = useProducts();
  const rootRef = useRef<HTMLElement>(null);

  // re-run once products land: the grid's height changes and the triggers
  // measured against the old layout would fire at the wrong scroll positions
  useRevealOnScroll(rootRef, [products?.length]);
  useParallaxItems(rootRef, [products?.length]);

  useSeo({
    title: `${t("about.metaTitle")} — Norlyn Coffee`,
    description: t("about.metaDesc"),
  });

  return (
    <main ref={rootRef} className="relative min-h-screen overflow-x-clip pb-24 pt-28">
      <ScrollProgressBar />
      <FloatingBeans count={8} seed={7} />
      <CoffeeRing className="fx-spin-slow -end-24 top-40 w-72 opacity-10" />

      {/* -------------------------------------------------------- opening */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2">
        <div className="text-start">
          <p className="text-xs uppercase tracking-[0.35em] text-brand sm:text-sm">
            {t("about.kicker")}
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[0.98] font-semibold sm:text-6xl lg:text-7xl">
            {t("about.title")}{" "}
            <span className="fx-accent fx-gold-text-deep">{t("about.titleAccent")}</span>
          </h1>
          <p className="mt-6 max-w-lg text-balance font-display text-lg leading-relaxed text-ink/75 sm:text-xl">
            {t("about.lead")}
          </p>
        </div>
        <ImageSlot slot="about.hero" priority className="mx-auto w-full max-w-md" />
      </section>

      <CoffeeDivider className="my-16" />

      {/* --------------------------------------------------------- story */}
      <section className="mx-auto max-w-3xl px-6 text-start" data-reveal>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          {t("about.story.title")}
        </h2>
        <div className="mt-5 space-y-4 text-base leading-relaxed text-ink/80 sm:text-lg">
          <p>{t("about.story.p1")}</p>
          <p>{t("about.story.p2")}</p>
          <p>{t("about.story.p3")}</p>
        </div>
      </section>

      {/* -------------------------------------------------------- values */}
      <section className="mx-auto mt-20 max-w-7xl px-6">
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
      <section className="mx-auto mt-24 max-w-7xl px-6">
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
              <ImageSlot slot={step.slot} ratio="1/1" rounded="rounded-[1.75rem]" />
              <p className="mt-4 font-display text-sm text-brand">
                <span dir="ltr">0{i + 1}</span>
              </p>
              <h3 className="mt-1 font-display text-xl">{t(step.titleKey)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(step.textKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ the team */}
      <section className="mx-auto mt-24 max-w-5xl px-6" data-reveal>
        <ImageSlot slot="about.team" ratio="16/9" />
        <p className="mt-3 text-center text-sm text-muted">{t("about.team.caption")}</p>
      </section>

      {/* ------------------------------------------------------ products */}
      <section className="mx-auto mt-24 max-w-7xl px-6">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-brand">
            {t("about.products.kicker")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            {t("about.products.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-muted">
            {t("about.products.subtitle")}
          </p>
        </header>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(products ?? []).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/shop">
            <Button variant="outline" size="lg">
              {t("about.products.cta")}
            </Button>
          </Link>
        </div>
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
