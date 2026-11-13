import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea } from "@/components/ui/Field";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { Mascot } from "@/components/mascot/Mascot";
import { ClipReveal } from "@/components/brand/ClipReveal";
import { PageTitle } from "@/components/brand/PageTitle";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { useMagnetic } from "@/hooks/useMagnetic";
import { Reveal } from "@/components/brand/Reveal";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useHoneypot } from "@/hooks/useHoneypot";
import { useSeo } from "@/hooks/useSeo";
import { useSubmitContactMessage } from "@/hooks/useSiteContent";
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
} from "@/lib/contact";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const schema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(120).or(z.literal("")),
    phone: z
      .string()
      .trim()
      .regex(/^0[5-7][0-9]{8}$/)
      .or(z.literal("")),
    subject: z.string().trim().max(120),
    message: z.string().trim().min(10).max(2000),
    website: z.string().optional(), // honeypot
  })
  // mirrors the server rule: the RPC rejects a message with no way to reply
  .refine((values) => values.email !== "" || values.phone !== "", { path: ["email"] });

type FormValues = z.infer<typeof schema>;

/**
 * Contact, as the house's counter: the phone number set large like the price
 * on a menu board (one tap calls), the address and hours ruled off beneath,
 * and the message form printed as a counter ticket — dated, stamped, with a
 * tear line and punched notches.
 */
