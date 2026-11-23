import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Truck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCatalogue, usePublishedPacks } from "@/hooks/usePacks";
import { formatPrice } from "@/lib/format";
import { pickLang } from "@/lib/localized";
import { packQuote } from "@/lib/packPricing";
import { safeUrl } from "@/lib/pageBuilder/defaults";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The shop's "boxes" row — every published, in-window pack, linking to its own page. */
export function PacksStrip() {
  const { t, lang } = useLanguage();
  const { data: packs } = usePublishedPacks();
  const { data: catalogue } = useCatalogue();
  const [now] = useState(() => Date.now());

  const cards = useMemo(() => {
    const map = new Map((catalogue ?? []).map((p) => [p.id, p]));
    return (packs ?? [])
      // "Mis en avant dans la boutique" in the pack editor is what puts a pack here
      .filter((p) => p.featured)
      .filter((p) => (!p.starts_at || new Date(p.starts_at).getTime() <= now) && (!p.ends_at || new Date(p.ends_at).getTime() > now))
      .map((pack) => {
        const quote = packQuote(pack.items ?? [], pack.pricing, (id) => {
          const product = map.get(id);
          return product ? Number(product.price) : undefined;
        });
        const cover = safeUrl(pack.cover_url) || map.get(pack.items?.[0]?.product_id ?? "")?.product_images?.[0]?.url || "";
        return { pack, quote, cover };
      })
      .filter((c) => c.quote);
  }, [packs, catalogue, now]);

  if (cards.length === 0) return null;

  return (
    <section className="mt-28">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand">{t("pb.packsKicker")}</p>
      <h2 className="mt-3 font-display text-[2.4rem] leading-[1] font-medium tracking-[-0.02em] sm:text-5xl">{t("pb.packsTitle")}</h2>
      <p className="mt-4 max-w-lg font-display text-lg italic text-ink/70">{t("pb.packsSub")}</p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ pack, quote, cover }, i) => {
          const save = quote?.compare ? Math.round(((quote.compare - quote.unit) / quote.compare) * 100) : 0;
          return (
            <motion.div
              key={pack.id}
              initial={{ y: 60, opacity: 0, rotateX: 16, transformPerspective: 1200 }}
              whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: EASE }}
            >
              <Link
                to={`/pack/${pack.slug}`}
                className="group relative block overflow-hidden rounded-[2rem] border border-line bg-panel transition-all duration-500 hover:-translate-y-2 hover:border-brand/60 hover:shadow-[0_40px_80px_-40px_rgb(var(--c-brand)/0.6)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {cover && <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />}
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(var(--c-panel)),transparent_60%)]" />
                  {save > 0 && (
                    <span className="absolute end-4 top-4 rotate-[-8deg] rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-cream shadow-lg transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110">
                      −{save} %
                    </span>
                  )}
                </div>
                <div className="relative -mt-10 p-6">
                  <p className="font-display text-2xl">{pickLang(lang, pack.name_fr, pack.name_ar ?? pack.name_fr, pack.name_en)}</p>
                  {pack.tagline_fr && (
                    <p className="mt-1 text-sm text-muted">{pickLang(lang, pack.tagline_fr, pack.tagline_ar ?? "", pack.tagline_en)}</p>
                  )}
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <span className="font-display text-3xl text-brand">{quote && formatPrice(quote.unit)}</span>
                      {quote?.compare && <span className="ms-2 text-sm text-muted line-through">{formatPrice(quote.compare)}</span>}
                      {pack.pricing?.free_shipping && (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
                          <Truck size={12} /> {t("checkout.shippingFree")}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      {t("pb.discover")}
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
