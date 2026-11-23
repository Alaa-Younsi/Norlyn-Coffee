import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CoffeeBeanIcon } from "@/components/effects/CoffeeBeanIcon";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatPrice } from "@/lib/format";
import { pickLang } from "@/lib/localized";
import { pick, safeUrl } from "@/lib/pageBuilder/defaults";
import type { Anim, Block, BlockOf, CtaTarget, Media } from "@/lib/pageBuilder/types";
import { tierPercent } from "@/lib/packPricing";
import { cn } from "@/lib/utils";
import { Countdown } from "./Countdown";
import { usePage } from "./context";
import { CountUp, FxTitle, MarqueeTrack, MediaView } from "./fx";
import { ICONS } from "./icons";
import type { TitleFx } from "./fx";
import { Reveal, RevealItem } from "./motion";

// ------------------------------------------------------------------ shell
const PAD = { none: "py-0", sm: "py-8", md: "py-14", lg: "py-20 @3xl:py-24", xl: "py-28 @3xl:py-36" } as const;
const WIDTH = { narrow: "max-w-3xl", normal: "max-w-6xl", wide: "max-w-7xl", full: "max-w-none" } as const;
const TONE = {
  none: "",
  surface: "bg-[var(--pb-surface)]",
  accent: "bg-[var(--pb-accent)] text-[var(--pb-bg)] [--pb-muted:color-mix(in_srgb,var(--pb-bg)_70%,transparent)]",
  gradient:
    "bg-[linear-gradient(140deg,var(--pb-surface),var(--pb-bg)_55%,color-mix(in_srgb,var(--pb-accent)_22%,var(--pb-bg)))]",
  dark: "bg-black/45",
  image: "bg-cover bg-center",
} as const;

const SECTION_ID: Partial<Record<Block["type"], string>> = { price: "pb-price", checkout: "pb-checkout" };

function useAnim(block: Block): Anim {
  const { theme } = usePage();
  return block.anim === "inherit" ? theme.anim : block.anim;
}

export function Section({ block, children, className }: { block: Block; children: ReactNode; className?: string }) {
  const { theme, dir } = usePage();
  const anim = useAnim(block);
  const image = block.tone === "image" ? safeUrl(block.toneImage) : "";
  return (
    <section
      id={SECTION_ID[block.type]}
      className={cn(
        "relative scroll-mt-24",
        PAD[block.pad],
        TONE[block.tone],
        block.hideOn === "mobile" && "@max-3xl:hidden",
        block.hideOn === "desktop" && "@3xl:hidden",
        block.align === "center" && "text-center",
      )}
      style={image ? { backgroundImage: `linear-gradient(rgb(0 0 0/0.55), rgb(0 0 0/0.55)), url("${image}")` } : undefined}
    >
      <Reveal
        anim={anim}
        dir={dir}
        speed={theme.speed}
        delay={block.delay}
        className={cn("relative z-[2] mx-auto px-5 @3xl:px-8", WIDTH[block.width], block.width === "full" && "px-0 @3xl:px-0", className)}
      >
        {children}
      </Reveal>
    </section>
  );
}

function useHeading() {
  const { theme } = usePage();
  return cn(
    "font-display font-medium tracking-[-0.03em] leading-[1]",
    theme.font === "serif" && "italic font-normal",
    theme.font === "sans" && "font-sans font-semibold tracking-[-0.02em]",
  );
}

function H2({ children, className }: { children: ReactNode; className?: string }) {
  const heading = useHeading();
  if (!children) return null;
  return <h2 className={cn(heading, "text-[2.3rem] @3xl:text-6xl", className)}>{children}</h2>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mb-4 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--pb-accent)]">
      <span aria-hidden className="h-px w-8 bg-current" />
      {children}
    </p>
  );
}

export function CtaButton({
  label,
  target,
  variant = "solid",
  className,
}: {
  label: string;
  target: CtaTarget;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  const { go, available } = usePage();
  const { t } = useLanguage();
  if (!label) return null;
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.035, y: -2 }}
      whileTap={{ scale: 0.97 }}
      disabled={!available && target !== "top"}
      onClick={() => go(target)}
      className={cn(
        "group relative inline-flex cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full px-8 py-4 text-sm font-semibold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "solid"
          ? "pb-pulse bg-[linear-gradient(120deg,var(--pb-accent),var(--pb-accent2))] text-[var(--pb-bg)] shadow-[0_18px_40px_-14px_color-mix(in_srgb,var(--pb-accent)_80%,transparent)]"
          : "border border-[color-mix(in_srgb,var(--pb-text)_30%,transparent)] hover:border-[var(--pb-accent)]",
        className,
      )}
    >
      {/* light sweep on hover */}
      <span
        aria-hidden
        className="absolute inset-y-0 -start-1/2 w-1/3 -skew-x-12 bg-white/30 opacity-0 transition-all duration-700 group-hover:start-[120%] group-hover:opacity-100"
      />
      <span className="relative">{available || target === "top" ? label : t("product.outOfStock")}</span>
      <ArrowRight size={16} className="relative transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
    </motion.button>
  );
}

function PriceTag({ size = "md" }: { size?: "md" | "lg" }) {
  const { unit, compare, lineTotal, qty } = usePage();
  const { t } = useLanguage();
  if (unit === null) return null;
  const save = compare ? Math.round(((compare - unit) / compare) * 100) : 0;
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <motion.span
        key={lineTotal ?? unit}
        initial={{ y: 10, opacity: 0.4 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn("font-display tabular-nums", size === "lg" ? "text-6xl @3xl:text-7xl" : "text-4xl")}
      >
        {formatPrice(qty > 1 && lineTotal !== null ? lineTotal : unit)}
      </motion.span>
      {compare && (
        <span className="text-lg text-[var(--pb-muted)] line-through">{formatPrice(qty > 1 ? compare * qty : compare)}</span>
      )}
      {save > 0 && (
        <span className="rounded-full bg-[var(--pb-accent)] px-3 py-1 text-xs font-bold text-[var(--pb-bg)]">
          −{save} % · {t("pb.save")}
        </span>
      )}
    </div>
  );
}

