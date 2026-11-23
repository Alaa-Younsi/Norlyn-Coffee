import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PageRenderer } from "@/components/pageBuilder/PageRenderer";
import { usePixel } from "@/components/MetaPixelProvider";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCatalogue, usePackBySlug } from "@/hooks/usePacks";
import { useSeo } from "@/hooks/useSeo";
import { pickLang } from "@/lib/localized";
import { normalizePage, starterPackPage } from "@/lib/pageBuilder/defaults";

/** /pack/:slug — a pack's own sales page, built in the admin page builder. */
export function Pack() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const { data: pack, isLoading } = usePackBySlug(slug);
  const { data: catalogue } = useCatalogue();
  const pixel = usePixel();
  const tracked = useRef<string | null>(null);

  const doc = useMemo(() => {
    if (!pack) return null;
    const normalized = normalizePage(pack.page);
    return normalized.blocks.length ? normalized : starterPackPage();
  }, [pack]);

  const name = pack ? pickLang(lang, pack.name_fr, pack.name_ar ?? pack.name_fr, pack.name_en) : "";
  useSeo({
    title: pack ? `${name} — Norlyn Coffee` : "Norlyn Coffee",
    description: pack ? pickLang(lang, pack.tagline_fr ?? "", pack.tagline_ar ?? "", pack.tagline_en) || undefined : undefined,
    noindex: pack?.status !== "published",
  });

  useEffect(() => {
    if (!pack || tracked.current === pack.id) return;
    tracked.current = pack.id;
    pixel.track("view_content", { content_ids: [pack.id], content_name: pack.name_fr, content_type: "product" });
  }, [pack, pixel]);

  if (isLoading || (pack && !catalogue)) return <main className="min-h-screen" />;

  if (!pack || !doc) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="font-display text-3xl italic">{t("pb.notFound")}</p>
        <Link to="/shop">
          <Button>{t("cart.continue")}</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {pack.status !== "published" && (
        <p className="fixed inset-x-0 top-20 z-40 mx-auto w-fit rounded-full bg-amber-900/90 px-4 py-1.5 text-xs font-semibold text-amber-100">
          {t("pb.draftNotice")}
        </p>
      )}
      <PageRenderer doc={doc} source={{ kind: "pack", pack }} catalogue={catalogue ?? []} className="pt-20" />
    </main>
  );
}
