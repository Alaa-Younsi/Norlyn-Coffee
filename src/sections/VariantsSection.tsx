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
import { getLenisInstance } from "@/lib/lenis";
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

/** The name swap: letters leave upward into a blur, the next name swings up out of its mask. */
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
                      initial={{ y: "110%", rotateX: -75 }}
                      animate={{ y: 0, rotateX: 0, filter: "blur(0px)" }}
                      exit={{ y: "-110%", rotateX: 40, filter: "blur(8px)" }}
                      transition={{ duration: 0.65, delay: order * 0.03, ease: EASE }}
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
  const fillRefs = useRef<Array<HTMLSpanElement | null>>([]);
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
        // each chapter's bar fills with the scroll through its own stretch
        fillRefs.current.forEach((fill, i) => {
          if (fill) fill.style.transform = `scaleX(${Math.min(1, Math.max(0, position - i)).toFixed(3)})`;
        });
      },
    });
    return () => trigger.kill();
  }, [count]);

  // jump to the middle of a capsule's stretch of the zone
  const goTo = (i: number) => {
    const zone = zoneRef.current;
    if (!zone) return;
    const span = zone.offsetHeight - window.innerHeight;
    const y = zone.getBoundingClientRect().top + window.scrollY + ((i + 0.5) / (count + 1)) * span;
    const lenis = getLenisInstance();
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

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
  const beans = Math.round(((product.intensity ?? 0) / 100) * 5);

  // the intensity scale, drawn once and reused
  const beanRow = (
    <span className="flex items-center gap-1" aria-label={`${beans}/5`}>
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
              initial={{ y: 10, filter: "blur(4px)" }}
              animate={{ y: 0, filter: "blur(0px)" }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {!isMachine && (
                <>
                  <span className="block font-mono text-[11px] tracking-[0.3em] text-muted">
                    0{index + 1} / 0{count}
                  </span>
                  <span className="mt-2 flex justify-center">{beanRow}</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          ref={copyRef}
          className="max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:px-6 max-md:pb-10 md:absolute md:inset-y-0 md:start-[calc(50vw+39.65vh-min(17rem,21vw))] md:flex md:w-[min(34rem,42vw)] md:flex-col md:justify-center md:pb-[4.2vh]"
        >
          {/* top row: the section's question, sitting just above the name */}
          <div className="md:pb-5">
            <h2 className="font-display text-lg italic text-muted sm:text-xl">{t("variants.title")}</h2>
          </div>

          {/* middle row: the name, on the capsule's centre line */}
          <h3 className="relative mt-4 font-display text-[3.2rem] leading-[0.95] font-medium tracking-[-0.035em] text-ink sm:text-7xl md:mt-0 lg:text-[5.25rem]">
            <AnimatePresence mode="wait" initial={false}>
              <SwapName key={chapterKey} text={name} color="currentColor" lang={lang} />
            </AnimatePresence>
          </h3>

          {/* bottom row: the tasting note, the facts, the actions, the index */}
          <div className="md:pt-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={chapterKey}>
                <motion.p
                  className="mt-6 font-display text-xl leading-[1.5] italic text-ink/75 sm:text-[1.3rem] md:mt-0"
                  initial={{ y: 18, filter: "blur(6px)" }}
                  animate={{ y: 0, filter: "blur(0px)" }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
                >
                  {description}
                </motion.p>

                {!isMachine && (
                <motion.dl
                  className="mt-8 grid grid-cols-3 border-y border-line"
                  initial={{ y: 18 }}
                  animate={{ y: 0 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.26, ease: EASE }}
                >
                  <div className="py-4 pe-4">
                    <dt className="text-[10px] uppercase tracking-[0.28em] text-muted">
                      {t("variants.intensity")}
                    </dt>
                    <dd className="mt-3">{beanRow}</dd>
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
                  className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4"
                  initial={{ y: 18 }}
                  animate={{ y: 0 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.32, ease: EASE }}
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

            {/* chapter index — same width as the spec grid above it, so the
                block has one left edge and one right edge */}
            <nav
              className="mt-8 grid gap-4"
              style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
              aria-label={t("variants.title")}
            >
              {products.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === index ? "true" : undefined}
                  className="group cursor-pointer text-start"
                >
                  <span className="block h-px w-full overflow-hidden bg-line">
                    <span
                      ref={(el) => {
                        fillRefs.current[i] = el;
                      }}
                      className="block h-full w-full origin-left scale-x-0 bg-gold-hi rtl:origin-right"
                    />
                  </span>
                  <span className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-xs tabular-nums text-brand">0{i + 1}</span>
                    <span
                      className={cn(
                        "truncate text-xs transition-colors duration-300",
                        i === index ? "text-ink" : "text-muted group-hover:text-ink",
                      )}
                    >
                      {pickLang(lang, p.name_fr, p.name_ar, p.name_en)}
                    </span>
                  </span>
                </button>
              ))}
            </nav>
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