function QtyPicker() {
  const { qty, setQty, maxQty } = usePage();
  const { t } = useLanguage();
  return (
    <div className="inline-flex items-center gap-4 rounded-full border border-[color-mix(in_srgb,var(--pb-text)_22%,transparent)] px-4 py-2.5">
      <button type="button" aria-label={t("product.decrease")} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setQty(Math.max(1, qty - 1))}>
        <Minus size={15} />
      </button>
      <motion.span key={qty} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="w-6 text-center font-display text-lg tabular-nums">
        {qty}
      </motion.span>
      <button type="button" aria-label={t("product.increase")} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setQty(Math.min(maxQty, qty + 1))}>
        <Plus size={15} />
      </button>
    </div>
  );
}

/** list items stagger only when the theme asks for it */
function useItemAnim(block: Block): Anim {
  const { theme } = usePage();
  const anim = useAnim(block);
  return theme.stagger && anim !== "none" ? anim : "none";
}

function Stagger({ block, className, children }: { block: Block; className?: string; children: ReactNode }) {
  const { theme, dir } = usePage();
  const itemAnim = useItemAnim(block);
  if (itemAnim === "none") return <div className={className}>{children}</div>;
  return (
    <Reveal anim={itemAnim} dir={dir} speed={theme.speed} stagger className={className}>
      {children}
    </Reveal>
  );
}

function Item({ block, className, children }: { block: Block; className?: string; children: ReactNode }) {
  const { theme, dir } = usePage();
  return (
    <RevealItem anim={useItemAnim(block)} dir={dir} speed={theme.speed} className={className}>
      {children}
    </RevealItem>
  );
}

// ------------------------------------------------------------------- hero
function HeroSlides({ media, fx, className }: { media: Media[]; fx: BlockOf<"hero">["data"]["mediaFx"]; className?: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (media.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % media.length), 4200);
    return () => window.clearInterval(id);
  }, [media.length]);
  return (
    // the caller decides the positioning ("relative …" or "absolute inset-0"):
    // cn() doesn't merge, so a default "relative" here would fight "absolute"
    <div className={className ?? "relative"}>
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <MediaView media={media[index]} fx={fx} className="h-full w-full rounded-[inherit]" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Hero({ block }: { block: BlockOf<"hero"> }) {
  const { lang, theme, dir } = usePage();
  const anim = useAnim(block);
  const d = block.data;
  const heading = useHeading();
  const title = pick(d.title, lang);
  const badge = pick(d.badge, lang);
  const text = (
    <div className={cn("relative z-[2]", d.layout === "split" ? "" : "mx-auto max-w-3xl")}>
      <Eyebrow>{pick(d.eyebrow, lang)}</Eyebrow>
      <h1 className={cn(heading, "text-[3rem] @3xl:text-7xl @5xl:text-8xl")}>
        <FxTitle text={title} fx={d.titleFx as TitleFx} />
      </h1>
      {pick(d.subtitle, lang) && (
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--pb-muted)] [.text-center_&]:mx-auto">{pick(d.subtitle, lang)}</p>
      )}
      {d.showPrice && (
        <div className={cn("mt-8", block.align === "center" && "flex justify-center")}>
          <PriceTag size="lg" />
        </div>
      )}
      <div className={cn("mt-9 flex flex-wrap gap-3", block.align === "center" && "justify-center")}>
        <CtaButton label={pick(d.cta, lang)} target={d.ctaTarget} />
        <CtaButton label={pick(d.cta2, lang)} target={d.cta2Target} variant="ghost" />
      </div>
    </div>
  );
  const mediaBox = (
    <div className="relative">
      {theme.glow && (
        <div aria-hidden className="absolute inset-[8%] rounded-full bg-[var(--pb-accent)] opacity-25 blur-[90px]" />
      )}
      <HeroSlides
        media={d.media}
        fx={d.mediaFx}
        className="relative aspect-[4/5] overflow-hidden rounded-[var(--pb-radius)] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)] @3xl:aspect-square"
      />
      {badge && (
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          whileInView={{ scale: 1, rotate: -12 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.6 }}
          className="absolute -top-4 end-4 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--pb-accent)] p-3 text-center text-xs font-bold uppercase leading-tight text-[var(--pb-bg)] shadow-xl @3xl:h-28 @3xl:w-28 @3xl:text-sm"
        >
          {badge}
        </motion.div>
      )}
    </div>
  );

  if (d.layout === "cover") {
    return (
      <section className={cn("relative flex min-h-[92svh] items-end overflow-hidden", block.hideOn === "mobile" && "@max-3xl:hidden", block.hideOn === "desktop" && "@3xl:hidden")}>
        <HeroSlides media={d.media} fx={d.mediaFx} className="absolute inset-0" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--pb-bg),color-mix(in_srgb,var(--pb-bg)_55%,transparent)_45%,transparent)]" />
        <div className={cn("relative mx-auto w-full max-w-6xl px-5 pb-16 pt-40 @3xl:px-8 @3xl:pb-24", block.align === "center" && "text-center")}>
          <Reveal anim={anim} dir={dir} speed={theme.speed}>
            {text}
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <Section block={block}>
      {d.layout === "split" ? (
        <div className="grid items-center gap-12 pt-8 @3xl:grid-cols-[1.05fr_1fr] @3xl:gap-16">
          <div className="@max-3xl:order-2">{text}</div>
          {mediaBox}
        </div>
      ) : d.layout === "stacked" ? (
        <div className="pt-8">
          {text}
          <div className="mx-auto mt-14 max-w-4xl">{mediaBox}</div>
        </div>
      ) : (
        <div className="pt-10">{text}</div>
      )}
    </Section>
  );
}