export function Contact() {
  const { t, lang } = useLanguage();
  const phoneRef = useRef<HTMLDivElement>(null);
  useMagnetic(phoneRef, 0.2);
  const [today] = useState(() =>
    new Date().toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "en" ? "en-GB" : "fr-DZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  );
  const { isSpam } = useHoneypot();
  const submitMessage = useSubmitContactMessage();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useSeo({
    title: `${t("contact.metaTitle")}`,
    description: t("contact.metaDesc"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "", website: "" },
  });

  const onSubmit = async (values: FormValues) => {
    // basic-bot guard: a filled hidden field, or a near-instant submit
    if (isSpam(values.website)) return;
    if (!isSupabaseConfigured) {
      setServerError(t("common.configMissing"));
      return;
    }
    setServerError(null);
    try {
      const messageId = await submitMessage.mutateAsync({
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        subject: values.subject || undefined,
        message: values.message,
      });
      // Best-effort staff ping (email/WhatsApp per Mon compte prefs) — never
      // awaited, never allowed to affect the confirmation shown below.
      void supabase.functions.invoke("notify", { body: { kind: "message", message_id: messageId } });
      setSent(true);
      reset();
    } catch (error) {
      const raw = (error as Error).message ?? "";
      setServerError(
        raw.includes("ERR_RATE_LIMIT")
          ? t("contact.errRate")
          : raw.includes("ERR_INVALID_INPUT")
            ? t("contact.errContact")
            : t("contact.errGeneric"),
      );
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-clip px-6 pb-28 pt-28 sm:pt-32">
      <FloatingBeans count={5} seed={9} />

      <div className="relative mx-auto max-w-7xl">
        <header className="grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
          <PageTitle text={t("contact.title")} />
          <Reveal as="p" index={4} className="max-w-md font-display text-xl leading-relaxed italic text-ink/70 lg:pb-3">
            {t("contact.subtitle")}
          </Reveal>
        </header>

        {/* `items-start`: the ticket keeps its own height instead of being
            stretched to the taller column */}
        <div className="mt-16 grid items-start gap-16 lg:mt-24 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          {/* ---------------------------------------------- the line */}
          <div>
            <Reveal index={5}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">{t("contact.infoPhone")}</p>
              {/* the number set like the price on a menu board — on a phone,
                  one tap calls */}
              <div ref={phoneRef} className="mt-3 inline-block">
                <a
                  href={CONTACT_PHONE_HREF}
                  dir="ltr"
                  className="group relative inline-block font-display text-[2.7rem] leading-none font-medium tracking-[-0.02em] tabular-nums text-ink transition-colors hover:text-gold-hi sm:text-6xl xl:text-7xl"
                >
                  {CONTACT_PHONE}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-2 h-px origin-left scale-x-0 bg-gold-hi transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100"
                  />
                </a>
              </div>
            </Reveal>

            <Reveal index={6} className="mt-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">{t("contact.infoEmail")}</p>
              <a
                href={CONTACT_EMAIL_HREF}
                dir="ltr"
                className="mt-3 inline-block break-all font-display text-2xl italic text-ink/85 transition-colors hover:text-gold-hi sm:text-[2.1rem]"
              >
                {CONTACT_EMAIL}
              </a>
            </Reveal>

            <Reveal index={7}>
              <dl className="mt-12 divide-y divide-line border-y border-line">
                {[
                  [t("contact.infoHours"), t("contact.infoHoursValue")],
                  [t("contact.infoArea"), t("contact.infoAreaValue")],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[7.5rem_1fr] items-baseline gap-4 py-4 sm:grid-cols-[9rem_1fr]">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">{label}</dt>
                    <dd className="font-display text-lg text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <ClipReveal className="mt-12 hidden sm:block" parallax={30}>
              <ImageSlot slot="contact.side" sizes="(min-width: 1024px) 40vw, 90vw" />
            </ClipReveal>
          </div>

          {/* -------------------------------------------- the ticket */}
          <Reveal index={6} className="relative">
            {/* the house stamp, pressed on the corner of the ticket */}
            <div aria-hidden className="absolute -top-9 end-5 z-10 rotate-[14deg] rounded-full border-2 border-dashed border-gold-hi/70 bg-bg p-2 sm:end-8">
              <Mascot emotion="love" palette={["love"]} size={58} />
            </div>
            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-panel/80 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)] backdrop-blur-sm">
              {/* the ticket's head: who and when — the stamp owns the far corner */}
              <div className="flex items-center gap-3 px-6 pt-7 font-mono text-[10px] uppercase tracking-[0.25em] text-muted sm:px-9">
                <span>Norlyn Coffee</span>
                <span aria-hidden className="h-px w-6 bg-line" />
                <span dir="ltr">{today}</span>
              </div>
              <h2 className="mt-5 px-6 font-display text-[2.1rem] leading-[1.05] font-medium tracking-[-0.02em] sm:px-9 sm:text-5xl">
                {t("contact.writeCta")}
              </h2>
              {/* the tear line, with the two punched notches of a counter ticket */}
              <div aria-hidden className="relative my-7 h-0">
                <div className="mx-8 border-t-2 border-dashed border-line sm:mx-11" />
                <span className="absolute -start-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-line bg-bg" />
                <span className="absolute -end-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-line bg-bg" />
              </div>
              <div className="px-6 pb-8 sm:px-9 sm:pb-10">
          {sent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Mascot emotion="love" palette={["love"]} size={88} />
              <h2 className="mt-4 font-display text-2xl">{t("contact.success")}</h2>
              <p className="mt-2 text-muted">{t("contact.successBody")}</p>
              <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                {t("common.back")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-start">
              {/* honeypot — real users never see or fill this */}
              <input
                {...register("website")}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldWrapper label={t("contact.name")} error={errors.name && t("contact.errName")}>
                  <Input {...register("name")} autoComplete="name" placeholder={t("contact.namePlaceholder")} />
                </FieldWrapper>
                <FieldWrapper
                  label={t("contact.phone")}
                  error={errors.phone && t("contact.errPhone")}
                >
                  <Input
                    {...register("phone")}
                    type="tel"
                    dir="ltr"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0555 55 55 55"
                  />
                </FieldWrapper>
                <FieldWrapper
                  label={t("contact.email")}
                  error={errors.email && t("contact.errContact")}
                  hint={t("contact.contactHint")}
                >
                  <Input
                    {...register("email")}
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    placeholder="nom@exemple.dz"
                  />
                </FieldWrapper>
                <FieldWrapper label={t("contact.subject")} hint={t("contact.subjectHint")}>
                  <Input {...register("subject")} placeholder={t("contact.subjectPlaceholder")} />
                </FieldWrapper>
              </div>

              <FieldWrapper
                label={t("contact.message")}
                error={errors.message && t("contact.errMessage")}
              >
                <Textarea {...register("message")} rows={5} placeholder={t("contact.messagePlaceholder")} />
              </FieldWrapper>

              {serverError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                >
                  {serverError}
                </p>
              )}

              {/* the action row carries its own reassurance instead of leaving
                  a lone pill floating in white space */}
              <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="order-2 text-xs text-muted sm:order-1 sm:max-w-64">
                  {t("contact.formNote")}
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="order-1 w-full sm:order-2 sm:w-auto"
                >
                  {isSubmitting ? t("contact.sending") : t("contact.submit")}
                </Button>
              </div>
            </form>
          )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
