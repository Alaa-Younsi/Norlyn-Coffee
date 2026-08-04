import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select, Textarea } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { TranslationKey } from "@/i18n/translations";
import { useAllPixelsAdmin, useDeletePixel, useSavePixel } from "@/hooks/useMetaPixels";
import { cn } from "@/lib/utils";
import type { MetaPixel, PixelEventKey, PixelScope } from "@/types/db";

const SCOPES: PixelScope[] = ["all", "paths", "products", "landing"];

const EVENT_KEYS: PixelEventKey[] = [
  "page_view",
  "view_content",
  "add_to_cart",
  "initiate_checkout",
  "purchase",
  "lead",
  "search",
];

const EVENT_LABEL: Record<PixelEventKey, TranslationKey> = {
  page_view: "admin.pixels.evPageView",
  view_content: "admin.pixels.evViewContent",
  add_to_cart: "admin.pixels.evAddToCart",
  initiate_checkout: "admin.pixels.evInitiateCheckout",
  purchase: "admin.pixels.evPurchase",
  lead: "admin.pixels.evLead",
  search: "admin.pixels.evSearch",
};

const SCOPE_LABEL: Record<PixelScope, TranslationKey> = {
  all: "admin.pixels.scopeAll",
  paths: "admin.pixels.scopePaths",
  products: "admin.pixels.scopeProducts",
  landing: "admin.pixels.scopeLanding",
};

interface Draft {
  id?: string;
  label: string;
  pixel_id: string;
  active: boolean;
  scope: PixelScope;
  match_values: string;
  events: Record<string, boolean>;
  test_event_code: string;
  currency: string;
  sort_order: number;
  notes: string;
}

function emptyDraft(): Draft {
  return {
    label: "",
    pixel_id: "",
    active: true,
    scope: "all",
    match_values: "",
    events: Object.fromEntries(EVENT_KEYS.map((key) => [key, true])),
    test_event_code: "",
    currency: "DZD",
    sort_order: 0,
    notes: "",
  };
}

function toDraft(pixel: MetaPixel): Draft {
  return {
    id: pixel.id,
    label: pixel.label,
    pixel_id: pixel.pixel_id,
    active: pixel.active,
    scope: pixel.scope,
    match_values: (pixel.match_values ?? []).join("\n"),
    events: Object.fromEntries(EVENT_KEYS.map((key) => [key, pixel.events?.[key] !== false])),
    test_event_code: pixel.test_event_code ?? "",
    currency: pixel.currency,
    sort_order: pixel.sort_order,
    notes: pixel.notes ?? "",
  };
}

