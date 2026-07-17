import { Star } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useReviews } from "@/hooks/useReviews";

export function ReviewsSection() {
  const { t } = useLanguage();
  const { data: reviews } = useReviews();

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-16 sm:py-24">
      <FloatingBeans count={6} seed={8} />
      <CoffeeRing className="fx-spin-slow -end-20 -bottom-10 w-64 opacity-10" />
      <p className="relative text-sm uppercase tracking-[0.3em] text-brand">{t("reviews.kicker")}</p>
      <h2 className="relative mt-2 font-display text-3xl font-semibold sm:text-5xl">{t("reviews.title")}</h2>
      <div className="relative mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, 6).map((review) => (
          <Panel key={review.id} className="p-6">
            <div className="flex items-center gap-1 text-brand">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={15}
                  fill={i < review.stars ? "currentColor" : "none"}
                  className={i < review.stars ? "" : "text-line"}
                />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink/90">“{review.review_text}”</p>
            <p className="mt-4 text-sm font-semibold text-muted">— {review.client_name}</p>
          </Panel>
        ))}
      </div>
    </section>
  );
}
