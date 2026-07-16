import { HandCoins, MousePointerClick, PhoneCall } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { useLanguage } from "@/i18n/LanguageProvider";

export function HowItWorksSection() {
  const { t } = useLanguage();
  const steps = [
    { icon: MousePointerClick, title: t("how.s1t"), text: t("how.s1d") },
    { icon: PhoneCall, title: t("how.s2t"), text: t("how.s2d") },
    { icon: HandCoins, title: t("how.s3t"), text: t("how.s3d") },
  ] as const;

  return (
    <section className="relative bg-panel-2/50 py-24">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-brand">{t("how.kicker")}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">{t("how.title")}</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Panel key={step.title} className="fx-sheen relative px-6 py-10">
              <span className="fx-gold-text absolute top-4 start-5 font-display text-5xl font-bold opacity-40">
                {i + 1}
              </span>
              <step.icon size={34} className="mx-auto text-brand" strokeWidth={1.6} />
              <h3 className="mt-5 font-display text-2xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step.text}</p>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}
