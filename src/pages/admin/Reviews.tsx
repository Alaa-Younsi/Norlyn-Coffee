import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select, Textarea } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import type { ClientReview } from "@/types/db";

export function AdminReviews() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [stars, setStars] = useState("5");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: reviews } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async (): Promise<ClientReview[]> => {
      const { data, error: qError } = await supabase
        .from("client_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (qError) throw qError;
      return data as ClientReview[];
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    void queryClient.invalidateQueries({ queryKey: ["reviews"] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error: insError } = await supabase.from("client_reviews").insert({
        client_name: name.trim(),
        stars: Math.min(5, Math.max(1, Number(stars))),
        review_text: text.trim(),
        active: true,
      });
      if (insError) throw insError;
    },
    onSuccess: () => {
      setName("");
      setText("");
      setStars("5");
      setError(null);
      invalidate();
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error: upError } = await supabase.from("client_reviews").update(patch).eq("id", id);
      if (upError) throw upError;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: delError } = await supabase.from("client_reviews").delete().eq("id", id);
      if (delError) throw delError;
    },
    onSuccess: invalidate,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() && text.trim()) createMutation.mutate();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">{t("admin.nav.reviews")}</h1>

      <Panel className="mt-6 p-6">
        <h2 className="font-display text-xl">{t("admin.reviews.new")}</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <FieldWrapper label={t("admin.reviews.name")} className="min-w-44 flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </FieldWrapper>
            <FieldWrapper label={t("admin.reviews.stars")} className="w-28">
              <Select value={stars} onChange={(e) => setStars(e.target.value)}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </Select>
            </FieldWrapper>
          </div>
          <FieldWrapper label={t("admin.reviews.text")}>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} required />
          </FieldWrapper>
          {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending}>
            <Plus size={15} />
            {t("common.add")}
          </Button>
        </form>
      </Panel>

      <div className="mt-6 space-y-3">
        {(reviews ?? []).map((review) => (
          <Panel key={review.id} className="flex items-start gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{review.client_name}</p>
                <span className="flex items-center gap-0.5 text-brand">
                  {Array.from({ length: review.stars }, (_, i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted">{review.review_text}</p>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={review.active}
                onChange={(e) =>
                  patchMutation.mutate({ id: review.id, patch: { active: e.target.checked } })
                }
                className="h-4 w-4 cursor-pointer accent-[rgb(var(--c-brand))]"
              />
              {t("admin.reviews.visible")}
            </label>
            <button
              onClick={() => deleteMutation.mutate(review.id)}
              className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-600 cursor-pointer"
              aria-label={t("common.delete")}
            >
              <Trash2 size={15} />
            </button>
          </Panel>
        ))}
      </div>
    </div>
  );
}
