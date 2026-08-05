import { useState } from "react";
import { ImageOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { UploadButton } from "@/components/admin/UploadButton";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  useAllSlidesAdmin,
  useClearSiteImage,
  useDeleteSlide,
  useSaveSiteImage,
  useSaveSlide,
  useSiteImages,
} from "@/hooks/useSiteContent";
import { IMAGE_SLOTS, IMAGE_SLOT_GROUPS } from "@/lib/imageSlots";
import { pickLang } from "@/lib/localized";
import { cn } from "@/lib/utils";
import type { MediaSlide, SlideKind, SlidePlacement } from "@/types/db";

interface SlideDraft {
  id?: string;
  kind: SlideKind;
  url: string;
  poster_url: string;
  title_fr: string;
  title_ar: string;
  subtitle_fr: string;
  subtitle_ar: string;
  link_url: string;
  placement: SlidePlacement;
  sort_order: number;
  active: boolean;
}

function emptySlide(): SlideDraft {
  return {
    kind: "image",
    url: "",
    poster_url: "",
    title_fr: "",
    title_ar: "",
    subtitle_fr: "",
    subtitle_ar: "",
    link_url: "",
    placement: "hero",
    sort_order: 0,
    active: true,
  };
}

function toDraft(slide: MediaSlide): SlideDraft {
  return {
    id: slide.id,
    kind: slide.kind,
    url: slide.url,
    poster_url: slide.poster_url ?? "",
    title_fr: slide.title_fr ?? "",
    title_ar: slide.title_ar ?? "",
    subtitle_fr: slide.subtitle_fr ?? "",
    subtitle_ar: slide.subtitle_ar ?? "",
    link_url: slide.link_url ?? "",
    placement: slide.placement,
    sort_order: slide.sort_order,
    active: slide.active,
  };
}

export function AdminContent() {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl">{t("admin.content.title")}</h1>
      <SlidesSection />
      <SlotsSection />
    </div>
  );
}

/* --------------------------------------------------------- hero / gallery */

