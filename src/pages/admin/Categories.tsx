import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { useCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

export function AdminCategories() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        {(categories ?? []).map((category) => (
          <div key={category.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
            <div>
              <p className="font-medium">{category.name_fr}</p>
              <p className="text-sm text-muted" dir="rtl">
                {category.name_ar}
              </p>
              {category.name_en && (
                <p className="text-sm text-muted" dir="ltr">
                  {category.name_en}
                </p>
              )}
            </div>
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
        ))}
      </Panel>
    </div>
  );
}