// -------------------------------------------------------------- countdown
function CountdownBlock({ block }: { block: BlockOf<"countdown"> }) {
  const { lang } = usePage();
  const { t } = useLanguage();
  const d = block.data;
  return (
    <Section block={block}>
      <div className="flex flex-col items-center gap-6 text-center">
        {pick(d.title, lang) && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--pb-accent)]">{pick(d.title, lang)}</p>
        )}
        <Countdown
          data={d}
          blockId={block.id}
          labels={[t("pb.days"), t("pb.hours"), t("pb.minutes"), t("pb.seconds")]}
          expiredText={pick(d.expired, lang)}
        />
        {pick(d.subtitle, lang) && <p className="text-[var(--pb-muted)]">{pick(d.subtitle, lang)}</p>}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- gallery
const ASPECT = { square: "aspect-square", portrait: "aspect-[4/5]", landscape: "aspect-[16/10]", auto: "" } as const;
const HOVER = {
  none: "",
  zoom: "[&_img]:transition-transform [&_img]:duration-700 hover:[&_img]:scale-110 [&_video]:transition-transform [&_video]:duration-700 hover:[&_video]:scale-110",
  tilt: "transition-transform duration-500 hover:-rotate-2 hover:scale-[1.03]",
  lift: "transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-20px_rgb(0_0_0/0.7)]",
} as const;

function Gallery({ block }: { block: BlockOf<"gallery"> }) {
  const { lang } = usePage();
  const d = block.data;
  const tile = (item: BlockOf<"gallery">["data"]["items"][number], i: number, extra = "") => (
    <figure key={i} className={cn("group relative overflow-hidden rounded-[var(--pb-radius)]", HOVER[d.hover], extra)}>
      <MediaView media={item} className={cn("h-full w-full", d.aspect === "auto" ? "" : ASPECT[d.aspect])} />
      {pick(item.caption, lang) && (
        <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-[linear-gradient(to_top,rgb(0_0_0/0.75),transparent)] p-4 text-sm text-white transition-transform duration-500 group-hover:translate-y-0">
          {pick(item.caption, lang)}
        </figcaption>
      )}
    </figure>
  );

  let body: ReactNode;
  if (d.layout === "marquee") {
    body = (
      <MarqueeTrack speed={40}>
        {d.items.map((item, i) => (
          <div key={i} className="me-5 w-64 shrink-0 @3xl:w-80">
            {tile(item, i, "aspect-[4/5]")}
          </div>
        ))}
      </MarqueeTrack>
    );
  } else if (d.layout === "carousel") {
    body = (
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none]">
        {d.items.map((item, i) => (
          <div key={i} className="w-[78%] shrink-0 snap-center @3xl:w-[42%]">
            {tile(item, i, "aspect-[4/5]")}
          </div>
        ))}
      </div>
    );
  } else if (d.layout === "stack") {
    body = (
      <div className="group/stack relative mx-auto h-[26rem] max-w-md @3xl:h-[32rem]">
        {d.items.slice(0, 5).map((item, i, all) => {
          const mid = (all.length - 1) / 2;
          return (
            <div
              key={i}
              className="absolute inset-x-[12%] top-[6%] bottom-[6%] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
              style={{
                transform: `rotate(${(i - mid) * 4}deg)`,
                zIndex: i,
                ["--fan" as string]: `${(i - mid) * 38}%`,
              }}
            >
              <div className="h-full w-full transition-transform duration-700 group-hover/stack:translate-x-[var(--fan)]">
                {tile(item, i, "h-full shadow-2xl")}
              </div>
            </div>
          );
        })}
      </div>
    );
  } else {
    const cols = { 2: "@3xl:grid-cols-2", 3: "@3xl:grid-cols-3", 4: "@3xl:grid-cols-4" }[d.columns];
    body = (
      <Stagger block={block} className={cn("grid grid-cols-2 gap-3 @3xl:gap-5", cols, d.layout === "mosaic" && "auto-rows-[11rem] @3xl:auto-rows-[15rem]")}>
        {d.items.map((item, i) => (
          <Item
            key={i}
            block={block}
            className={cn(d.layout === "mosaic" && (i % 5 === 0 ? "col-span-2 row-span-2" : i % 5 === 3 ? "row-span-2" : ""))}
          >
            {tile(item, i, d.layout === "mosaic" ? "h-full" : "")}
          </Item>
        ))}
      </Stagger>
    );
  }
  return (
    <Section block={block}>
      {pick(d.title, lang) && <H2 className="mb-10">{pick(d.title, lang)}</H2>}
      {body}
    </Section>
  );
}

// ------------------------------------------------------------------ video
const FRAME = {
  none: "",
  rounded: "overflow-hidden rounded-[var(--pb-radius)] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)]",
  phone: "mx-auto aspect-[9/19] max-w-[20rem] overflow-hidden rounded-[2.8rem] border-[10px] border-neutral-900 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)] ring-1 ring-white/10",
  cinema: "aspect-[2.35/1] overflow-hidden shadow-[0_0_0_1px_rgb(255_255_255/0.06),0_40px_80px_-30px_rgb(0_0_0/0.8)]",
  glass:
    "overflow-hidden rounded-[var(--pb-radius)] border border-white/15 bg-white/5 p-2 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)] backdrop-blur [&>*]:rounded-[calc(var(--pb-radius)-6px)]",
} as const;

function VideoBlock({ block }: { block: BlockOf<"video"> }) {
  const { lang } = usePage();
  const d = block.data;
  return (
    <Section block={block}>
      {pick(d.title, lang) && <H2 className="mb-10">{pick(d.title, lang)}</H2>}
      <div className={FRAME[d.frame]}>
        <MediaView
          media={d.media}
          controls={d.controls}
          autoplay={d.autoplay}
          loop={d.loop}
          className={cn("w-full", d.frame === "phone" || d.frame === "cinema" ? "h-full" : "aspect-video")}
        />
      </div>
      {pick(d.caption, lang) && <p className="mt-4 text-sm text-[var(--pb-muted)]">{pick(d.caption, lang)}</p>}
    </Section>
  );
}

