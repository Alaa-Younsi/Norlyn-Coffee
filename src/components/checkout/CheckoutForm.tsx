import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Home, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/Field";
import { Mascot } from "@/components/mascot/Mascot";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useDeliveryPrices } from "@/hooks/useDeliveryPrices";
import { useStoreSettings, resolveShipping } from "@/hooks/useStoreSettings";
import { useHoneypot } from "@/hooks/useHoneypot";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { orderErrorKey } from "@/lib/orderErrors";
import { formatPrice } from "@/lib/format";
import type { MascotEmotion } from "@/lib/mascot";
import { usePixel } from "@/components/MetaPixelProvider";
import { cn } from "@/lib/utils";
import type { DeliveryType } from "@/types/db";

export interface CheckoutLine {
  product_id: string;
  quantity: number;
  /** display-only — the server re-derives every price */
  price: number;
  name: string;
}

interface CheckoutFormProps {
  lines: CheckoutLine[];
  /**
   * "mount": dedicated checkout route — arriving is already intent, the page
   * fires InitiateCheckout itself. "focus": embedded quick-buy — fire only on
   * first real interaction (never on product-page mount).
   */
  intent: "mount" | "focus";
  intentKey: string;
  onSuccess: (orderNumber: string) => void;
  compact?: boolean;
}

const formSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^0[5-7][0-9]{8}$/),
  wilaya: z.string().min(1),
  city: z.string().trim().min(1).max(80),
  delivery_type: z.enum(["home", "office"]),
  website: z.string().optional(), // honeypot — real users never see it
});

type FormValues = z.infer<typeof formSchema>;

export function CheckoutForm({ lines, intent, intentKey, onSuccess, compact }: CheckoutFormProps) {
  const { t, lang } = useLanguage();
  const { data: wilayas } = useDeliveryPrices(true);
  const { data: settings } = useStoreSettings();
  const { isSpam } = useHoneypot();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const pixel = usePixel();
  const trackedIntentKey = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { delivery_type: "home", wilaya: "", website: "" },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() opts this component out of the React Compiler; correctness is unaffected
  const wilaya = watch("wilaya");
  const deliveryType = watch("delivery_type") as DeliveryType;

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines],
  );

  const selectedWilaya = wilayas?.find((w) => w.wilaya === wilaya);
  const wilayaFee = selectedWilaya
    ? deliveryType === "office"
      ? Number(selectedWilaya.office_price)
      : Number(selectedWilaya.home_price)
    : null;
  // the ONE shared shipping rule — mirrors place_order exactly
  const shipping = wilayaFee !== null ? resolveShipping(wilayaFee, subtotal, settings) : null;
  const total = shipping !== null ? subtotal + shipping : null;

  const handleFormFocus = () => {
    if (intent !== "focus" || trackedIntentKey.current === intentKey) return;
    trackedIntentKey.current = intentKey;
    pixel.track("initiate_checkout", {
      content_ids: lines.map((l) => l.product_id),
      value: subtotal,
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (isSpam(values.website)) return;
    if (!isSupabaseConfigured) {
      setServerError(t("common.configMissing"));
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const { data, error } = await supabase.rpc("place_order", {
        items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
        customer: {
          name: values.name,
          phone: values.phone,
          wilaya: values.wilaya,
          city: values.city,
          delivery_type: values.delivery_type,
          language: lang,
        },
      });
      if (error) {
        setServerError(t(orderErrorKey(error.message)));
        return;
      }
      // Purchase is NOT fired here: OrderConfirmation reads the authoritative
      // order.total back through get_order_by_number and reports it there.
      onSuccess(data as string);
      // Best-effort staff ping (email/WhatsApp per Mon compte prefs) — never
      // awaited, never allowed to affect checkout. See notify-order/index.ts.
      void supabase.functions.invoke("notify-order", { body: { order_number: data } });
    } catch {
      setServerError(t("err.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  // anything the buyer has to fix outranks everything else — a cup grinning
  // over a red error message is the kind of detail that reads as unfinished
  const mascotFace: MascotEmotion =
    serverError || Object.keys(errors).length > 0
      ? "surprised"
      : submitting
        ? "excited"
        : "determined";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onFocus={handleFormFocus}
      className={cn("space-y-4", compact ? "" : "sm:space-y-5")}
      noValidate
    >
      {/* honeypot — hidden from real users, autofilled by naive bots */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        {...register("website")}
      />

      <div className={cn("grid gap-4", compact ? "" : "sm:grid-cols-2")}>
        <FieldWrapper label={t("checkout.name")} error={errors.name && t("checkout.nameInvalid")}>
          <Input {...register("name")} autoComplete="name" />
        </FieldWrapper>
        <FieldWrapper label={t("checkout.phone")} error={errors.phone && t("checkout.phoneInvalid")}>
          <Input {...register("phone")} type="tel" inputMode="tel" dir="ltr" placeholder="05 XX XX XX XX" autoComplete="tel" />
        </FieldWrapper>
        <FieldWrapper label={t("checkout.wilaya")} error={errors.wilaya && t("checkout.wilayaRequired")}>
          <Select {...register("wilaya")}>
            <option value="">{t("checkout.selectWilaya")}</option>
            {(wilayas ?? []).map((w) => (
              <option key={w.id} value={w.wilaya}>
                {w.wilaya}
              </option>
            ))}
          </Select>
        </FieldWrapper>
        <FieldWrapper label={t("checkout.city")} error={errors.city && t("checkout.cityRequired")}>
          <Input {...register("city")} autoComplete="address-level2" />
        </FieldWrapper>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("checkout.deliveryType")}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "home", icon: Home, label: t("checkout.home") },
              { value: "office", icon: Building2, label: t("checkout.office") },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={cn(
                // the radio itself is sr-only, so the LABEL has to show the
                // focus ring or keyboard users lose the caret entirely
                "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
                deliveryType === opt.value
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-line bg-panel text-muted hover:text-ink",
              )}
            >
              <input type="radio" value={opt.value} className="sr-only" {...register("delivery_type")} />
              <opt.icon size={16} />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-2xl border border-line bg-panel-2/60 p-4 text-sm">
        <div className="flex justify-between py-1">
          <span className="text-muted">{t("checkout.subtotal")}</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted">{t("checkout.shipping")}</span>
          {/* unknown (no wilaya yet) renders as "—", genuinely free as an explicit label */}
          <span className="font-medium">
            {shipping === null ? "—" : shipping === 0 ? t("checkout.shippingFree") : formatPrice(shipping)}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t border-line pt-2.5">
          <span className="font-semibold">{t("checkout.total")}</span>
          <span className="font-display text-xl text-brand">
            {total === null ? "—" : formatPrice(total)}
          </span>
        </div>
      </div>

      {serverError && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {serverError}
        </p>
      )}
      {!isSupabaseConfigured && (
        <p className="text-xs text-muted">{t("common.configMissing")}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting || lines.length === 0}>
        {submitting ? t("checkout.placing") : t("checkout.place")}
      </Button>

      {/* the cup reads the form back to you: steady while you fill it in, taken
          aback when something was rejected, thrilled once it is on its way.
          Reassurance at the exact moment a COD buyer decides whether to trust
          the site — and it costs the layout one 44px box. */}
      <div className="flex items-center justify-center gap-2.5">
        <Mascot
          emotion={mascotFace}
          palette={["determined", "surprised", "excited"]}
          size={44}
          float={false}
        />
        <p className="text-start text-xs text-muted">{t("checkout.codNote")}</p>
      </div>
    </form>
  );
}