export function AdminPixels() {
  const { t } = useLanguage();
  const { data: pixels, isLoading } = useAllPixelsAdmin();
  const savePixel = useSavePixel();
  const deletePixel = useDeletePixel();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;

    // Anything but digits is almost always a paste of the whole base-code
    // snippet, which silently tracks nothing — the client would only find out
    // from an empty Events Manager a week into a campaign.
    if (!/^\d{10,20}$/.test(draft.pixel_id.trim())) {
      setError(t("admin.pixels.invalidId"));
      return;
    }
    setError(null);

    savePixel.mutate(
      {
        id: draft.id,
        label: draft.label.trim(),
        pixel_id: draft.pixel_id.trim(),
        active: draft.active,
        scope: draft.scope,
        match_values:
          draft.scope === "all"
            ? []
            : draft.match_values
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
        events: draft.events,
        test_event_code: draft.test_event_code.trim() || null,
        currency: draft.currency.trim() || "DZD",
        sort_order: Number(draft.sort_order) || 0,
        notes: draft.notes.trim() || null,
      },
      { onSuccess: () => setDraft(null) },
    );
  };

  const hintKey =
    draft?.scope === "paths"
      ? "admin.pixels.matchHintPaths"
      : draft?.scope === "products"
        ? "admin.pixels.matchHintProducts"
        : "admin.pixels.matchHintLanding";

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{t("admin.pixels.title")}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">{t("admin.pixels.subtitle")}</p>
        </div>
        {!draft && (
          <Button onClick={() => setDraft(emptyDraft())}>
            <Plus size={16} />
            {t("admin.pixels.new")}
          </Button>
        )}
      </div>

      {draft && (
        <Panel className="mt-6 p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrapper label={t("admin.pixels.label")}>
                <Input
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  required
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.pixels.pixelId")} error={error ?? undefined}>
                <Input
                  dir="ltr"
                  inputMode="numeric"
                  value={draft.pixel_id}
                  onChange={(e) => setDraft({ ...draft, pixel_id: e.target.value })}
                  required
                />
                <span className="mt-1 block text-xs text-muted">
                  {t("admin.pixels.pixelIdHint")}
                </span>
              </FieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrapper label={t("admin.pixels.scope")}>
                <Select
                  value={draft.scope}
                  onChange={(e) => setDraft({ ...draft, scope: e.target.value as PixelScope })}
                >
                  {SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {t(SCOPE_LABEL[scope])}
                    </option>
                  ))}
                </Select>
              </FieldWrapper>

              {/* hidden entirely when the scope is "all" */}
              {draft.scope !== "all" && (
                <FieldWrapper label={t("admin.pixels.matchValues")}>
                  <Textarea
                    dir="ltr"
                    rows={4}
                    value={draft.match_values}
                    onChange={(e) => setDraft({ ...draft, match_values: e.target.value })}
                  />
                  <span className="mt-1 block text-xs text-muted">{t(hintKey)}</span>
                </FieldWrapper>
              )}
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">{t("admin.pixels.events")}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {EVENT_KEYS.map((key) => (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      draft.events[key]
                        ? "border-brand bg-brand/10 text-ink"
                        : "border-line text-muted hover:border-brand/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="accent-[rgb(var(--c-brand))]"
                      checked={draft.events[key]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          events: { ...draft.events, [key]: e.target.checked },
                        })
                      }
                    />
                    {t(EVENT_LABEL[key])}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-3">
              <FieldWrapper label={t("admin.pixels.testCode")}>
                <Input
                  dir="ltr"
                  value={draft.test_event_code}
                  onChange={(e) => setDraft({ ...draft, test_event_code: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.pixels.currency")}>
                <Input
                  dir="ltr"
                  value={draft.currency}
                  onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.pixels.sortOrder")}>
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </FieldWrapper>
            </div>

            <FieldWrapper label={t("admin.pixels.notes")}>
              <Textarea
                rows={2}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </FieldWrapper>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[rgb(var(--c-brand))]"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              {t("admin.products.active")}
            </label>

            <div className="flex gap-2">
              <Button type="submit" disabled={savePixel.isPending}>
                {savePixel.isPending ? t("common.saving") : t("common.save")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted">{t("common.loading")}</p>}
        {!isLoading && (pixels ?? []).length === 0 && (
          <Panel className="p-6 text-sm text-muted">{t("admin.pixels.none")}</Panel>
        )}

        {(pixels ?? []).map((pixel) => (
          <Panel key={pixel.id} className={cn("p-5", !pixel.active && "opacity-60")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{pixel.label}</p>
                <p className="text-sm text-muted" dir="ltr">
                  {pixel.pixel_id}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t(SCOPE_LABEL[pixel.scope])}
                  {pixel.scope !== "all" && ` · ${pixel.match_values?.length ?? 0}`}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {EVENT_KEYS.filter((key) => pixel.events?.[key] !== false)
                    .map((key) => t(EVENT_LABEL[key]))
                    .join(" · ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setDraft(toDraft(pixel))}>
                  {t("common.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(t("admin.pixels.deleteConfirm"))) deletePixel.mutate(pixel.id);
                  }}
                  aria-label={t("common.delete")}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
