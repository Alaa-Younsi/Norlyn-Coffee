import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { UploadButton } from "@/components/admin/UploadButton";
import { adminToast } from "@/lib/adminToast";
import { useCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { deleteUploadedImage } from "@/lib/upload";
import { slugify } from "@/lib/utils";
import type { Category } from "@/types/db";

export function AdminCategories() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["categories"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const base = slugify(nameFr) || "categorie";
      let slug = base;
      for (let i = 2; i < 20; i++) {
        const { data } = await supabase.from("categories").select("id").eq("slug", slug).limit(1);
        if (!data || data.length === 0) break;
        slug = `${base}-${i}`;
      }
      const { error: insError } = await supabase.from("categories").insert({
        slug,
        name_fr: nameFr.trim(),
        name_ar: nameAr.trim() || nameFr.trim(),
        // NULL, not a French copy: `pickLang` already falls back to French,
        // and a real value here would look translated in the admin listing
        name_en: nameEn.trim() || null,
        sort_order: categories?.length ?? 0,
      });
      if (insError) throw insError;
    },
    onSuccess: () => {
      setNameFr("");
      setNameAr("");
      setNameEn("");
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: delError } = await supabase.from("categories").delete().eq("id", id);
      if (delError) throw delError;
    },
    onSuccess: invalidate,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (nameFr.trim()) createMutation.mutate();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">{t("admin.nav.categories")}</h1>

      <Panel className="mt-6 p-6">
        <h2 className="font-display text-xl">{t("admin.categories.new")}</h2>
        <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
          <FieldWrapper label={t("admin.form.nameFr")} className="min-w-40 flex-1">
            <Input value={nameFr} onChange={(e) => setNameFr(e.target.value)} required />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.nameAr")} className="min-w-40 flex-1">
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.nameEn")} className="min-w-40 flex-1">
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
          </FieldWrapper>
          <Button type="submit" disabled={createMutation.isPending}>
            <Plus size={15} />
            {t("common.add")}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
      </Panel>

      <Panel className="mt-6 divide-y divide-line/60">
        {(categories ?? []).map((category) =>
          editingId === category.id ? (
            <CategoryEditRow
              key={category.id}
              category={category}
              onClose={() => setEditingId(null)}
            />
          ) : (
            <div key={category.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt=""
                    width={44}
                    height={44}
                    loading="lazy"
                    decoding="async"
                    className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-muted">
                    {t("admin.categories.noImage")}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{category.name_fr}</p>
                  <p className="truncate text-sm text-muted" dir="rtl">
                    {category.name_ar}
                  </p>
                  {category.name_en && (
                    <p className="truncate text-sm text-muted" dir="ltr">
                      {category.name_en}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => setEditingId(category.id)}
                  className="rounded-lg p-2 text-muted hover:text-brand cursor-pointer"
                  aria-label={t("admin.categories.edit")}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(t("admin.categories.deleteConfirm"))) {
                      deleteMutation.mutate(category.id);
                    }
                  }}
                  className="rounded-lg p-2 text-muted hover:text-red-600 cursor-pointer"
                  aria-label={t("common.delete")}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ),
        )}
      </Panel>
    </div>
  );
}

function CategoryEditRow({ category, onClose }: { category: Category; onClose: () => void }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [nameFr, setNameFr] = useState(category.name_fr);
  const [nameAr, setNameAr] = useState(category.name_ar);
  const [nameEn, setNameEn] = useState(category.name_en ?? "");
  const [imageUrl, setImageUrl] = useState(category.image_url ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("categories")
        .update({
          name_fr: nameFr.trim(),
          name_ar: nameAr.trim() || nameFr.trim(),
          name_en: nameEn.trim() || null,
          image_url: imageUrl || null,
        })
        .eq("id", category.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      adminToast.success("admin.toast.saved");
      onClose();
    },
    onError: () => adminToast.error("admin.toast.saveError"),
  });

  const clearImage = () => {
    if (imageUrl) void deleteUploadedImage(imageUrl);
    setImageUrl("");
  };

  // Replacing an already-set image must drop the OLD file too — otherwise
  // every re-upload leaves the previous one orphaned in the bucket forever
  // (same cost trap lib/upload.ts's deleteUploadedImage() exists to avoid).
  const handleImageUploaded = (url: string) => {
    if (imageUrl && imageUrl !== url) void deleteUploadedImage(imageUrl);
    setImageUrl(url);
  };

  return (
    <div className="space-y-4 px-5 py-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{category.name_fr}</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted hover:text-ink cursor-pointer"
          aria-label={t("common.cancel")}
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <FieldWrapper label={t("admin.form.nameFr")}>
          <Input value={nameFr} onChange={(e) => setNameFr(e.target.value)} required />
        </FieldWrapper>
        <FieldWrapper label={t("admin.form.nameAr")}>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
        </FieldWrapper>
        <FieldWrapper label={t("admin.form.nameEn")}>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
        </FieldWrapper>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink">{t("admin.categories.image")}</span>
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg border border-line object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-line text-[10px] text-muted">
              {t("admin.categories.noImage")}
            </div>
          )}
          <UploadButton prefix="categories" onUploaded={handleImageUploaded} />
          {imageUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={clearImage}>
              <Trash2 size={14} />
              {t("common.delete")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || !nameFr.trim()}>
          {save.isPending ? t("common.saving") : t("common.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
