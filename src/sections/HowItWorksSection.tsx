import { useRef } from "react";
import { HandCoins, MousePointerClick, PhoneCall } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { CoffeeCupArt } from "@/components/effects/CoffeeCup";
import { CoffeeDivider } from "@/components/effects/CoffeeDivider";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useFadeUp, useRevealOnScroll, useVelocitySkew } from "@/hooks/useScrollFX";

export function HowItWorksSection() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  useRevealOnScroll(stepsRef);
  useVelocitySkew(stepsRef, 1.6);
  useFadeUp(sectionRef);
  const steps = [
    { icon: MousePointerClick, title: t("how.s1t"), text: t("how.s1d") },
    { icon: PhoneCall, title: t("how.s2t"), text: t("how.s2d") },
    { icon: HandCoins, title: t("how.s3t"), text: t("how.s3d") },
  ] as const;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-panel-2/50 py-16 sm:py-24">
      <FloatingBeans count={7} seed={7} />
      <div className="relative mx-auto max-w-7xl px-6 text-center">
        {/* a steaming espresso welcomes the section */}
        <CoffeeCupArt className="mx-auto mb-6 w-24" />
        <p data-fade="16" className="text-sm uppercase tracking-[0.3em] text-brand">
          {t("how.kicker")}
        </p>
        <h2 data-fade className="mt-2 font-display text-3xl font-semibold sm:text-5xl">
          {t("how.title")}
        </h2>
        <div ref={stepsRef} className="mt-12 grid gap-6 sm:grid-cols-3" style={{ perspective: "1200px" }}>
          {steps.map((step, i) => (
            <Panel key={step.title} data-reveal className="fx-sheen relative px-6 py-10">
              <span className="fx-gold-text absolute top-4 start-5 font-display text-5xl font-bold opacity-40">
                {i + 1}
              </span>
              <step.icon size={34} className="mx-auto text-brand" strokeWidth={1.6} />
              <h3 className="mt-5 font-display text-2xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step.text}</p>
            </Panel>
          ))}
        </div>
        <CoffeeDivider className="mt-14" />
      </div>
    </section>
  );
}
