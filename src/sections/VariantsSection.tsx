import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { useDriftIn } from "@/hooks/useScrollFX";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSurfaceTone } from "@/hooks/useSurfaceTone";
import { readableAccent } from "@/lib/contrast";
import { formatPrice } from "@/lib/format";
import { ScrollTrigger } from "@/lib/gsap";
import { dbSize } from "@/lib/media";
import { intensityBeans, printedIntensity } from "@/lib/intensity";
import { pickLang } from "@/lib/localized";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/db";

interface VariantsSectionProps {
  products: Product[];
  show3D: boolean;
}

/**
 * 3D mode: a tall scroll zone with a sticky viewport — the fixed canvas
 * capsule recolors per variant while this section crossfades the copy.
 * 2D mode: plain stacked variant panels with the capsule photos.
 */
export function VariantsSection({ products, show3D }: VariantsSectionProps) {
  if (!show3D) return <Variants2D products={products} />;
  return <Variants3D products={products} />;
}

const EASE = [0.22, 1, 0.36, 1] as const;
/** exits are short and accelerate away, so the next variant never waits on a lingering one */
const EASE_IN = [0.55, 0, 0.75, 0.2] as const;
/** the copy swaps on a clean fade + lift: no blur, it read as smudged mid-change */
const swapIn = (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: EASE } });
const SWAP_OUT = { opacity: 0, y: -8, transition: { duration: 0.22, ease: EASE_IN } };

/** The name swap: letters slide up out of their mask, the next name swings up into it. */
function SwapName({ text, color, lang }: { text: string; color: string; lang: string }) {
  // letters live inside unbreakable word boxes, so a long name wraps between
  // words ("Nos machines à espresso"), never mid-word; Arabic animates by word
  const words = text.split(" ");
  let glyph = 0;
  return (
    <span className="block [perspective:700px]" style={{ color }}>
      <span className="sr-only">{text}</span>
      {words.map((word, w) => {
        const pieces = lang === "ar" ? [word] : Array.from(word);
        return (
          <Fragment key={`${w}-${word}`}>
            <span aria-hidden className="inline-block whitespace-nowrap">
              {pieces.map((piece, k) => {
                const order = glyph++;
                return (
                  <span
                    key={`${k}-${piece}`}
                    className="inline-block pb-[0.12em] -mb-[0.12em] align-bottom [clip-path:inset(-1em_-0.4em_0_-0.4em)]"
                  >
                    <motion.span
                      className="inline-block origin-bottom"
                      initial={{ y: "105%", rotateX: -45 }}
                      animate={{ y: 0, rotateX: 0, transition: { duration: 0.55, delay: order * 0.018, ease: EASE } }}
                      exit={{ y: "-105%", transition: { duration: 0.26, delay: order * 0.008, ease: EASE_IN } }}
                    >
                      {piece}
                    </motion.span>
                  </span>
                );
              })}
            </span>
            {w < words.length - 1 && " "}
          </Fragment>
        );
      })}
    </span>
  );
}