function SlidesSection() {
  const { t, lang } = useLanguage();
  const { data: slides, isLoading } = useAllSlidesAdmin();
  const saveSlide = useSaveSlide();
  const deleteSlide = useDeleteSlide();
  const [draft, setDraft] = useState<SlideDraft | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || !draft.url.trim()) return;
    saveSlide.mutate(
      {
        id: draft.id,
        kind: draft.kind,
        url: draft.url.trim(),
        poster_url: draft.poster_url.trim() || null,
        title_fr: draft.title_fr.trim() || null,
        title_ar: draft.title_ar.trim() || null,
        subtitle_fr: draft.subtitle_fr.trim() || null,
        subtitle_ar: draft.subtitle_ar.trim() || null,
        link_url: draft.link_url.trim() || null,
        placement: draft.placement,
        sort_order: Number(draft.sort_order) || 0,
        active: draft.active,
      },
      { onSuccess: () => setDraft(null) },
    );
  };

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{t("admin.content.slides")}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{t("admin.content.slidesHint")}</p>
        </div>
        {!draft && (
          <Button onClick={() => setDraft(emptySlide())}>
            <Plus size={16} />
            {t("admin.content.addSlide")}
          </Button>
        )}
      </div>

      {draft && (
        <Panel className="mt-4 p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldWrapper label={t("admin.content.kind")}>
                <Select
                  value={draft.kind}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value as SlideKind })}
                >
                  <option value="image">{t("admin.content.image")}</option>
                  <option value="video">{t("admin.content.video")}</option>
                </Select>
              </FieldWrapper>
              <FieldWrapper label={t("admin.content.placement")}>
                <Select
                  value={draft.placement}
                  onChange={(e) =>
                    setDraft({ ...draft, placement: e.target.value as SlidePlacement })
                  }
                >
                  <option value="hero">{t("admin.content.placementHero")}</option>
                  <option value="gallery">{t("admin.content.placementGallery")}</option>
                </Select>
              </FieldWrapper>
              <FieldWrapper label={t("admin.content.order")}>
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </FieldWrapper>
            </div>

            <FieldWrapper label={t("admin.content.url")}>
              <Input
                dir="ltr"
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                required
              />
              <UploadButton
                className="mt-2"
                kind={draft.kind}
                prefix="slides"
                onUploaded={(url) => setDraft({ ...draft, url })}
              />
            </FieldWrapper>

            {draft.kind === "video" && (
              <FieldWrapper label={t("admin.content.poster")}>
                <Input
                  dir="ltr"
                  value={draft.poster_url}
                  onChange={(e) => setDraft({ ...draft, poster_url: e.target.value })}
                />
                <UploadButton
                  className="mt-2"
                  prefix="slides"
                  onUploaded={(url) => setDraft({ ...draft, poster_url: url })}
                />
              </FieldWrapper>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrapper label={t("admin.content.titleFr")}>
                <Input
                  value={draft.title_fr}
                  onChange={(e) => setDraft({ ...draft, title_fr: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.content.titleAr")}>
                <Input
                  dir="rtl"
                  value={draft.title_ar}
                  onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.content.subtitleFr")}>
                <Input
                  value={draft.subtitle_fr}
                  onChange={(e) => setDraft({ ...draft, subtitle_fr: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.content.subtitleAr")}>
                <Input
                  dir="rtl"
                  value={draft.subtitle_ar}
                  onChange={(e) => setDraft({ ...draft, subtitle_ar: e.target.value })}
                />
              </FieldWrapper>
            </div>

            <FieldWrapper label={t("admin.content.link")}>
              <Input
                dir="ltr"
                value={draft.link_url}
                onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
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
              <Button type="submit" disabled={saveSlide.isPending}>
                {saveSlide.isPending ? t("common.saving") : t("common.save")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {isLoading && <p className="mt-4 text-sm text-muted">{t("common.loading")}</p>}
      {!isLoading && (slides ?? []).length === 0 && (
        <Panel className="mt-4 p-6 text-sm text-muted">{t("admin.content.noSlides")}</Panel>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(slides ?? []).map((slide) => (
          <Panel key={slide.id} className={cn("overflow-hidden", !slide.active && "opacity-60")}>
            <div className="aspect-video bg-panel-2">
              {slide.kind === "video" ? (
                <video
                  src={slide.url}
                  poster={slide.poster_url ?? undefined}
                  preload="none"
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={slide.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <p className="truncate text-sm font-medium">
                {pickLang(lang, slide.title_fr, slide.title_ar) || slide.url.split("/").pop()}
              </p>
              <p className="text-xs text-muted">
                {slide.placement === "hero"
                  ? t("admin.content.placementHero")
                  : t("admin.content.placementGallery")}
                {" · "}
                {slide.kind === "video" ? t("admin.content.video") : t("admin.content.image")}
                {` · #${slide.sort_order}`}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setDraft(toDraft(slide))}>
                  {t("common.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t("common.delete")}
                  onClick={() => {
                    if (confirm(t("admin.content.deleteConfirm"))) deleteSlide.mutate(slide.id);
                  }}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------- named picture slots */

function SlotsSection() {
  const { t, lang } = useLanguage();
  const { data: images } = useSiteImages();
  const saveImage = useSaveSiteImage();
  const clearImage = useClearSiteImage();

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl">{t("admin.content.slots")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted">{t("admin.content.slotsHint")}</p>

      {IMAGE_SLOT_GROUPS.map((group) => (
        <div key={group.key} className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            {pickLang(lang, group.label_fr, group.label_ar)}
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IMAGE_SLOTS.filter((slot) => slot.group === group.key).map((slot) => {
              const row = images?.[slot.slot];
              return (
                <Panel key={slot.slot} className="p-4">
                  <div
                    className="mb-3 flex items-center justify-center overflow-hidden rounded-2xl bg-panel-2"
                    style={{ aspectRatio: slot.ratio }}
                  >
                    {row ? (
                      <img
                        src={row.url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageOff size={22} className="text-muted" />
                    )}
                  </div>

                  <p className="text-sm font-medium">
                    {pickLang(lang, slot.label_fr, slot.label_ar)}
                  </p>
                  <p className="text-xs text-muted">
                    {row ? t("admin.content.slotFilled") : t("admin.content.slotEmpty")} · {slot.ratio}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <UploadButton
                      prefix="site"
                      onUploaded={(url) =>
                        saveImage.mutate({
                          slot: slot.slot,
                          url,
                          alt_fr: row?.alt_fr ?? undefined,
                          alt_ar: row?.alt_ar ?? undefined,
                        })
                      }
                    />
                    {row && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => clearImage.mutate(slot.slot)}
                      >
                        {t("admin.content.clear")}
                      </Button>
                    )}
                  </div>

                  {row && (
                    <div className="mt-3 space-y-2">
                      <Input
                        placeholder={t("admin.content.altFr")}
                        defaultValue={row.alt_fr ?? ""}
                        onBlur={(e) =>
                          saveImage.mutate({
                            slot: slot.slot,
                            url: row.url,
                            alt_fr: e.target.value,
                            alt_ar: row.alt_ar ?? undefined,
                          })
                        }
                      />
                      <Input
                        dir="rtl"
                        placeholder={t("admin.content.altAr")}
                        defaultValue={row.alt_ar ?? ""}
                        onBlur={(e) =>
                          saveImage.mutate({
                            slot: slot.slot,
                            url: row.url,
                            alt_fr: row.alt_fr ?? undefined,
                            alt_ar: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </Panel>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
