import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select, Textarea } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { UploadButton } from "@/components/admin/UploadButton";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAllArticlesAdmin, useDeleteArticle, useSaveArticle } from "@/hooks/useSiteContent";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Article, ArticleStatus } from "@/types/db";

/** slug is unique and slugify("<arabic only>") is "" — probe until free. */
async function uniqueSlug(titleFr: string, excludeId?: string): Promise<string> {
  const base = slugify(titleFr) || "article";
  let candidate = base;
  for (let i = 2; i < 50; i += 1) {
    let query = supabase.from("articles").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

interface Draft {
  id?: string;
  slug: string;
  title_fr: string;
  title_ar: string;
  excerpt_fr: string;
  excerpt_ar: string;
  body_fr: string;
  body_ar: string;
  cover_url: string;
  tag_fr: string;
  tag_ar: string;
  author: string;
  read_minutes: number;
  featured: boolean;
  status: ArticleStatus;
  published_at: string | null;
}

function emptyDraft(): Draft {
  return {
    slug: "",
    title_fr: "",
    title_ar: "",
    excerpt_fr: "",
    excerpt_ar: "",
    body_fr: "",
    body_ar: "",
    cover_url: "",
    tag_fr: "",
    tag_ar: "",
    author: "Norlyn Coffee",
    read_minutes: 3,
    featured: false,
    status: "draft",
    published_at: null,
  };
}

function toDraft(article: Article): Draft {
  return {
    id: article.id,
    slug: article.slug,
    title_fr: article.title_fr,
    title_ar: article.title_ar,
    excerpt_fr: article.excerpt_fr ?? "",
    excerpt_ar: article.excerpt_ar ?? "",
    body_fr: article.body_fr ?? "",
    body_ar: article.body_ar ?? "",
    cover_url: article.cover_url ?? "",
    tag_fr: article.tag_fr ?? "",
    tag_ar: article.tag_ar ?? "",
    author: article.author ?? "",
    read_minutes: article.read_minutes,
    featured: article.featured,
    status: article.status,
    published_at: article.published_at,
  };
}

export function AdminArticles() {
  const { t, lang } = useLanguage();
  const { data: articles, isLoading } = useAllArticlesAdmin();
  const saveArticle = useSaveArticle();
  const deleteArticle = useDeleteArticle();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const slug = draft.slug.trim() || (await uniqueSlug(draft.title_fr, draft.id));
      await saveArticle.mutateAsync({
        id: draft.id,
        slug,
        title_fr: draft.title_fr.trim(),
        title_ar: draft.title_ar.trim(),
        excerpt_fr: draft.excerpt_fr.trim() || null,
        excerpt_ar: draft.excerpt_ar.trim() || null,
        body_fr: draft.body_fr,
        body_ar: draft.body_ar,
        cover_url: draft.cover_url.trim() || null,
        tag_fr: draft.tag_fr.trim() || null,
        tag_ar: draft.tag_ar.trim() || null,
        author: draft.author.trim() || null,
        read_minutes: Number(draft.read_minutes) || 1,
        featured: draft.featured,
        status: draft.status,
        // stamped the FIRST time it goes live and kept afterwards — re-saving a
        // published article must not shuffle it back to the top of the feed
        published_at:
          draft.status === "published"
            ? (draft.published_at ?? new Date().toISOString())
            : draft.published_at,
      });
      setDraft(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{t("admin.articles.title")}</h1>
        {!draft && (
          <Button onClick={() => setDraft(emptyDraft())}>
            <Plus size={16} />
            {t("admin.articles.new")}
          </Button>
        )}
      </div>

      {draft && (
        <Panel className="mt-6 p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrapper label={t("admin.articles.titleFr")}>
                <Input
                  value={draft.title_fr}
                  onChange={(e) => setDraft({ ...draft, title_fr: e.target.value })}
                  required
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.articles.titleAr")}>
                <Input
                  dir="rtl"
                  value={draft.title_ar}
                  onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })}
                  required
                />
              </FieldWrapper>
            </div>

            <FieldWrapper label={t("admin.articles.slug")}>
              <Input
                dir="ltr"
                placeholder={slugify(draft.title_fr)}
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
            </FieldWrapper>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrapper label={t("admin.articles.excerptFr")}>
                <Textarea
                  rows={3}
                  value={draft.excerpt_fr}
                  onChange={(e) => setDraft({ ...draft, excerpt_fr: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.articles.excerptAr")}>
                <Textarea
                  dir="rtl"
                  rows={3}
                  value={draft.excerpt_ar}
                  onChange={(e) => setDraft({ ...draft, excerpt_ar: e.target.value })}
                />
              </FieldWrapper>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrapper label={t("admin.articles.bodyFr")}>
                <Textarea
                  rows={10}
                  value={draft.body_fr}
                  onChange={(e) => setDraft({ ...draft, body_fr: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.articles.bodyAr")}>
                <Textarea
                  dir="rtl"
                  rows={10}
                  value={draft.body_ar}
                  onChange={(e) => setDraft({ ...draft, body_ar: e.target.value })}
                />
              </FieldWrapper>
            </div>
            <p className="-mt-2 text-xs text-muted">{t("admin.articles.bodyHint")}</p>

            <FieldWrapper label={t("admin.articles.cover")}>
              <Input
                dir="ltr"
                value={draft.cover_url}
                onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })}
              />
              <UploadButton
                className="mt-2"
                prefix="articles"
                onUploaded={(url) => setDraft({ ...draft, cover_url: url })}
              />
            </FieldWrapper>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FieldWrapper label={t("admin.articles.tagFr")}>
                <Input
                  value={draft.tag_fr}
                  onChange={(e) => setDraft({ ...draft, tag_fr: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.articles.tagAr")}>
                <Input
                  dir="rtl"
                  value={draft.tag_ar}
                  onChange={(e) => setDraft({ ...draft, tag_ar: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.articles.author")}>
                <Input
                  value={draft.author}
                  onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                />
              </FieldWrapper>
              <FieldWrapper label={t("admin.articles.readMinutes")}>
                <Input
                  type="number"
                  min={1}
                  value={draft.read_minutes}
                  onChange={(e) => setDraft({ ...draft, read_minutes: Number(e.target.value) })}
                />
              </FieldWrapper>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <FieldWrapper label={t("admin.articles.status")} className="w-44">
                <Select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as ArticleStatus })}
                >
                  <option value="draft">{t("admin.articles.draft")}</option>
                  <option value="published">{t("admin.articles.published")}</option>
                </Select>
              </FieldWrapper>
              <label className="mt-5 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-[rgb(var(--c-brand))]"
                  checked={draft.featured}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                />
                {t("admin.articles.featured")}
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? t("common.saving") : t("common.save")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {isLoading && <p className="mt-6 text-sm text-muted">{t("common.loading")}</p>}
      {!isLoading && (articles ?? []).length === 0 && (
        <Panel className="mt-6 p-6 text-sm text-muted">{t("admin.articles.none")}</Panel>
      )}

      <div className="mt-6 space-y-3">
        {(articles ?? []).map((article) => (
          <Panel
            key={article.id}
            className={cn("flex flex-wrap items-center gap-4 p-4", article.status === "draft" && "opacity-70")}
          >
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-panel-2">
              {article.cover_url && (
                <img
                  src={article.cover_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {lang === "ar" ? article.title_ar : article.title_fr}
              </p>
              <p className="text-xs text-muted">
                {article.status === "published"
                  ? t("admin.articles.published")
                  : t("admin.articles.draft")}
                {article.published_at && ` · ${formatDate(article.published_at, lang)}`}
                {article.featured && ` · ${t("admin.articles.featured")}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDraft(toDraft(article))}>
                {t("common.edit")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("common.delete")}
                onClick={() => {
                  if (confirm(t("admin.articles.deleteConfirm"))) deleteArticle.mutate(article.id);
                }}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