function Variants3D({ products }: { products: Product[] }) {
  const { t, lang } = useLanguage();
  const theme = useSurfaceTone();
  const zoneRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = products.length;
  // the capsule swoops to the start side as this zone arrives — the copy
  // mirrors it by sliding in from the end side
  useDriftIn(copyRef, "end", 90);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || count === 0) return;
    const trigger = ScrollTrigger.create({
      trigger: zone,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        // count capsule chapters, then the machine chapter (index === count)
        const position = self.progress * (count + 1);
        setIndex(Math.min(count, Math.floor(position)));
      },
    });
    return () => trigger.kill();
  }, [count]);

  // the last chapter is the machine: the capsule morphs into it on the 3D
  // layer, so the copy talks about the machine instead of a capsule
  const isMachine = index >= count;
  const product = products[Math.min(index, count - 1)];
  const chapterKey = isMachine ? "machine" : product?.id;
  if (!product) return null;
  const name = isMachine ? t("about.machines.title") : pickLang(lang, product.name_fr, product.name_ar, product.name_en);
  const description = isMachine
    ? t("about.machines.text")
    : pickLang(lang, product.description_fr, product.description_ar, product.description_en);
  const accent = readableAccent(product.accent_color, theme);
  const beans = intensityBeans(product.slug, product.intensity);
  // the number printed on the box — the one shoppers compare
  const level = printedIntensity(product.slug);

  // the intensity scale, drawn once and reused
  const beanRow = (
    <span className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <motion.svg
          key={`${product.id}-${i}`}
          viewBox="0 0 12 16"
          className="h-4 w-3"
          aria-hidden
          initial={{ scale: 0.4, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 13, delay: 0.3 + i * 0.07 }}
        >
          <ellipse
            cx="6"
            cy="8"
            rx="5.2"
            ry="7.2"
            fill={i < beans ? accent : "none"}
            stroke={i < beans ? accent : "rgb(var(--c-line))"}
          />
          <path
            d="M6 1.4c-1.5 2.3 1.5 4.7 0 6.6s-1.5 4.3 0 6.6"
            fill="none"
            stroke={i < beans ? "rgb(var(--c-bg))" : "rgb(var(--c-line))"}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </motion.svg>
      ))}
    </span>
  );

  return (
    <div ref={zoneRef} id="variants" style={{ height: `${(count + 1) * 110}vh` }} className="relative">
      {/*
        Desktop geometry, tied to the 3D capsule rather than to a grid.

        On this pinned screen the scene parks the capsule at world x = −1.5,
        y = 0.08 (sceneConfig.ts), seen by a 35° camera at z = 6. On screen that
        is x = 50vw − 39.65vh (it depends on the aspect ratio, so it must be
        computed in CSS, not guessed in %) and y = 47.9% of the viewport. So:
          - the copy block is centred on the capsule's centre line (shifted up
            4.2vh to land on 47.9%) and MIRRORS the capsule around the screen's
            centre: its own centre sits at x = 50vw + 39.65vh;
          - a gold leader runs from the capsule's edge to the copy;
          - the capsule's own caption (its number, its intensity) hangs under it.
        RTL mirrors all of it through logical `start-*` (the scene mirrors x).
        Phones keep the stacked layout: capsule on top, copy below.
      */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <FloatingBeans count={6} seed={4} />

        {/* the leader, capsule edge → name */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-[47.9%] hidden h-px start-[calc(50vw-26.65vh)] w-[calc(66.3vh-min(17rem,21vw)-1.5rem)] bg-gradient-to-r from-transparent via-brand/50 to-brand/80 md:block rtl:bg-gradient-to-l"
        />

        {/* the capsule's caption, centred under it */}
        <div className="pointer-events-none absolute top-[72vh] hidden start-[calc(50vw-39.65vh)] -translate-x-1/2 text-center md:block rtl:translate-x-1/2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={chapterKey}
              initial={{ opacity: 0, y: 10 }}
              animate={swapIn(0.1)}
              exit={SWAP_OUT}
            >
              {!isMachine && (
                <>
                  <span className="block text-[10px] uppercase tracking-[0.3em] text-muted">
                    {t("variants.intensity")}
                  </span>
                  {level !== null && (
                    <span className="mt-1 block font-display text-5xl leading-none tabular-nums" style={{ color: accent }} dir="ltr">
                      {level}
                    </span>
                  )}
                  <span className="mt-2 flex justify-center">{beanRow}</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          ref={copyRef}
          className="max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:px-6 max-md:pb-[max(1.75rem,10vh)] md:absolute md:inset-y-0 md:start-[calc(50vw+39.65vh-min(17rem,21vw))] md:flex md:w-[min(34rem,42vw)] md:flex-col md:justify-center md:pb-[4.2vh]"
        >
          {/* top row: the section's question, sitting just above the name */}
          <div className="md:pb-5">
            <h2 className="font-display text-base italic text-muted sm:text-xl">{t("variants.title")}</h2>
          </div>

          {/* middle row: the name, on the capsule's centre line */}
          <h3 className="relative mt-2 font-display text-[2.6rem] leading-[0.95] font-medium tracking-[-0.035em] text-ink sm:text-7xl md:mt-0 lg:text-[5.25rem]">
            <AnimatePresence mode="wait" initial={false}>
              <SwapName key={chapterKey} text={name} color="currentColor" lang={lang} />
            </AnimatePresence>
          </h3>

          {/* bottom row: the tasting note, the facts, the actions */}
          <div className="md:pt-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={chapterKey}>
                <motion.p
                  className="mt-4 line-clamp-3 font-display text-[1.05rem] leading-[1.45] italic text-ink/75 sm:text-[1.3rem] md:mt-0 md:line-clamp-none"
                  initial={{ opacity: 0, y: 14 }}
                  animate={swapIn(0.12)}
                  exit={SWAP_OUT}
                >
                  {description}
                </motion.p>

                {!isMachine && (
                <motion.dl
                  className="mt-5 grid grid-cols-3 border-y border-line md:mt-8 [&>div]:max-md:py-3"
                  initial={{ opacity: 0, y: 14 }}
                  animate={swapIn(0.18)}
                  exit={SWAP_OUT}
                >
                  <div className="py-4 pe-4">
                    <dt className="text-[10px] uppercase tracking-[0.28em] text-muted">
                      {t("variants.intensity")}
                    </dt>
                    <dd
                      className="mt-1.5 flex items-center gap-2.5"
                      aria-label={level !== null ? String(level) : `${beans}/5`}
                    >
                      {level !== null && (
                        <span className="font-display text-2xl leading-none tabular-nums" style={{ color: accent }} dir="ltr">
                          {level}
                        </span>
                      )}
                      {/* a phone's third of a row holds the number OR the beans */}
                      <span className={level !== null ? "max-sm:hidden" : undefined}>{beanRow}</span>
                    </dd>
                  </div>
                  <div className="border-s border-line px-4 py-4">
                    <dt className="text-[10px] uppercase tracking-[0.28em] text-muted">
                      {t("variants.dosage")}
                    </dt>
                    <dd className="mt-2 font-display text-2xl">{product.dosage ?? "—"}</dd>
                  </div>
                  <div className="border-s border-line py-4 ps-4">
                    <dt className="text-[10px] uppercase tracking-[0.28em] text-muted">
                      {t("variants.price")}
                    </dt>
                    <dd className="mt-2 font-display text-2xl">{formatPrice(product.price)}</dd>
                  </div>
                </motion.dl>
                )}

                <motion.div
                  className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-4 md:mt-7"
                  initial={{ opacity: 0, y: 14 }}
                  animate={swapIn(0.24)}
                  exit={SWAP_OUT}
                >
                  <Link to={isMachine ? "/about" : `/product/${product.slug}`} className="group inline-block">
                    <Button className="gap-3 pe-2">
                      {isMachine ? t("variants.machineCta") : t("variants.order")}
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream/15 transition-transform duration-500 group-hover:-rotate-45 rtl:group-hover:rotate-45">
                        <ArrowRight size={15} className="rtl:-scale-x-100" />
                      </span>
                    </Button>
                  </Link>
                  {!isMachine && (
                    <Link
                      to={`/product/${product.slug}`}
                      className="border-b border-ink/30 pb-1 text-xs font-semibold uppercase tracking-[0.22em] text-ink transition-colors hover:border-brand"
                    >
                      {t("variants.view")}
                    </Link>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}

function Variants2D({ products }: { products: Product[] }) {
  const { t, lang } = useLanguage();
  const theme = useSurfaceTone();
  return (
    <section id="variants" className="mx-auto max-w-7xl px-6 py-20">
      <p className="text-sm uppercase tracking-[0.3em] text-brand">{t("variants.kicker")}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">{t("variants.title")}</h2>
      <div className="mt-10 space-y-6">
        {products.map((product, i) => {
          const image = [...(product.product_images ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order,
          )[0];
          const name = pickLang(lang, product.name_fr, product.name_ar, product.name_en);
          return (
            <div
              key={product.id}
              className={cn(
                "flex items-center gap-5 rounded-3xl border border-line bg-panel/80 p-5",
                i % 2 === 1 && "flex-row-reverse",
              )}
            >
              {image && (
                <img
                  src={dbSize(image.url, "md")}
                  alt={name}
                  width={640}
                  height={640}
                  loading="lazy"
                  decoding="async"
                  className="fx-float w-32 shrink-0 object-contain drop-shadow-xl sm:w-44"
                  style={{ animationDelay: `${i * 0.6}s` }}
                />
              )}
              <div className="min-w-0">
                <h3
                  className="font-display text-2xl font-bold"
                  style={{ color: readableAccent(product.accent_color, theme) }}
                >
                  {name}
                </h3>
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  {pickLang(lang, product.description_fr, product.description_ar, product.description_en)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="font-display text-xl text-brand">{formatPrice(product.price)}</span>
                  <Link to={`/product/${product.slug}`}>
                    <Button size="sm">{t("variants.order")}</Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
