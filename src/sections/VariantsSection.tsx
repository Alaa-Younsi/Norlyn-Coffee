import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatPrice } from "@/lib/format";
import { ScrollTrigger } from "@/lib/gsap";
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

function Variants3D({ products }: { products: Product[] }) {
  const { t, lang } = useLanguage();
  const zoneRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = products.length;

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || count === 0) return;
    const trigger = ScrollTrigger.create({
      trigger: zone,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        setIndex(Math.min(count - 1, Math.floor(self.progress * count)));
      },
    });
    return () => trigger.kill();
  }, [count]);

  const product = products[index];
  if (!product) return null;
  const name = lang === "ar" ? product.name_ar : product.name_fr;
  const description = lang === "ar" ? product.description_ar : product.description_fr;

  return (
    <div ref={zoneRef} id="variants" style={{ height: `${count * 110}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 px-6">
          {/* start column intentionally empty — the 3D capsule floats there */}
          <div />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.3em] text-brand">{t("variants.kicker")}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">
              {t("variants.title")}
            </h2>

            <div className="relative mt-8 min-h-72">
              <AnimatePresence mode="popLayout" initial={false}>
                {/* transform-only swap: opacity never animated on content */}
                <motion.div
                  key={product.id}
                  initial={{ y: 46 }}
                  animate={{ y: 0 }}
                  exit={{ y: -46, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h3
                    className="font-display text-4xl font-bold sm:text-6xl"
                    style={{ color: product.accent_color ?? "rgb(var(--c-brand))" }}
                  >
                    {name}
                  </h3>
                  <p className="mt-4 max-w-md leading-relaxed text-muted">{description}</p>

                  <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-muted">
                        {t("variants.intensity")}
                      </dt>
                      <dd className="mt-1.5 flex items-center gap-1.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            className="h-2 w-7 rounded-full transition-colors"
                            style={{
                              backgroundColor:
                                i < Math.round(((product.intensity ?? 0) / 100) * 5)
                                  ? (product.accent_color ?? "rgb(var(--c-brand))")
                                  : "rgb(var(--c-line))",
                            }}
                          />
                        ))}
                      </dd>
                    </div>
                    {product.dosage && (
                      <div>
                        <dt className="text-xs uppercase tracking-widest text-muted">
                          {t("variants.dosage")}
                        </dt>
                        <dd className="mt-1 font-display text-2xl">{product.dosage}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-7 flex items-center gap-4">
                    <span className="font-display text-3xl text-brand">
                      {formatPrice(product.price)}
                    </span>
                    <Link to={`/product/${product.slug}`}>
                      <Button>{t("variants.order")}</Button>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex gap-2">
              {products.map((p, i) => (
                <span
                  key={p.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-10 bg-brand" : "w-4 bg-line",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Variants2D({ products }: { products: Product[] }) {
  const { t, lang } = useLanguage();
  return (
    <section id="variants" className="mx-auto max-w-7xl px-6 py-20">
      <p className="text-sm uppercase tracking-[0.3em] text-brand">{t("variants.kicker")}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">{t("variants.title")}</h2>
      <div className="mt-10 space-y-6">
        {products.map((product, i) => {
          const image = [...(product.product_images ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order,
          )[0];
          const name = lang === "ar" ? product.name_ar : product.name_fr;
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
                  src={image.url.replace("-lg.webp", "-md.webp")}
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
                  style={{ color: product.accent_color ?? "rgb(var(--c-brand))" }}
                >
                  {name}
                </h3>
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  {lang === "ar" ? product.description_ar : product.description_fr}
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