// ----------------------------------------------------------------- image
function ImageBlock({ block }: { block: BlockOf<"image"> }) {
  const { lang } = usePage();
  const d = block.data;
  const h = { auto: "aspect-[16/9]", screen: "h-[85svh]", half: "h-[55svh]" }[d.height];
  return (
    <Section block={block}>
      <MediaView media={d.media} fx={d.fx} className={cn("w-full", h, d.rounded && "rounded-[var(--pb-radius)]")} />
      {pick(d.caption, lang) && <p className="mt-4 text-center text-sm text-[var(--pb-muted)]">{pick(d.caption, lang)}</p>}
    </Section>
  );
}

// -------------------------------------------------------------- features
function Features({ block }: { block: BlockOf<"features"> }) {
  const { lang } = usePage();
  const d = block.data;
  const cols = { 2: "@3xl:grid-cols-2", 3: "@3xl:grid-cols-3", 4: "@3xl:grid-cols-2 @5xl:grid-cols-4" }[d.columns];
  return (
    <Section block={block}>
      <H2>{pick(d.title, lang)}</H2>
      {pick(d.subtitle, lang) && <p className="mt-4 max-w-2xl text-[var(--pb-muted)] [.text-center_&]:mx-auto">{pick(d.subtitle, lang)}</p>}
      <Stagger
        block={block}
        className={cn(
          "mt-12 grid gap-4 @3xl:gap-6",
          d.style === "list" ? "grid-cols-1" : cn("grid-cols-1 @xl:grid-cols-2", cols),
          d.style === "bento" && "@3xl:auto-rows-[13rem]",
        )}
      >
        {d.items.map((item, i) => {
          const Icon = ICONS[item.icon] ?? ICONS.sparkles;
          return (
            <Item
              key={i}
              block={block}
              className={cn(d.style === "bento" && i === 0 && "@3xl:col-span-2 @3xl:row-span-2")}
            >
              <div
                className={cn(
                  "group relative h-full overflow-hidden text-start transition-all duration-500",
                  d.style === "cards" || d.style === "bento"
                    ? "rounded-[var(--pb-radius)] border border-[color-mix(in_srgb,var(--pb-text)_10%,transparent)] bg-[color-mix(in_srgb,var(--pb-surface)_80%,transparent)] p-7 hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--pb-accent)_50%,transparent)]"
                    : d.style === "list"
                      ? "flex items-start gap-5 border-b border-[color-mix(in_srgb,var(--pb-text)_10%,transparent)] py-5"
                      : "flex flex-col items-center p-4 text-center",
                )}
              >
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--pb-accent)_16%,transparent)] text-[var(--pb-accent)] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110",
                    d.style === "icons" ? "h-16 w-16" : "h-12 w-12",
                  )}
                >
                  <Icon size={d.style === "icons" ? 28 : 22} />
                </span>
                <div className={cn(d.style !== "list" && "mt-5")}>
                  <h3 className={cn("font-display text-xl", d.style === "bento" && i === 0 && "@3xl:text-3xl")}>{pick(item.title, lang)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--pb-muted)]">{pick(item.text, lang)}</p>
                </div>
                {(d.style === "cards" || d.style === "bento") && (
                  <span aria-hidden className="absolute -end-10 -top-10 h-32 w-32 rounded-full bg-[var(--pb-accent)] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20" />
                )}
              </div>
            </Item>
          );
        })}
      </Stagger>
    </Section>
  );
}

// ------------------------------------------------------------------ story
function Story({ block }: { block: BlockOf<"story"> }) {
  const { lang } = usePage();
  const d = block.data;
  const paragraphs = pick(d.text, lang).split(/\n\s*\n/).filter(Boolean);
  return (
    <Section block={block}>
      <div className="grid items-center gap-10 text-start @3xl:grid-cols-2 @3xl:gap-16">
        <MediaView
          media={d.media}
          fx={d.mediaFx}
          className={cn("aspect-[4/5] rounded-[var(--pb-radius)]", d.side === "end" && "@3xl:order-2")}
        />
        <div>
          <Eyebrow>{pick(d.eyebrow, lang)}</Eyebrow>
          <H2>{pick(d.title, lang)}</H2>
          {paragraphs.map((p, i) => (
            <p key={i} className="mt-5 text-lg leading-relaxed text-[var(--pb-muted)]">
              {p}
            </p>
          ))}
          {pick(d.quote, lang) && (
            <blockquote className="mt-8 border-s-2 border-[var(--pb-accent)] ps-5 font-display text-2xl italic">
              {pick(d.quote, lang)}
            </blockquote>
          )}
        </div>
      </div>
    </Section>
  );
}

