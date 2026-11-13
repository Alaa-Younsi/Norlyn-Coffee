import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { CreditsFilm } from "@/components/brand/CreditsFilm";
import type { FilmScene } from "@/components/brand/CreditsFilm";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";
import { MEDIA } from "@/lib/media";
import type { TranslationKey } from "@/i18n/translations";

const STEPS: Array<{ titleKey: TranslationKey; textKey: TranslationKey; slot: string }> = [
  { titleKey: "about.step1.title", textKey: "about.step1.text", slot: "about.origin" },
  { titleKey: "about.step2.title", textKey: "about.step2.text", slot: "about.roastery" },
  { titleKey: "about.step3.title", textKey: "about.step3.text", slot: "about.packaging" },
  { titleKey: "about.step4.title", textKey: "about.step4.text", slot: "about.sealing" },
];

const BIO: Array<keyof typeof MEDIA.capsule> = ["black", "brown", "green", "gold"];
const FLAVOURS: Array<keyof typeof MEDIA.capsule> = ["hazelnut", "vanilla", "caramel", "chocolate"];

/**
 * The three claims as what they are printed on: the aluminium lid of a
 * capsule. Brushed-silver discs with the number embossed into the foil.
 */
function FoilLids({ items }: { items: Array<{ value: string; label: string }> }) {
  return (
    <ul className="flex flex-wrap justify-center gap-6 sm:gap-10">
      {items.map((item) => (
        <li key={item.label} className="flex w-32 flex-col items-center sm:w-40">
          <span
            className="flex aspect-square w-full items-center justify-center rounded-full border border-white/40 bg-[radial-gradient(circle_at_35%_30%,#fbfbfd,#c9cbd1_45%,#8d9097_80%,#c3c5cb)] shadow-[inset_0_2px_6px_rgb(255_255_255/0.8),inset_0_-6px_14px_rgb(0_0_0/0.25),0_18px_30px_-12px_rgb(0_0_0/0.7)]"
          >
            {/* the figure pressed into the foil */}
            <span
              className="font-display text-3xl font-medium text-[#5d6068] [text-shadow:0_1px_0_rgb(255_255_255/0.85),0_-1px_0_rgb(0_0_0/0.25)] sm:text-4xl"
              dir="ltr"
            >
              {item.value}
            </span>
          </span>
          <span className="mt-4 text-center font-display text-base italic text-on-shade/80">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function CapsuleRow({ keys, label }: { keys: Array<keyof typeof MEDIA.capsule>; label: string }) {
  return (
    <figure>
      <div className="flex justify-center gap-3 sm:gap-6">
        {keys.map((key) => (
          <Photo
            key={key}
            media={MEDIA.capsule[key]}
            alt=""
            fit="contain"
            sizes="(min-width: 1024px) 9vw, 20vw"
            className="fx-float w-16 drop-shadow-[0_18px_20px_rgb(0_0_0/0.55)] sm:w-28"
          />
        ))}
      </div>
      <figcaption className="mt-4 font-display text-lg italic text-gold-hi">{label}</figcaption>
    </figure>
  );
}

/**
 * La maison, told as a film's credit sequence (see CreditsFilm): every chapter
 * of the house is a scene — its photograph full-bleed and slowly pushing in,
 * its words rolling up through the frame like credits — and the film ends on a
 * card that sends you to the shop.
 */
export function About() {
  const { t } = useLanguage();

  useSeo({
    title: `${t("about.metaTitle")} — Norlyn Coffee`,
    description: t("about.metaDesc"),
  });

  const scenes: FilmScene[] = [
    {
      id: "opening",
      slot: "about.hero",
      dim: 0.58,
      title: (
        <>
          {t("about.title")}
          <br />
          <span className="fx-accent text-gold-hi">{t("about.titleAccent")}</span>
        </>
      ),
      body: t("about.lead"),
    },
    {
      id: "story",
      slot: "about.story.1",
      title: t("about.story.title"),
      body: t("about.story.p1"),
    },
    {
      id: "story-2",
      slot: "about.story.2",
      body: (
        <>
          <p>{t("about.story.p2")}</p>
          <p className="mt-6">{t("about.story.p3")}</p>
        </>
      ),
    },
    {
      id: "promise",
      slot: "about.promise",
      dim: 0.7,
      title: t("about.promise.title"),
      body: t("about.promise.text"),
      extra: (
        <FoilLids
          items={[
            { value: "100 %", label: t("about.promise.stat1") },
            { value: "0 %", label: t("about.promise.stat2") },
            { value: "0 %", label: t("about.promise.stat3") },
          ]}
        />
      ),
    },
    ...STEPS.map(
      (step, i): FilmScene => ({
        id: step.slot,
        slot: step.slot,
        creditsFirst: true,
        credits: [
          {
            role: `0${i + 1}`,
            name: <span className="text-5xl font-medium tracking-[-0.02em] sm:text-7xl">{t(step.titleKey)}</span>,
          },
        ],
        body: t(step.textKey),
      }),
    ),
    {
      id: "values",
      slot: "about.fleet.2",
      dim: 0.72,
      title: t("about.values.title"),
      credits: [
        { role: t("about.value1.title"), name: <span className="text-xl leading-relaxed text-on-shade/85 sm:text-2xl">{t("about.value1.text")}</span> },
        { role: t("about.value2.title"), name: <span className="text-xl leading-relaxed text-on-shade/85 sm:text-2xl">{t("about.value2.text")}</span> },
        { role: t("about.value3.title"), name: <span className="text-xl leading-relaxed text-on-shade/85 sm:text-2xl">{t("about.value3.text")}</span> },
      ],
    },
    {
      id: "range",
      title: t("about.range.title"),
      extra: (
        <div className="space-y-10">
          <CapsuleRow keys={BIO} label={t("about.range.bio")} />
          <CapsuleRow keys={FLAVOURS} label={t("about.range.flavours")} />
        </div>
      ),
    },
    {
      id: "fleet",
      slot: "about.fleet.1",
      title: t("about.fleet.title"),
      body: t("about.fleet.text"),
      credits: [{ name: <span className="italic text-gold-hi">{t("about.fleet.badge")}</span> }],
    },
    {
      id: "retail",
      slot: "about.retail",
      credits: [
        { role: t("about.retail.title"), name: <span className="text-xl leading-relaxed text-on-shade/85 sm:text-2xl">{t("about.retail.text")}</span> },
        { role: t("about.machines.title"), name: <span className="text-xl leading-relaxed text-on-shade/85 sm:text-2xl">{t("about.machines.text")}</span> },
      ],
    },
    {
      id: "team",
      slot: "about.team",
      dim: 0.5,
      body: <span className="text-2xl not-italic sm:text-4xl">{t("about.team.caption")}</span>,
    },
    {
      id: "end",
      slot: "about.hero",
      dim: 0.78,
      title: t("about.cta.title"),
      body: t("about.cta.text"),
      extra: (
        <Link to="/shop" className="group inline-block">
          <Button size="lg" className="gap-3 ps-8 pe-3">
            {t("about.cta.button")}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 transition-transform duration-500 group-hover:-rotate-45 rtl:group-hover:rotate-45">
              <ArrowRight size={17} className="rtl:-scale-x-100" />
            </span>
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <main className="relative">
      <CreditsFilm scenes={scenes} label={t("about.metaTitle")} runtime={318} />
    </main>
  );
}
