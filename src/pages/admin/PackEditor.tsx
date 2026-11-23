import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Minus, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { PageEditor } from "@/components/admin/pageBuilder/PageEditor";
import {
  Choice,
  Group,
  ListField,
  MediaField,
  NumberField,
  PlainField,
  Row,
  Toggle,
} from "@/components/admin/pageBuilder/fields";
import { tri, useTx } from "@/components/admin/pageBuilder/editorI18n";
import { useAdminPack, useCatalogue, useSavePack } from "@/hooks/usePacks";
import type { PackInput } from "@/hooks/usePacks";
import { formatPrice } from "@/lib/format";
import { packLineTotal, packQuote, sanitizePricing } from "@/lib/packPricing";
import type { PackItem, PackPricing, PackTier } from "@/lib/packPricing";
import { normalizePage, starterPackPage } from "@/lib/pageBuilder/defaults";
import type { PageDoc } from "@/lib/pageBuilder/types";
import type { Pack, Product } from "@/types/db";
import { cn } from "@/lib/utils";

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

function blankPack(): PackInput {
  return {
    slug: "",
    status: "draft",
    name_fr: "",
    name_ar: "",
    name_en: "",
    tagline_fr: "",
    tagline_ar: "",
    tagline_en: "",
    cover_url: "/images/life/range-table-lg.webp",
    items: [],
    pricing: { mode: "percent", value: 15, step: 10, ending: null, floor: 0, compare: "auto", tiers: [], free_shipping: false },
    starts_at: null,
    ends_at: null,
    max_per_order: 10,
    featured: false,
    sort_order: 0,
    page: starterPackPage(),
  };
}

export function AdminPackEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const { data: pack, isLoading } = useAdminPack(isNew ? undefined : id);
  const { data: catalogue } = useCatalogue(true);
  const tx = useTx();

  if (!isNew && isLoading) return <p className="text-muted">…</p>;
  if (!isNew && !pack) return <p className="text-muted">{tx(tri("Pack introuvable.", "Pack not found.", "الباقة غير موجودة."))}</p>;
  return <PackForm key={pack?.id ?? "new"} initial={pack ?? null} catalogue={catalogue ?? []} />;
}