// --------------------------------------------------------------- contents
function Contents({ block }: { block: BlockOf<"contents"> }) {
  const { lang, items, coverUrl } = usePage();
  const d = block.data;
  if (items.length === 0) return null;
  const card = (entry: (typeof items)[number]) => {
    const p = entry.product;
    const imgUrl = p.product_images?.[0]?.url;
    return (
      <div className="group relative h-full overflow-hidden rounded-[var(--pb-radius)] border border-[color-mix(in_srgb,var(--pb-text)_10%,transparent)] bg-[var(--pb-surface)] p-5 text-center transition-all duration-500 hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--pb-accent)_50%,transparent)]">
        <span className="absolute end-3 top-3 rounded-full bg-[var(--pb-accent)] px-2.5 py-1 text-xs font-bold text-[var(--pb-bg)]">
          ×{entry.quantity}
        </span>
        {imgUrl && (
          <img src={imgUrl} alt="" loading="lazy" className="mx-auto aspect-square w-full max-w-[11rem] object-contain transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3" />
        )}
        <p className="mt-3 font-display text-lg">{pickLang(lang, p.name_fr, p.name_ar, p.name_en)}</p>
        {d.showPrices && <p className="mt-1 text-sm text-[var(--pb-muted)]">{formatPrice(entry.unitPrice)}</p>}
      </div>
    );
  };
  return (
    <Section block={block}>
      <H2>{pick(d.title, lang)}</H2>
      {pick(d.subtitle, lang) && <p className="mt-4 text-[var(--pb-muted)]">{pick(d.subtitle, lang)}</p>}
      {d.style === "orbit" ? (
        <div className="relative mx-auto mt-12 aspect-square w-full max-w-[34rem]">
          <div className="absolute inset-[30%] overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--pb-accent)_40%,transparent)] bg-[var(--pb-surface)] shadow-[0_0_80px_-10px_color-mix(in_srgb,var(--pb-accent)_45%,transparent)]">
            {coverUrl && <img src={coverUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="pb-spin absolute inset-0 [animation-duration:60s]">
            {items.map((entry, i) => {
              const a = (i / items.length) * Math.PI * 2;
              const imgUrl = entry.product.product_images?.[0]?.url;
              return (
                <div
                  key={entry.product.id}
                  className="absolute h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${50 + Math.cos(a) * 40}%`, top: `${50 + Math.sin(a) * 40}%` }}
                >
                  <div className="pb-spin h-full w-full [animation-direction:reverse] [animation-duration:60s]">
                    <div className="relative h-full w-full rounded-full border border-[color-mix(in_srgb,var(--pb-text)_14%,transparent)] bg-[var(--pb-surface)] p-2 transition-transform hover:scale-110">
                      {imgUrl && <img src={imgUrl} alt="" className="h-full w-full object-contain" />}
                      <span className="absolute -bottom-1 -end-1 rounded-full bg-[var(--pb-accent)] px-2 text-xs font-bold text-[var(--pb-bg)]">×{entry.quantity}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : d.style === "list" ? (
        <Stagger block={block} className="mt-10 divide-y divide-[color-mix(in_srgb,var(--pb-text)_10%,transparent)] text-start">
          {items.map((entry) => (
            <Item key={entry.product.id} block={block}>
              <div className="flex items-center gap-5 py-4">
                {entry.product.product_images?.[0]?.url && (
                  <img src={entry.product.product_images[0].url} alt="" className="h-16 w-16 object-contain" />
                )}
                <span className="flex-1 font-display text-xl">
                  {pickLang(lang, entry.product.name_fr, entry.product.name_ar, entry.product.name_en)}
                </span>
                <span className="text-[var(--pb-accent)]">×{entry.quantity}</span>
                {d.showPrices && <span className="w-24 text-end text-sm text-[var(--pb-muted)]">{formatPrice(entry.unitPrice * entry.quantity)}</span>}
              </div>
            </Item>
          ))}
        </Stagger>
      ) : (
        <Stagger
          block={block}
          className={cn(
            "mt-10 grid gap-4",
            d.style === "stack" ? "grid-cols-2 @3xl:grid-cols-3" : "grid-cols-2 @3xl:grid-cols-4",
          )}
        >
          {items.map((entry) => (
            <Item key={entry.product.id} block={block}>
              {card(entry)}
            </Item>
          ))}
        </Stagger>
      )}
    </Section>
  );
}

// ------------------------------------------------------------------ price
function PriceBlock({ block }: { block: BlockOf<"price"> }) {
  const { lang, unit, list, tiers, freeShipping, qty, kind, compare } = usePage();
  const { t } = useLanguage();
  const d = block.data;
  if (unit === null) return null;
  const separately = list ?? compare;
  const saved = separately && separately > unit ? separately - unit : 0;
  const pct = tierPercent(qty, { tiers });

  const breakdown = d.showBreakdown && separately && saved > 0 && (
    <dl className="mt-6 space-y-2 text-sm">
      <div className="flex justify-between gap-6">
        <dt className="text-[var(--pb-muted)]">{kind === "pack" ? t("pb.separately") : t("pb.regular")}</dt>
        <dd className="line-through opacity-70">{formatPrice(separately)}</dd>
      </div>
      <div className="flex justify-between gap-6">
        <dt className="text-[var(--pb-muted)]">{t("pb.youSave")}</dt>
        <dd className="font-semibold text-[var(--pb-accent)]">−{formatPrice(saved)}</dd>
      </div>
      {pct > 0 && (
        <div className="flex justify-between gap-6">
          <dt className="text-[var(--pb-muted)]">{t("pb.tierApplied")}</dt>
          <dd className="font-semibold text-[var(--pb-accent)]">−{pct} %</dd>
        </div>
      )}
      {freeShipping && (
        <div className="flex justify-between gap-6">
          <dt className="text-[var(--pb-muted)]">{t("checkout.shipping")}</dt>
          <dd className="font-semibold text-[var(--pb-accent)]">{t("checkout.shippingFree")}</dd>
        </div>
      )}
    </dl>
  );

  const tierTable = d.showTiers && tiers.length > 0 && (
    <div className="mt-6 flex flex-wrap gap-2 [.text-center_&]:justify-center">
      {tiers.map((tier) => (
        <span
          key={tier.qty}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            qty >= tier.qty && pct === tier.percent
              ? "border-[var(--pb-accent)] bg-[var(--pb-accent)] text-[var(--pb-bg)]"
              : "border-[color-mix(in_srgb,var(--pb-text)_20%,transparent)]",
          )}
        >
          {t("pb.tier").replace("{qty}", String(tier.qty)).replace("{pct}", String(tier.percent))}
        </span>
      ))}
    </div>
  );

  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--pb-accent)]">{pick(d.title, lang)}</p>
      <div className={cn("mt-4", block.align === "center" && "flex justify-center")}>
        <PriceTag size="lg" />
      </div>
      {breakdown}
      {tierTable}
      <div className={cn("mt-8 flex flex-wrap items-center gap-4", block.align === "center" && "justify-center")}>
        {d.showQuantity && <QtyPicker />}
        <CtaButton label={pick(d.cta, lang)} target={d.ctaTarget} />
      </div>
      {pick(d.note, lang) && (
        <p className="mt-5 flex items-center gap-2 text-sm text-[var(--pb-muted)] [.text-center_&]:justify-center">
          <Check size={15} className="text-[var(--pb-accent)]" />
          {pick(d.note, lang)}
        </p>
      )}
    </>
  );

  return (
    <Section block={block}>
      {d.style === "card" ? (
        <div className="relative mx-auto max-w-xl overflow-hidden rounded-[calc(var(--pb-radius)*1.3)] border border-[color-mix(in_srgb,var(--pb-accent)_35%,transparent)] bg-[var(--pb-surface)] p-8 shadow-[0_40px_90px_-40px_color-mix(in_srgb,var(--pb-accent)_55%,transparent)] @3xl:p-12">
          <span aria-hidden className="pb-orb absolute -end-20 -top-20 h-56 w-56 rounded-full bg-[var(--pb-accent)] opacity-20 blur-3xl" />
          <div className="relative">{inner}</div>
        </div>
      ) : d.style === "ticket" ? (
        <div className="relative mx-auto max-w-2xl rounded-[var(--pb-radius)] border-2 border-dashed border-[color-mix(in_srgb,var(--pb-accent)_60%,transparent)] bg-[var(--pb-surface)] p-8 @3xl:p-12">
          <span aria-hidden className="absolute -start-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[var(--pb-bg)]" />
          <span aria-hidden className="absolute -end-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[var(--pb-bg)]" />
          {inner}
        </div>
      ) : d.style === "banner" ? (
        <div className="rounded-[var(--pb-radius)] bg-[linear-gradient(120deg,var(--pb-surface),color-mix(in_srgb,var(--pb-accent)_18%,var(--pb-surface)))] p-8 @3xl:p-12">
          {inner}
        </div>
      ) : (
        inner
      )}
    </Section>
  );
}

// ------------------------------------------------------------------ stats
function Stats({ block }: { block: BlockOf<"stats"> }) {
  const { lang } = usePage();
  const d = block.data;
  return (
    <Section block={block}>
      <H2 className="mb-10">{pick(d.title, lang)}</H2>
      <Stagger block={block} className="grid grid-cols-2 gap-4 @3xl:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
        {d.items.map((item, i) => (
          <Item key={i} block={block}>
            <div
              className={cn(
                "flex h-full flex-col items-center justify-center p-6 text-center",
                d.style === "cards" && "rounded-[var(--pb-radius)] border border-[color-mix(in_srgb,var(--pb-text)_10%,transparent)] bg-[var(--pb-surface)]",
                d.style === "rings" && "mx-auto aspect-square w-full max-w-[12rem] rounded-full border-2 border-[color-mix(in_srgb,var(--pb-accent)_45%,transparent)]",
              )}
            >
              <span className="font-display text-5xl text-[var(--pb-accent)] @3xl:text-6xl">
                <CountUp value={item.value} prefix={item.prefix} suffix={item.suffix} />
              </span>
              <span className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--pb-muted)]">{pick(item.label, lang)}</span>
            </div>
          </Item>
        ))}
      </Stagger>
    </Section>
  );
}

