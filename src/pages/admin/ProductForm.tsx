import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select, Textarea } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { adminToast } from "@/lib/adminToast";
import { useCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/i18n/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image";
import { deleteUploadedImage } from "@/lib/upload";
import { invalidateProduct } from "@/lib/queryCache";
import { slugify } from "@/lib/utils";
import type { Product, ProductImage } from "@/types/db";

interface FormState {
  name_fr: string;
  name_ar: string;
  name_en: string;
  description_fr: string;
  description_ar: string;
  description_en: string;
  details_fr: string;
  details_ar: string;
  details_en: string;
  price: string;
  compare_at_price: string;
  category_id: string;
  stock: string;
  intensity: string;
  dosage: string;
  accent_color: string;
  video_url: string;
  featured: boolean;
  status: "active" | "draft";
}

const EMPTY: FormState = {
  name_fr: "",
  name_ar: "",
  name_en: "",
  description_fr: "",
  description_ar: "",
  description_en: "",
  details_fr: "",
  details_ar: "",
  details_en: "",
  price: "",
  compare_at_price: "",
  category_id: "",
  stock: "0",
  intensity: "",
  dosage: "",
  accent_color: "#b08439",
  video_url: "",
  featured: false,
  status: "draft",
};

function toFormState(product: Product): FormState {
  return {
    name_fr: product.name_fr,
    name_ar: product.name_ar,
    name_en: product.name_en ?? "",
    description_fr: product.description_fr ?? "",
    description_ar: product.description_ar ?? "",
    description_en: product.description_en ?? "",
    details_fr: product.details_fr.join("\n"),
    details_ar: product.details_ar.join("\n"),
    // `?? []` and not a bare `.join`: a row written before migration 0012
    // comes back with the column absent, not empty
    details_en: (product.details_en ?? []).join("\n"),
    price: String(product.price),
    compare_at_price: product.compare_at_price !== null ? String(product.compare_at_price) : "",
    category_id: product.category_id ?? "",
    stock: String(product.stock),
    intensity: product.intensity !== null ? String(product.intensity) : "",
    dosage: product.dosage ?? "",
    accent_color: product.accent_color ?? "#b08439",
    video_url: product.video_url ?? "",
    featured: product.featured,
    status: product.status,
  };
}

/** slug has a unique constraint and slugify("<arabic only>") is "" — probe until free */
async function uniqueSlug(nameFr: string, excludeId?: string): Promise<string> {
  const base = slugify(nameFr) || "produit";
  let candidate = base;
  for (let i = 2; i < 50; i++) {
    let query = supabase.from("products").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const { t } = useLanguage();

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    enabled: !isNew,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("id", id as string)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  if (!isNew && isLoading) return <p className="text-muted">{t("common.loading")}</p>;
  if (!isNew && !product) return <p className="text-muted">{t("product.notFound")}</p>;

  return (
    <ProductFormInner
      key={product?.id ?? "new"}
      productId={isNew ? null : (id as string)}
      initial={product ? toFormState(product) : EMPTY}
      initialImages={
        product ? [...(product.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order) : []
      }
    />
  );
}

function ProductFormInner({
  productId,
  initial,
  initialImages,
}: {
  productId: string | null;
  initial: FormState;
  initialImages: ProductImage[];
}) {
  const isNew = productId === null;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  const [form, setForm] = useState<FormState>(initial);
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const invalidate = () => invalidateProduct(queryClient, productId);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!productId) return;
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const [i, file] of files.entries()) {
        // never upload the raw phone photo — compress first
        const blob = await compressImage(file);
        const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
        const path = `${productId}/${crypto.randomUUID()}.${ext}`;
        const { error: upError } = await supabase.storage
          .from("product-images")
          // path contains a UUID → immutable; Supabase's default cache is only 1h
          .upload(path, blob, { cacheControl: "31536000", contentType: blob.type });
        if (upError) throw upError;
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        const { data: row, error: insError } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            url: pub.publicUrl,
            alt: form.name_fr,
            sort_order: images.length + i,
          })
          .select()
          .single();
        if (insError) throw insError;
        setImages((prev) => [...prev, row as ProductImage]);
      }
      invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      adminToast.error("admin.toast.uploadError");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = async (image: ProductImage) => {
    // check the error BEFORE dropping it from the list: an RLS refusal here
    // used to leave the photo gone from the form and still live on the shop
    const { error: delError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", image.id);
    if (delError) {
      setError(delError.message);
      adminToast.error("admin.toast.deleteError");
      return;
    }
    // the row is gone, so the file is now unreachable — take it out of the
    // bucket too rather than paying to store it forever. Best-effort: the
    // delete the admin asked for has already succeeded.
    void deleteUploadedImage(image.url);
    setImages((prev) => prev.filter((i) => i.id !== image.id));
    invalidate();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name_fr: form.name_fr.trim(),
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim() || null,
        description_fr: form.description_fr.trim() || null,
        description_ar: form.description_ar.trim() || null,
        description_en: form.description_en.trim() || null,
        details_fr: form.details_fr.split("\n").map((s) => s.trim()).filter(Boolean),
        details_ar: form.details_ar.split("\n").map((s) => s.trim()).filter(Boolean),
        details_en: form.details_en.split("\n").map((s) => s.trim()).filter(Boolean),
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        category_id: form.category_id || null,
        stock: Math.max(0, Math.trunc(Number(form.stock) || 0)),
        intensity: form.intensity ? Math.min(100, Math.max(0, Number(form.intensity))) : null,
        dosage: form.dosage.trim() || null,
        accent_color: form.accent_color || null,
        video_url: form.video_url.trim() || null,
        featured: form.featured,
        status: form.status,
      };
      if (!payload.name_fr || !Number.isFinite(payload.price) || payload.price < 0) {
        throw new Error(t("err.invalidInput"));
      }

      if (isNew) {
        const slug = await uniqueSlug(payload.name_fr);
        const { data, error: insError } = await supabase
          .from("products")
          .insert({ ...payload, slug })
          .select("id")
          .single();
        if (insError) throw insError;
        invalidate();
        adminToast.success("admin.toast.saved");
        navigate(`/admin/products/${(data as { id: string }).id}`, { replace: true });
      } else {
        const { error: upError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId);
        if (upError) throw upError;
        invalidate();
        adminToast.success("admin.toast.saved");
        navigate("/admin/products");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      // the inline message explains WHAT broke; the toast makes sure a save
      // that failed is never mistaken for one that worked
      adminToast.error("admin.toast.saveError");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand"
      >
        <ChevronLeft size={15} className="rtl:rotate-180" />
        {t("common.back")}
      </Link>
      <h1 className="mt-2 font-display text-3xl">
        {isNew ? t("admin.products.new") : form.name_fr}
      </h1>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <Panel className="grid gap-4 p-6 sm:grid-cols-2">
          <FieldWrapper label={t("admin.form.nameFr")}>
            <Input value={form.name_fr} onChange={(e) => set("name_fr", e.target.value)} required />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.nameAr")}>
            <Input value={form.name_ar} onChange={(e) => set("name_ar", e.target.value)} dir="rtl" />
          </FieldWrapper>
          {/* Every English box may be left empty. pickLang falls back to the
              French one, so a half-translated product reads as French rather
              than as a blank card — see lib/localized.ts. */}
          <FieldWrapper label={t("admin.form.nameEn")}>
            <Input value={form.name_en} onChange={(e) => set("name_en", e.target.value)} dir="ltr" />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.descFr")}>
            <Textarea value={form.description_fr} onChange={(e) => set("description_fr", e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.descAr")}>
            <Textarea value={form.description_ar} onChange={(e) => set("description_ar", e.target.value)} dir="rtl" />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.descEn")}>
            <Textarea value={form.description_en} onChange={(e) => set("description_en", e.target.value)} dir="ltr" />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.detailsFr")}>
            <Textarea value={form.details_fr} onChange={(e) => set("details_fr", e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.detailsAr")}>
            <Textarea value={form.details_ar} onChange={(e) => set("details_ar", e.target.value)} dir="rtl" />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.detailsEn")}>
            <Textarea value={form.details_en} onChange={(e) => set("details_en", e.target.value)} dir="ltr" />
          </FieldWrapper>
        </Panel>

        <Panel className="grid gap-4 p-6 sm:grid-cols-3">
          <FieldWrapper label={t("admin.form.price")}>
            <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} required />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.compareAt")}>
            <Input type="number" step="0.01" min="0" value={form.compare_at_price} onChange={(e) => set("compare_at_price", e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.stock")}>
            <Input type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.category")}>
            <Select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
              <option value="">{t("admin.form.noCategory")}</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_fr}
                </option>
              ))}
            </Select>
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.intensity")}>
            <Input type="number" min="0" max="100" value={form.intensity} onChange={(e) => set("intensity", e.target.value)} />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.dosage")}>
            <Input value={form.dosage} onChange={(e) => set("dosage", e.target.value)} placeholder="5,6 g" />
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.accent")}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => set("accent_color", e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-panel"
                aria-label={t("admin.form.accent")}
              />
              <Input value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)} dir="ltr" />
            </div>
          </FieldWrapper>
          <FieldWrapper label={t("admin.form.videoUrl")} className="sm:col-span-2">
            {/* plain URL — hosting can move to Cloudinary/Bunny with no code change */}
            <Input value={form.video_url} onChange={(e) => set("video_url", e.target.value)} dir="ltr" />
          </FieldWrapper>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--c-brand))]"
            />
            {t("admin.products.featured")}
          </label>
          <FieldWrapper label={t("admin.products.status")}>
            <Select value={form.status} onChange={(e) => set("status", e.target.value as FormState["status"])}>
              <option value="draft">{t("admin.products.draft")}</option>
              <option value="active">{t("admin.products.active")}</option>
            </Select>
          </FieldWrapper>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-display text-xl">{t("admin.form.images")}</h2>
          {isNew ? (
            <p className="mt-2 text-sm text-muted">{t("common.save")} →</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((image) => (
                <div key={image.id} className="group relative">
                  <img
                    src={image.url}
                    alt=""
                    width={96}
                    height={96}
                    loading="lazy"
                    decoding="async"
                    className="h-24 w-24 rounded-xl border border-line object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => void removeImage(image)}
                    className="absolute -top-2 -end-2 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                    aria-label={t("common.delete")}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-muted hover:border-brand hover:text-brand">
                <Upload size={18} />
                <span className="text-[10px]">
                  {uploading ? t("admin.form.uploading") : t("admin.form.upload")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => void handleUpload(e)}
                />
              </label>
            </div>
          )}
        </Panel>

        {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={saving} size="lg">
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </form>
    </div>
  );
}