function PackForm({ initial, catalogue }: { initial: Pack | null; catalogue: Product[] }) {
  const tx = useTx();
  const navigate = useNavigate();
  const save = useSavePack();
  const [tab, setTab] = useState<"offer" | "page">("offer");
  const [form, setForm] = useState<PackInput>(() => {
    if (!initial) return blankPack();
    const { created_at: _c, updated_at: _u, ...rest } = initial;
    void _c;
    void _u;
    return { ...rest, pricing: sanitizePricing(rest.pricing) };
  });
  const [doc, setDoc] = useState<PageDoc>(() => (initial ? normalizePage(initial.page) : starterPackPage()));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(catalogue.map((p) => [p.id, p])), [catalogue]);
  const priceOf = (pid: string) => {
    const p = byId.get(pid);
    return p && p.status === "active" ? Number(p.price) : undefined;
  };
  const pricing = form.pricing;
  const quote = packQuote(form.items, pricing, priceOf);
  const set = (patch: Partial<PackInput>) => setForm((f) => ({ ...f, ...patch }));
  const setPricing = (patch: Partial<PackPricing>) => set({ pricing: { ...pricing, ...patch } });

  const onSave = () => {
    setError(null);
    if (!form.name_fr.trim()) return setError(tx(tri("Le nom (FR) est obligatoire.", "The French name is required.", "الاسم بالفرنسية إلزامي.")));
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setError(tx(tri("Adresse (slug) invalide.", "Invalid URL slug.", "رابط غير صالح.")));
    if (form.items.length === 0) return setError(tx(tri("Ajoutez au moins un produit.", "Add at least one product.", "أضف منتجاً واحداً على الأقل.")));
    save.mutate(
      {
        ...form,
        name_ar: form.name_ar || null,
        name_en: form.name_en || null,
        tagline_fr: form.tagline_fr || null,
        tagline_ar: form.tagline_ar || null,
        tagline_en: form.tagline_en || null,
        page: doc,
      },
      {
        onSuccess: (saved) => {
          if (!form.id) navigate(`/admin/packs/${saved.id}`, { replace: true });
          setForm((f) => ({ ...f, id: saved.id }));
        },
        onError: (e) => setError(e instanceof Error ? e.message : String(e)),
      },
    );
  };

  const previewPack: Pack = {
    ...(form as Pack),
    id: form.id ?? "preview",
    created_at: "",
    updated_at: "",
    page: doc,
  };

  const unused = catalogue.filter((p) => !form.items.some((i) => i.product_id === p.id));

  return (
    <div>
      {/* ------------------------------------------------------- save bar */}
      <div className="sticky -top-4 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-top-8 sm:-mx-8 sm:px-8">
        <Link to="/admin/packs" className="rounded-full p-2 text-muted hover:text-ink" aria-label="back">
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-display text-2xl">{form.name_fr || tx(tri("Nouveau pack", "New pack", "باقة جديدة"))}</h1>
        <div className="flex rounded-full border border-line p-1">
          {(["offer", "page"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn("cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium", tab === k ? "bg-brand text-cream" : "text-muted hover:text-ink")}
            >
              {k === "offer" ? tx(tri("Offre & prix", "Offer & price", "العرض والسعر")) : tx(tri("Page personnalisée", "Custom page", "الصفحة المخصصة"))}
            </button>
          ))}
        </div>
        {form.id && (
          <a href={`/pack/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm text-muted hover:text-ink">
            <ExternalLink size={14} />
            {tx(tri("Voir", "View", "عرض"))}
          </a>
        )}
        <Button size="sm" onClick={onSave} disabled={save.isPending}>
          <Save size={15} />
          {save.isPending ? "…" : tx(tri("Enregistrer", "Save", "حفظ"))}
        </Button>
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
      </div>

      {tab === "page" ? (
        <PageEditor doc={doc} onChange={setDoc} source={{ kind: "pack", pack: previewPack }} catalogue={catalogue} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-5">
            {/* ------------------------------------------------- identity */}
            <Group title={tx(tri("Identité du pack", "Pack identity", "هوية الباقة"))}>
              <div className="grid gap-3 sm:grid-cols-3">
                <PlainField
                  label={tx(tri("Nom · FR", "Name · FR", "الاسم · FR"))}
                  value={form.name_fr}
                  onChange={(v) => set({ name_fr: v, ...(slugTouched ? {} : { slug: slugify(v) }) })}
                />
                <PlainField label={tx(tri("Nom · AR", "Name · AR", "الاسم · AR"))} value={form.name_ar ?? ""} onChange={(v) => set({ name_ar: v })} />
                <PlainField label={tx(tri("Nom · EN", "Name · EN", "الاسم · EN"))} value={form.name_en ?? ""} onChange={(v) => set({ name_en: v })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <PlainField label={tx(tri("Accroche · FR", "Tagline · FR", "الشعار · FR"))} value={form.tagline_fr ?? ""} onChange={(v) => set({ tagline_fr: v })} />
                <PlainField label={tx(tri("Accroche · AR", "Tagline · AR", "الشعار · AR"))} value={form.tagline_ar ?? ""} onChange={(v) => set({ tagline_ar: v })} />
                <PlainField label={tx(tri("Accroche · EN", "Tagline · EN", "الشعار · EN"))} value={form.tagline_en ?? ""} onChange={(v) => set({ tagline_en: v })} />
              </div>
              <PlainField
                label={tx(tri("Adresse de la page", "Page address", "رابط الصفحة"))}
                value={form.slug}
                hint={`/pack/${form.slug || "…"}`}
                onChange={(v) => {
                  setSlugTouched(true);
                  set({ slug: slugify(v) });
                }}
              />
              <MediaField
                label={tx(tri("Visuel de couverture (cartes, panier, partage)", "Cover image (cards, cart, sharing)", "صورة الغلاف"))}
                allowVideo={false}
                value={{ kind: "image", url: form.cover_url ?? "" }}
                onChange={(m) => set({ cover_url: m.url || null })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  label={tx(tri("Publié (visible sur le site)", "Published (live on the site)", "منشور (ظاهر في الموقع)"))}
                  value={form.status === "published"}
                  onChange={(v) => set({ status: v ? "published" : "draft" })}
                />
                <Toggle label={tx(tri("Mis en avant dans la boutique", "Featured in the shop", "مميز في المتجر"))} value={form.featured} onChange={(v) => set({ featured: v })} />
              </div>
              <NumberField label={tx(tri("Ordre d'affichage", "Display order", "ترتيب العرض"))} value={form.sort_order} onChange={(v) => set({ sort_order: Math.round(v) })} />
            </Group>

            {/* ------------------------------------------------- products */}
            <Group title={tx(tri("Produits du pack", "Products in the pack", "منتجات الباقة"))}>
              {form.items.length === 0 && (
                <p className="text-sm text-muted">{tx(tri("Ajoutez des produits ci-dessous.", "Add products below.", "أضف منتجات أدناه."))}</p>
              )}
              <ul className="space-y-2">
                {form.items.map((item, i) => {
                  const p = byId.get(item.product_id);
                  const update = (patch: Partial<PackItem>) =>
                    set({ items: form.items.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
                  return (
                    <li key={item.product_id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel/60 p-3">
                      {p?.product_images?.[0] && <img src={p.product_images[0].url} alt="" className="h-12 w-12 object-contain" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p?.name_fr ?? "?"}</p>
                        <p className="text-xs text-muted">
                          {tx(tri("Prix catalogue", "List price", "سعر الكتالوج"))} {p ? formatPrice(Number(p.price)) : "—"}
                          {p && p.status !== "active" && <span className="ms-2 text-red-400">{tx(tri("(brouillon — pack indisponible)", "(draft — pack unavailable)", "(مسودة — الباقة غير متاحة)"))}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-line px-2 py-1">
                        <button type="button" className="cursor-pointer p-1 text-muted hover:text-ink" onClick={() => update({ quantity: Math.max(1, item.quantity - 1) })}>
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button type="button" className="cursor-pointer p-1 text-muted hover:text-ink" onClick={() => update({ quantity: Math.min(50, item.quantity + 1) })}>
                          <Plus size={13} />
                        </button>
                      </div>
                      <label className="w-36">
                        <span className="sr-only">custom price</span>
                        <input
                          type="number"
                          min={0}
                          placeholder={tx(tri("Prix perso (option)", "Custom price (opt.)", "سعر مخصص (اختياري)"))}
                          value={item.price ?? ""}
                          onChange={(e) => update({ price: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
                          className="w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm"
                        />
                      </label>
                      <button type="button" onClick={() => set({ items: form.items.filter((_, k) => k !== i) })} className="cursor-pointer rounded-lg p-2 text-muted hover:text-red-400" aria-label="remove">
                        <Trash2 size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              {unused.length > 0 && (
                <Row label={tx(tri("Ajouter un produit", "Add a product", "إضافة منتج"))}>
                  <div className="flex flex-wrap gap-2">
                    {unused.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => set({ items: [...form.items, { product_id: p.id, quantity: 1, price: null }] })}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line py-1 pe-3 ps-1 text-xs hover:border-brand"
                      >
                        {p.product_images?.[0] ? (
                          <img src={p.product_images[0].url} alt="" className="h-7 w-7 rounded-full bg-panel-2 object-contain" />
                        ) : (
                          <Plus size={13} className="ms-2" />
                        )}
                        {p.name_fr}
                      </button>
                    ))}
                  </div>
                </Row>
              )}
            </Group>

            {/* -------------------------------------------------- pricing */}
            <Group title={tx(tri("Règles de prix", "Pricing rules", "قواعد السعر"))}>
              <Choice
                label={tx(tri("Calcul du prix", "How the price is set", "طريقة حساب السعر"))}
                value={pricing.mode}
                options={[
                  { value: "percent", label: tx(tri("% de remise", "% off", "خصم ٪")) },
                  { value: "fixed", label: tx(tri("Prix fixe", "Fixed price", "سعر ثابت")) },
                  { value: "amount", label: tx(tri("Montant en moins", "Amount off", "مبلغ مخصوم")) },
                  { value: "sum", label: tx(tri("Somme des prix", "Sum of prices", "مجموع الأسعار")) },
                ]}
                onChange={(mode) => setPricing({ mode })}
              />
              {pricing.mode !== "sum" && (
                <NumberField
                  label={
                    pricing.mode === "percent"
                      ? tx(tri("Remise (%)", "Discount (%)", "الخصم (٪)"))
                      : pricing.mode === "fixed"
                        ? tx(tri("Prix du pack (DA)", "Pack price (DA)", "سعر الباقة (دج)"))
                        : tx(tri("Montant retiré (DA)", "Amount off (DA)", "المبلغ المخصوم (دج)"))
                  }
                  value={pricing.value ?? 0}
                  min={0}
                  max={pricing.mode === "percent" ? 95 : undefined}
                  onChange={(value) => setPricing({ value })}
                />
              )}
              <p className="text-xs text-muted">
                {tx(
                  tri(
                    "Astuce : un « prix perso » sur une ligne produit remplace son prix catalogue dans ce pack, avant la remise.",
                    "Tip: a “custom price” on a product line replaces its list price inside this pack, before the discount.",
                    "نصيحة: «السعر المخصص» لمنتج يحل محل سعره في هذه الباقة قبل الخصم.",
                  ),
                )}
              </p>
              <Choice
                label={tx(tri("Arrondir vers le bas à", "Round down to", "التقريب للأسفل إلى"))}
                value={String(pricing.step ?? 1)}
                options={["1", "10", "50", "100"].map((v) => ({ value: v, label: v === "1" ? tx(tri("Aucun", "None", "بدون")) : `${v} DA` }))}
                onChange={(v) => setPricing({ step: Number(v) })}
              />
              <Choice
                label={tx(tri("Terminaison psychologique", "Psychological ending", "نهاية نفسية للسعر"))}
                value={pricing.ending === null || pricing.ending === undefined ? "none" : String(pricing.ending)}
                options={[
                  { value: "none", label: tx(tri("Aucune", "None", "بدون")) },
                  { value: "0", label: "…00" },
                  { value: "50", label: "…50" },
                  { value: "90", label: "…90" },
                  { value: "99", label: "…99" },
                ]}
                onChange={(v) => setPricing({ ending: v === "none" ? null : Number(v) })}
              />
              <NumberField label={tx(tri("Prix plancher (DA)", "Minimum price (DA)", "الحد الأدنى للسعر (دج)"))} value={pricing.floor ?? 0} min={0} onChange={(floor) => setPricing({ floor })} />
              <Choice
                label={tx(tri("Prix barré affiché", "Crossed-out price", "السعر المشطوب"))}
                value={typeof pricing.compare === "number" ? "custom" : (pricing.compare ?? "auto")}
                options={[
                  { value: "auto", label: tx(tri("Somme catalogue", "Catalogue total", "مجموع الكتالوج")) },
                  { value: "custom", label: tx(tri("Montant perso", "Custom amount", "مبلغ مخصص")) },
                  { value: "none", label: tx(tri("Aucun", "None", "بدون")) },
                ]}
                onChange={(v) => setPricing({ compare: v === "custom" ? (quote?.list ?? 0) : (v as "auto" | "none") })}
              />
              {typeof pricing.compare === "number" && (
                <NumberField label={tx(tri("Prix barré (DA)", "Crossed-out price (DA)", "السعر المشطوب (دج)"))} value={pricing.compare} min={0} onChange={(compare) => setPricing({ compare })} />
              )}
              <ListField<PackTier>
                label={tx(tri("Remises par quantité (sur la ligne)", "Quantity discounts (on the line)", "خصومات الكمية"))}
                items={pricing.tiers ?? []}
                onChange={(tiers) => setPricing({ tiers })}
                create={() => ({ qty: (pricing.tiers?.at(-1)?.qty ?? 1) + 1, percent: 5 })}
                max={6}
                title={(tier) => `${tier.qty}+ → −${tier.percent} %`}
                render={(tier, update) => (
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField label={tx(tri("À partir de (packs)", "From (packs)", "ابتداءً من (باقات)"))} value={tier.qty} min={2} max={20} onChange={(qty) => update({ ...tier, qty })} />
                    <NumberField label={tx(tri("Remise (%)", "Discount (%)", "الخصم (٪)"))} value={tier.percent} min={0} max={95} onChange={(percent) => update({ ...tier, percent })} />
                  </div>
                )}
              />
              <Toggle label={tx(tri("Livraison offerte avec ce pack", "Free delivery with this pack", "توصيل مجاني مع هذه الباقة"))} value={Boolean(pricing.free_shipping)} onChange={(free_shipping) => setPricing({ free_shipping })} />
              <NumberField label={tx(tri("Maximum par commande", "Maximum per order", "الحد الأقصى لكل طلب"))} value={form.max_per_order} min={1} max={20} onChange={(v) => set({ max_per_order: Math.max(1, Math.min(20, Math.round(v))) })} />
            </Group>

            {/* --------------------------------------------------- window */}
            <Group title={tx(tri("Période de l'offre", "Offer window", "مدة العرض"))}>
              <div className="grid gap-3 sm:grid-cols-2">
                <PlainField type="datetime-local" label={tx(tri("Début (vide = tout de suite)", "Starts (empty = now)", "البداية (فارغ = الآن)"))} value={toLocal(form.starts_at)} onChange={(v) => set({ starts_at: fromLocal(v) })} />
                <PlainField type="datetime-local" label={tx(tri("Fin (vide = sans fin)", "Ends (empty = never)", "النهاية (فارغ = بدون نهاية)"))} value={toLocal(form.ends_at)} onChange={(v) => set({ ends_at: fromLocal(v) })} />
              </div>
              <p className="text-xs text-muted">
                {tx(
                  tri(
                    "Hors de cette période, le pack ne peut plus être commandé — vérifié par le serveur.",
                    "Outside this window the pack can't be ordered — enforced by the server.",
                    "خارج هذه المدة لا يمكن طلب الباقة — يتحقق منها الخادم.",
                  ),
                )}
              </p>
            </Group>
          </div>

          {/* ------------------------------------------------- calculator */}
          <div className="xl:sticky xl:top-24 xl:self-start">
            <Panel className="overflow-hidden">
              <div className="bg-[linear-gradient(135deg,rgb(var(--c-brand)/0.25),transparent)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{tx(tri("Calculateur en direct", "Live calculator", "حاسبة مباشرة"))}</p>
                <p className="mt-3 font-display text-5xl text-brand">{quote ? formatPrice(quote.unit) : "—"}</p>
                {quote?.compare && <p className="mt-1 text-muted line-through">{formatPrice(quote.compare)}</p>}
              </div>
              {quote && (
                <dl className="space-y-2 p-6 text-sm">
                  <CalcRow label={tx(tri("Total catalogue", "Catalogue total", "مجموع الكتالوج"))} value={formatPrice(quote.list)} />
                  {quote.base !== quote.list && <CalcRow label={tx(tri("Avec prix perso", "With custom prices", "بالأسعار المخصصة"))} value={formatPrice(quote.base)} />}
                  <CalcRow
                    label={tx(tri("Le client économise", "The customer saves", "يوفر الزبون"))}
                    value={quote.list > quote.unit ? `${formatPrice(quote.list - quote.unit)} (−${Math.round(((quote.list - quote.unit) / quote.list) * 100)} %)` : "—"}
                    strong
                  />
                  <CalcRow
                    label={tx(tri("Coût de livraison", "Delivery", "التوصيل"))}
                    value={pricing.free_shipping ? tx(tri("Offerte", "Free", "مجاني")) : tx(tri("Selon la wilaya", "Per wilaya", "حسب الولاية"))}
                  />
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{tx(tri("Selon la quantité", "By quantity", "حسب الكمية"))}</p>
                    {[1, 2, 3, 4, 5].map((q) => (
                      <CalcRow key={q} label={`× ${q}`} value={formatPrice(packLineTotal(quote.unit, q, pricing))} />
                    ))}
                  </div>
                </dl>
              )}
              {!quote && (
                <p className="p-6 text-sm text-muted">
                  {tx(tri("Ajoutez des produits actifs pour voir le prix.", "Add active products to see the price.", "أضف منتجات نشطة لرؤية السعر."))}
                </p>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

function CalcRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("tabular-nums", strong && "font-semibold text-brand")}>{value}</dd>
    </div>
  );
}
