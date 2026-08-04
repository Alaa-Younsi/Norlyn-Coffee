import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Clock, Mail, Phone, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { CoffeeRing } from "@/components/effects/CoffeeRing";
import { FloatingBeans } from "@/components/effects/FloatingBeans";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useHoneypot } from "@/hooks/useHoneypot";
import { useSeo } from "@/hooks/useSeo";
import { useSubmitContactMessage } from "@/hooks/useSiteContent";
import { isSupabaseConfigured } from "@/lib/supabase";

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
      await submitMessage.mutateAsync({
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        subject: values.subject || undefined,
        message: values.message,
      });
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
    <main className="relative min-h-screen overflow-x-clip px-6 pb-24 pt-28">
      <FloatingBeans count={6} seed={3} />
      <CoffeeRing className="fx-spin-slow -end-20 top-24 w-64 opacity-10" />

      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-brand sm:text-sm">
          {t("contact.kicker")}
        </p>
        <h1 className="mt-4 font-display text-5xl font-semibold sm:text-6xl">
          <span className="fx-accent fx-gold-text-deep">{t("contact.title")}</span>
        </h1>
        <p className="mt-5 text-balance font-display text-lg leading-relaxed text-ink/75 sm:text-xl">
          {t("contact.subtitle")}
        </p>
      </header>

      <div className="mx-auto mt-14 grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CircleCheck size={48} className="text-brand" strokeWidth={1.4} />
              <h2 className="mt-4 font-display text-2xl">{t("contact.success")}</h2>
              <p className="mt-2 text-muted">{t("contact.successBody")}</p>
              <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
                {t("common.back")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-start">
              {/* honeypot — real users never see or fill this */}
              <input
                {...register("website")}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute h-0 w-0 opacity-0"
              />

              <FieldWrapper
                label={t("contact.name")}
                error={errors.name && t("contact.errName")}
              >
                <Input {...register("name")} autoComplete="name" />
              </FieldWrapper>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label={t("contact.email")}
                  error={errors.email && t("contact.errContact")}
                >
                  <Input {...register("email")} type="email" dir="ltr" autoComplete="email" />
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
              </div>
              <p className="-mt-2 text-xs text-muted">{t("contact.contactHint")}</p>

              <FieldWrapper label={t("contact.subject")}>
                <Input {...register("subject")} />
              </FieldWrapper>

              <FieldWrapper
                label={t("contact.message")}
                error={errors.message && t("contact.errMessage")}
              >
                <Textarea {...register("message")} rows={6} />
              </FieldWrapper>

              {serverError && (
                <p className="text-sm text-red-700 dark:text-red-400">{serverError}</p>
              )}

              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? t("contact.sending") : t("contact.submit")}
              </Button>
            </form>
          )}
        </Panel>

        <div className="space-y-6">
          <ImageSlot slot="contact.side" />

          <Panel className="p-6 text-start">
            <h2 className="font-display text-xl">{t("contact.infoTitle")}</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <InfoRow icon={Phone} label={t("contact.infoPhone")} value="0770 00 00 00" ltr />
              <InfoRow icon={Mail} label={t("contact.infoEmail")} value="contact@norlyn.dz" ltr />
              <InfoRow
                icon={Clock}
                label={t("contact.infoHours")}
                value={t("contact.infoHoursValue")}
              />
              <InfoRow
                icon={Truck}
                label={t("contact.infoArea")}
                value={t("contact.infoAreaValue")}
              />
            </ul>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/30 text-brand">
        <Icon size={15} strokeWidth={1.7} />
      </span>
      <span>
        <span className="block text-xs uppercase tracking-wider text-muted">{label}</span>
        <span className="block" dir={ltr ? "ltr" : undefined}>
          {value}
        </span>
      </span>
    </li>
  );
}
