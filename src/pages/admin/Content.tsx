import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { UploadButton } from "@/components/admin/UploadButton";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  useAllSlidesAdmin,
  useClearSiteImage,
  useClearSiteVideo,
  useDeleteSlide,
  useSaveSiteImage,
  useSaveSiteVideo,
  useSaveSlide,
  useSiteImages,
  useSiteVideos,
} from "@/hooks/useSiteContent";
import { IMAGE_SLOTS, IMAGE_SLOT_GROUPS } from "@/lib/imageSlots";
import { VIDEO_SLOTS, videoSlotFallback } from "@/lib/videoSlots";
import { mediaSrc } from "@/lib/media";
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
  title_en: string;
  subtitle_fr: string;
  subtitle_ar: string;
  subtitle_en: string;
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
    title_en: "",
    subtitle_fr: "",
    subtitle_ar: "",
    subtitle_en: "",
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
    title_en: slide.title_en ?? "",
    subtitle_fr: slide.subtitle_fr ?? "",
    subtitle_ar: slide.subtitle_ar ?? "",
    subtitle_en: slide.subtitle_en ?? "",
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
      <VideoSlotsSection />
      <SlotsSection />
    </div>
  );
}

/* ------------------------------------------------------- named film slots */

/**
 * The two fixed films — the hero screen and the loop that plays on every
 * product page. Same shape as the picture slots below: the design names the
 * frame, the client fills it, and clearing it falls back to whatever ships.
 */
