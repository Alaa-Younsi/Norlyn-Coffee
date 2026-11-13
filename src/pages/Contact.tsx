import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Mascot } from "@/components/mascot/Mascot";
import { CreditsFilm } from "@/components/brand/CreditsFilm";
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

export function Contact() {
  const { t } = useLanguage();
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
    <main className="relative">
      <CreditsFilm
        label={t("contact.title")}
        runtime={96}
        scenes={[
          {
            id: "title",
            slot: "contact.side",
            dim: 0.62,
            title: t("contact.title"),
            body: t("contact.subtitle"),
          },
          {
            id: "credits",
            slot: "contact.side",
            dim: 0.8,
            // the house's contacts, credited like a crew — the phone and the
            // address are real links: on a phone you tap to call
            credits: [
              { role: t("contact.infoPhone"), name: <a href={CONTACT_PHONE_HREF} dir="ltr" className="transition-colors hover:text-gold-hi">{CONTACT_PHONE}</a> },
              { role: t("contact.infoEmail"), name: <a href={CONTACT_EMAIL_HREF} dir="ltr" className="break-all transition-colors hover:text-gold-hi">{CONTACT_EMAIL}</a> },
              { role: t("contact.infoHours"), name: t("contact.infoHoursValue") },
              { role: t("contact.infoArea"), name: t("contact.infoAreaValue") },
            ],
            extra: (
              <a
                href="#write"
                className="group inline-flex items-center gap-3 border-b border-on-shade/40 pb-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-on-shade transition-colors hover:border-gold-hi"
              >
                {t("contact.writeCta")}
                <ArrowDown size={15} className="transition-transform group-hover:translate-y-0.5" />
              </a>
            ),
          },
        ]}
      />

      {/* post-credits: the message itself */}
      <div id="write" className="mx-auto max-w-3xl scroll-mt-24 px-6 pb-24 pt-24">
        <Reveal>
        <Panel className="p-6 sm:p-8">
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
        </Panel>
        </Reveal>

      </div>
    </main>
  );
}