// ----------------------------------------------------------- testimonials
function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5 text-[var(--pb-accent)] [.text-center_&]:justify-center">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < n ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

function Testimonials({ block }: { block: BlockOf<"testimonials"> }) {
  const { lang } = usePage();
  const d = block.data;
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (d.style !== "spotlight" || d.items.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % d.items.length), 5000);
    return () => window.clearInterval(id);
  }, [d.style, d.items.length]);

  const card = (item: (typeof d.items)[number], i: number) => (
    <div key={i} className="h-full rounded-[var(--pb-radius)] border border-[color-mix(in_srgb,var(--pb-text)_10%,transparent)] bg-[var(--pb-surface)] p-7 text-start">
      <Stars n={item.rating} />
      <p className="mt-4 font-display text-lg leading-snug">“{pick(item.text, lang)}”</p>
      <p className="mt-5 text-sm font-semibold">{item.name}</p>
      {pick(item.meta, lang) && <p className="text-xs text-[var(--pb-muted)]">{pick(item.meta, lang)}</p>}
    </div>
  );

  return (
    <Section block={block}>
      <H2 className="mb-10">{pick(d.title, lang)}</H2>
      {d.style === "marquee" ? (
        <MarqueeTrack speed={45}>
          {d.items.map((item, i) => (
            <div key={i} className="me-5 w-80 shrink-0">
              {card(item, i)}
            </div>
          ))}
        </MarqueeTrack>
      ) : d.style === "spotlight" ? (
        <div className="relative mx-auto min-h-[14rem] max-w-3xl text-center">
          <AnimatePresence mode="wait">
            {d.items[index] && (
              <motion.figure
                key={index}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
                transition={{ duration: 0.6 }}
              >
                <Stars n={d.items[index].rating} />
                <blockquote className="mt-6 font-display text-3xl italic leading-snug @3xl:text-4xl">
                  “{pick(d.items[index].text, lang)}”
                </blockquote>
                <figcaption className="mt-6 text-sm font-semibold">{d.items[index].name}</figcaption>
              </motion.figure>
            )}
          </AnimatePresence>
          <div className="mt-8 flex justify-center gap-2">
            {d.items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={String(i + 1)}
                onClick={() => setIndex(i)}
                className={cn("h-1.5 cursor-pointer rounded-full transition-all", i === index ? "w-8 bg-[var(--pb-accent)]" : "w-1.5 bg-[color-mix(in_srgb,var(--pb-text)_30%,transparent)]")}
              />
            ))}
          </div>
        </div>
      ) : (
        <Stagger block={block} className="grid gap-4 @3xl:grid-cols-3">
          {d.items.map((item, i) => (
            <Item key={i} block={block}>
              {card(item, i)}
            </Item>
          ))}
        </Stagger>
      )}
    </Section>
  );
}