function VideoSlotsSection() {
  const { t, lang } = useLanguage();
  const { data: videos } = useSiteVideos();
  const saveVideo = useSaveSiteVideo();
  const clearVideo = useClearSiteVideo();

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl">{t("admin.content.videos")}</h2>
      <p className="mt-1 max-w-xl text-sm text-muted">{t("admin.content.videosHint")}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {VIDEO_SLOTS.map((slot) => {
          const row = videos?.[slot.slot];
          const shipped = videoSlotFallback(slot);
          const src = row?.url ?? shipped.src;
          const poster = row?.poster_url ?? shipped.poster;

          return (
            <Panel key={slot.slot} className="p-4">
              {/* `key` on the player: React keeps the same <video> element
                  across a src change and goes on showing the old frame, so a
                  freshly uploaded film looks like a failed upload until the
                  page is reloaded. Re-keying mounts a new one. */}
              <div
                className="mb-3 overflow-hidden rounded-2xl bg-panel-2"
                style={{ aspectRatio: slot.ratio }}
              >
                <video
                  key={src}
                  src={src}
                  poster={poster}
                  controls
                  muted
                  playsInline
                  preload="none"
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="text-sm font-medium">
                {pickLang(lang, slot.label_fr, slot.label_ar, slot.label_en)}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-muted">
                {pickLang(lang, slot.hint_fr, slot.hint_ar, slot.hint_en)}
              </p>
              <p className="mt-1 text-xs text-brand">
                {row ? t("admin.content.slotFilled") : t("admin.content.videoShipped")}
              </p>

              <div className="mt-3 space-y-3">
                <FieldWrapper label={t("admin.content.videoFile")}>
                  <Input
                    dir="ltr"
                    key={`${slot.slot}-url-${row?.url ?? ""}`}
                    placeholder={shipped.src}
                    defaultValue={row?.url ?? ""}
                    onBlur={(e) => {
                      const url = e.target.value.trim();
                      // an emptied box means "go back to the shipped film",
                      // which is the delete, not an upsert of an empty url
                      if (!url) {
                        if (row) clearVideo.mutate(slot.slot);
                        return;
                      }
                      if (url === row?.url) return;
                      saveVideo.mutate({
                        slot: slot.slot,
                        url,
                        poster_url: row?.poster_url ?? null,
                      });
                    }}
                  />
                  <UploadButton
                    className="mt-2"
                    kind="video"
                    label={t("admin.content.videoUpload")}
                    onUploaded={(url) =>
                      saveVideo.mutate({
                        slot: slot.slot,
                        url,
                        poster_url: row?.poster_url ?? null,
                      })
                    }
                  />
                </FieldWrapper>

                <FieldWrapper label={t("admin.content.poster")}>
                  <Input
                    dir="ltr"
                    key={`${slot.slot}-poster-${row?.poster_url ?? ""}`}
                    placeholder={shipped.poster}
                    defaultValue={row?.poster_url ?? ""}
                    // a poster with no film of its own would be a row that
                    // overrides the shipped video with nothing — disabled
                    // until there is something to put a still in front of
                    disabled={!row}
                    onBlur={(e) => {
                      if (!row) return;
                      const value = e.target.value.trim() || null;
                      if (value === (row.poster_url ?? null)) return;
                      saveVideo.mutate({ slot: slot.slot, url: row.url, poster_url: value });
                    }}
                  />
                  {row && (
                    <UploadButton
                      className="mt-2"
                      prefix="site"
                      onUploaded={(url) =>
                        saveVideo.mutate({ slot: slot.slot, url: row.url, poster_url: url })
                      }
                    />
                  )}
                </FieldWrapper>
              </div>

              {row && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => clearVideo.mutate(slot.slot)}
                >
                  {t("admin.content.videoRestore")}
                </Button>
              )}
            </Panel>
          );
        })}
      </div>
    </section>
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
        title_en: draft.title_en.trim() || null,
        subtitle_fr: draft.subtitle_fr.trim() || null,
        subtitle_ar: draft.subtitle_ar.trim() || null,
        subtitle_en: draft.subtitle_en.trim() || null,
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
              <FieldWrapper label={t("admin.content.titleEn")}>
                <Input
                  dir="ltr"
                  value={draft.title_en}
                  onChange={(e) => setDraft({ ...draft, title_en: e.target.value })}
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
              <FieldWrapper label={t("admin.content.subtitleEn")}>
                <Input
                  dir="ltr"
                  value={draft.subtitle_en}
                  onChange={(e) => setDraft({ ...draft, subtitle_en: e.target.value })}
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
                {pickLang(lang, slide.title_fr, slide.title_ar, slide.title_en) || slide.url.split("/").pop()}
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
            {pickLang(lang, group.label_fr, group.label_ar, group.label_en)}
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IMAGE_SLOTS.filter((slot) => slot.group === group.key).map((slot) => {
              const row = images?.[slot.slot];
              // No row does not mean no picture: the slot ships one, and the
              // storefront is showing it right now. Previewing the shipped
              // photo is the only honest answer to "what is on my site?" — the
              // old empty-icon state described a page that no longer exists.
              const preview = row?.url ?? mediaSrc(slot.fallback);
              // The three alt texts as they stand right now — the row's if the
              // client has typed one, otherwise the wording that describes the
              // shipped photograph. Every write below sends all three, so
              // editing one language never blanks the other two.
              const alts = {
                alt_fr: row?.alt_fr ?? slot.alt_fr,
                alt_ar: row?.alt_ar ?? slot.alt_ar,
                alt_en: row?.alt_en ?? slot.alt_en,
              };
              return (
                <Panel key={slot.slot} className="p-4">
                  <div
                    className="mb-3 flex items-center justify-center overflow-hidden rounded-2xl bg-panel-2"
                    style={{ aspectRatio: slot.ratio }}
                  >
                    <img
                      src={preview}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <p className="text-sm font-medium">
                    {pickLang(lang, slot.label_fr, slot.label_ar, slot.label_en)}
                  </p>
                  <p className="text-xs text-muted">
                    {row ? t("admin.content.slotFilled") : t("admin.content.slotEmpty")} · {slot.ratio}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <UploadButton
                      prefix="site"
                      onUploaded={(url) => saveImage.mutate({ slot: slot.slot, url, ...alts })}
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

                  {/* Editable on every slot, not just customised ones. The alt
                      text describes whatever picture is currently in the slot,
                      and the shipped photo is a picture — a blind shopper on
                      the About page has no way to tell which of the two it is.
                      Typing here on an untouched slot pins the shipped photo
                      into a row with the new wording, which is exactly what
                      "keep this picture, change its description" should do. */}
                  <div className="mt-3 space-y-2">
                    <Input
                      key={`${slot.slot}-fr-${alts.alt_fr}`}
                      placeholder={t("admin.content.altFr")}
                      defaultValue={alts.alt_fr}
                      onBlur={(e) =>
                        saveImage.mutate({
                          slot: slot.slot,
                          url: preview,
                          ...alts,
                          alt_fr: e.target.value,
                        })
                      }
                    />
                    <Input
                      dir="rtl"
                      key={`${slot.slot}-ar-${alts.alt_ar}`}
                      placeholder={t("admin.content.altAr")}
                      defaultValue={alts.alt_ar}
                      onBlur={(e) =>
                        saveImage.mutate({
                          slot: slot.slot,
                          url: preview,
                          ...alts,
                          alt_ar: e.target.value,
                        })
                      }
                    />
                    <Input
                      dir="ltr"
                      key={`${slot.slot}-en-${alts.alt_en}`}
                      placeholder={t("admin.content.altEn")}
                      defaultValue={alts.alt_en}
                      onBlur={(e) =>
                        saveImage.mutate({
                          slot: slot.slot,
                          url: preview,
                          ...alts,
                          alt_en: e.target.value,
                        })
                      }
                    />
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
