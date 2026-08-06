import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSeo } from "@/hooks/useSeo";

export function NotFound() {
  const { t } = useLanguage();
  useSeo({ title: "404 — Norlyn Coffee" });
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <Mascot emotion="surprised" palette={["surprised"]} size={120} frameSize="lg" />
      <p className="fx-gold-text font-display text-8xl font-bold">404</p>
      <p className="text-muted">{t("common.notFound")}</p>
      <Link to="/">
        <Button variant="outline">{t("confirm.backHome")}</Button>
      </Link>
    </main>
  );
}