// -------------------------------------------------------------------- faq
function FaqRow({ q, a, cards }: { q: string; a: string; cards: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "text-start",
        cards
          ? "rounded-[var(--pb-radius)] border border-[color-mix(in_srgb,var(--pb-text)_10%,transparent)] bg-[var(--pb-surface)] px-6"
          : "border-b border-[color-mix(in_srgb,var(--pb-text)_12%,transparent)]",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-start font-display text-xl"
      >
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-[var(--pb-accent)]">
          <ChevronDown size={20} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 leading-relaxed text-[var(--pb-muted)]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Faq({ block }: { block: BlockOf<"faq"> }) {
  const { lang } = usePage();
  const d = block.data;
  return (
    <Section block={block}>
      <H2 className="mb-10">{pick(d.title, lang)}</H2>
      <Stagger block={block} className={cn("mx-auto max-w-3xl", d.style === "cards" && "space-y-3")}>
        {d.items.map((item, i) => (
          <Item key={i} block={block}>
            <FaqRow q={pick(item.q, lang)} a={pick(item.a, lang)} cards={d.style === "cards"} />
          </Item>
        ))}
      </Stagger>
    </Section>
  );
}

// ---------------------------------------------------------------- marquee
function Marquee({ block }: { block: BlockOf<"marquee"> }) {
  const { lang } = usePage();
  const d = block.data;
  const size = { sm: "text-2xl", md: "text-4xl @3xl:text-5xl", lg: "text-5xl @3xl:text-8xl" }[d.size];
  const sep =
    d.separator === "bean" ? (
      <CoffeeBeanIcon className="mx-6 h-[0.5em] w-auto shrink-0 opacity-80 @3xl:mx-10" />
    ) : d.separator === "dot" ? (
      <span className="mx-6 h-[0.25em] w-[0.25em] shrink-0 rounded-full bg-current @3xl:mx-10" />
    ) : d.separator === "star" ? (
      <span className="mx-6 shrink-0 @3xl:mx-10">✦</span>
    ) : (
      <span className="mx-6" />
    );
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        PAD[block.pad],
        TONE[block.tone],
        block.hideOn === "mobile" && "@max-3xl:hidden",
        block.hideOn === "desktop" && "@3xl:hidden",
        d.skew && "my-8 -rotate-2 scale-[1.04]",
      )}
    >
      <MarqueeTrack speed={d.speed} reverse={d.reverse}>
        {d.items.map((item, i) => (
          <span
            key={i}
            className={cn(
              "flex shrink-0 items-center font-display uppercase leading-none tracking-[-0.02em] whitespace-nowrap",
              size,
              d.style === "accent" && block.tone !== "accent" && "text-[var(--pb-accent)]",
            )}
          >
            <span
              className={cn(
                d.style === "outline" && "text-transparent [-webkit-text-stroke-width:1.5px]",
                d.style === "outline" &&
                  (block.tone === "accent" ? "[-webkit-text-stroke-color:var(--pb-bg)]" : "[-webkit-text-stroke-color:var(--pb-text)]"),
              )}
            >
              {pick(item, lang)}
            </span>
            {sep}
          </span>
        ))}
      </MarqueeTrack>
    </section>
  );
}

// ------------------------------------------------------------------- text
function TextBlock({ block }: { block: BlockOf<"text"> }) {
  const { lang } = usePage();
  const d = block.data;
  const paragraphs = pick(d.body, lang).split(/\n\s*\n/).filter(Boolean);
  const body = { sm: "text-base", md: "text-lg", lg: "text-2xl font-display" }[d.size];
  return (
    <Section block={block}>
      <Eyebrow>{pick(d.eyebrow, lang)}</Eyebrow>
      <H2>{pick(d.title, lang)}</H2>
      <div className={cn("mt-6 max-w-3xl space-y-5 leading-relaxed text-[var(--pb-muted)] [.text-center_&]:mx-auto", body)}>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Section>
  );
}

// -------------------------------------------------------------------- cta
function Cta({ block }: { block: BlockOf<"cta"> }) {
  const { lang, theme } = usePage();
  const d = block.data;
  const content = (
    <>
      <H2>{pick(d.title, lang)}</H2>
      {pick(d.text, lang) && <p className="mt-5 text-lg text-[var(--pb-muted)]">{pick(d.text, lang)}</p>}
      <div className="mt-9">
        <CtaButton label={pick(d.button, lang)} target={d.target} />
      </div>
    </>
  );
  if (d.style === "split" && d.media) {
    return (
      <Section block={block}>
        <div className="grid items-center gap-10 overflow-hidden rounded-[calc(var(--pb-radius)*1.3)] bg-[var(--pb-surface)] text-start @3xl:grid-cols-2">
          <MediaView media={d.media} fx="kenburns" className="aspect-[4/3] h-full" />
          <div className="p-8 @3xl:p-12">{content}</div>
        </div>
      </Section>
    );
  }
  return (
    <Section block={block}>
      <div
        className={cn(
          "relative overflow-hidden rounded-[calc(var(--pb-radius)*1.3)] px-6 py-16 text-center @3xl:py-24",
          d.style === "glow"
            ? "border border-[color-mix(in_srgb,var(--pb-accent)_35%,transparent)] bg-[var(--pb-surface)]"
            : "bg-[linear-gradient(120deg,color-mix(in_srgb,var(--pb-accent)_25%,var(--pb-surface)),var(--pb-surface))]",
        )}
      >
        {d.style === "glow" && theme.glow && (
          <div aria-hidden className="pb-orb absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--pb-accent)] opacity-25 blur-[100px]" />
        )}
        <div className="relative">{content}</div>
      </div>
    </Section>
  );
}

// --------------------------------------------------------------- checkout
function CheckoutBlock({ block }: { block: BlockOf<"checkout"> }) {
  const { lang, checkoutLines, onOrdered, preview, name, items, coverUrl, kind, available } = usePage();
  const { t } = useLanguage();
  const d = block.data;
  const form = !available ? (
    <p className="py-10 text-center text-[var(--pb-muted)]">{t("product.outOfStock")}</p>
  ) : preview ? (
    // the editor preview never places a real order
    <div className="space-y-3">
      {[t("checkout.name"), t("checkout.phone"), t("checkout.wilaya")].map((label) => (
        <div key={label} className="rounded-xl border border-[color-mix(in_srgb,var(--pb-text)_15%,transparent)] px-4 py-3 text-sm text-[var(--pb-muted)]">
          {label}
        </div>
      ))}
      <div className="rounded-full bg-[var(--pb-accent)] py-3.5 text-center text-sm font-semibold text-[var(--pb-bg)]">{t("checkout.place")}</div>
      <p className="text-center text-xs text-[var(--pb-muted)]">{t("pb.previewForm")}</p>
    </div>
  ) : (
    <CheckoutForm compact intent="focus" intentKey={`pb-${block.id}`} lines={checkoutLines} onSuccess={onOrdered} />
  );

  const summary = d.showSummary && (
    <div className="text-start">
      <Eyebrow>{kind === "pack" ? t("pb.pack") : t("pb.yourOrder")}</Eyebrow>
      <H2 className="text-4xl @3xl:text-5xl">{pick(d.title, lang) || name}</H2>
      {pick(d.subtitle, lang) && <p className="mt-4 text-[var(--pb-muted)]">{pick(d.subtitle, lang)}</p>}
      <div className="mt-8 flex items-center gap-4">
        {coverUrl && <img src={coverUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />}
        <div className="flex-1">
          <p className="font-display text-xl">{name}</p>
          {kind === "pack" && (
            <p className="mt-1 text-xs text-[var(--pb-muted)]">
              {items.map((i) => `${pickLang(lang, i.product.name_fr, i.product.name_ar, i.product.name_en)} ×${i.quantity}`).join(" · ")}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6">
        <PriceTag />
      </div>
      <div className="mt-6">
        <QtyPicker />
      </div>
    </div>
  );

  return (
    <Section block={block}>
      <div className={cn("grid gap-8", d.style === "split" && summary ? "items-start @3xl:grid-cols-2 @3xl:gap-14" : "mx-auto max-w-xl")}>
        {d.style !== "split" && (
          <div className="text-center">
            <H2 className="text-4xl @3xl:text-5xl">{pick(d.title, lang)}</H2>
            {pick(d.subtitle, lang) && <p className="mt-3 text-[var(--pb-muted)]">{pick(d.subtitle, lang)}</p>}
          </div>
        )}
        {d.style === "split" && summary}
        <div className="rounded-[calc(var(--pb-radius)*1.2)] border border-[color-mix(in_srgb,var(--pb-text)_12%,transparent)] bg-[var(--pb-surface)] p-6 text-start @3xl:p-8">
          {form}
        </div>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- divider
function Divider({ block }: { block: BlockOf<"divider"> }) {
  const d = block.data;
  const space = { sm: "py-4", md: "py-8", lg: "py-14" }[d.size];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} aria-hidden className={cn("mx-auto flex max-w-6xl items-center justify-center gap-4 px-5", space)}>
      {d.style === "line" && (
        <motion.span initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : undefined} transition={{ duration: 1.2 }} className="h-px w-full bg-[linear-gradient(90deg,transparent,var(--pb-accent),transparent)]" />
      )}
      {d.style === "beans" && (
        <>
          <span className="h-px w-24 bg-[linear-gradient(90deg,transparent,var(--pb-accent))]" />
          {[0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ scale: 0, rotate: -90 }} animate={inView ? { scale: 1, rotate: (i - 1) * 14 } : undefined} transition={{ delay: i * 0.12, type: "spring" }}>
              <CoffeeBeanIcon className={cn("text-[var(--pb-accent)]", i === 1 ? "w-4" : "w-3 opacity-60")} />
            </motion.span>
          ))}
          <span className="h-px w-24 bg-[linear-gradient(-90deg,transparent,var(--pb-accent))]" />
        </>
      )}
      {d.style === "dots" &&
        Array.from({ length: 7 }, (_, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : undefined} transition={{ delay: i * 0.06 }} className="h-1.5 w-1.5 rounded-full bg-[var(--pb-accent)]" />
        ))}
      {d.style === "wave" && (
        <svg viewBox="0 0 600 40" className="h-8 w-full max-w-xl text-[var(--pb-accent)]" fill="none" stroke="currentColor" strokeWidth="1.5">
          <motion.path
            d="M0 20 Q 37.5 0 75 20 T 150 20 T 225 20 T 300 20 T 375 20 T 450 20 T 525 20 T 600 20"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : undefined}
            transition={{ duration: 1.6 }}
          />
        </svg>
      )}
    </div>
  );
}

// ------------------------------------------------------------- dispatcher
export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "hero":
      return <Hero block={block} />;
    case "countdown":
      return <CountdownBlock block={block} />;
    case "gallery":
      return <Gallery block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "features":
      return <Features block={block} />;
    case "story":
      return <Story block={block} />;
    case "contents":
      return <Contents block={block} />;
    case "price":
      return <PriceBlock block={block} />;
    case "stats":
      return <Stats block={block} />;
    case "testimonials":
      return <Testimonials block={block} />;
    case "faq":
      return <Faq block={block} />;
    case "marquee":
      return <Marquee block={block} />;
    case "text":
      return <TextBlock block={block} />;
    case "cta":
      return <Cta block={block} />;
    case "checkout":
      return <CheckoutBlock block={block} />;
    case "divider":
      return <Divider block={block} />;
    default:
      return null;
  }
}

export function StickyBuyBar({ hidden }: { hidden: boolean }) {
  const { name, unit, lineTotal, qty, go, available } = usePage();
  const { t } = useLanguage();
  if (unit === null || !available) return null;
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ y: "120%" }}
          animate={{ y: 0 }}
          exit={{ y: "120%" }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-full border border-[color-mix(in_srgb,var(--pb-text)_14%,transparent)] bg-[color-mix(in_srgb,var(--pb-surface)_92%,transparent)] p-2 ps-5 shadow-2xl backdrop-blur-md md:hidden"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-[var(--pb-muted)]">{name}</p>
            <p className="font-display text-lg leading-tight">{formatPrice(qty > 1 && lineTotal !== null ? lineTotal : unit)}</p>
          </div>
          <button
            type="button"
            onClick={() => go("checkout")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(120deg,var(--pb-accent),var(--pb-accent2))] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--pb-bg)]"
          >
            <ShoppingBag size={15} />
            {t("pb.orderNow")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
