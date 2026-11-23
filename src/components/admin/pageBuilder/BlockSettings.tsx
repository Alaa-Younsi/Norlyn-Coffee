import { ICON_KEYS, ANIMS } from "@/lib/pageBuilder/types";
import type { Block, BlockDataMap, BlockOf, BlockType, GalleryItem, L10n, Media, OfferItem, StatItem, Testimonial } from "@/lib/pageBuilder/types";
import { useAdminPacks } from "@/hooks/usePacks";
import { pick } from "@/lib/pageBuilder/defaults";
import { useContext } from "react";
import {
  Choice,
  Group,
  ListField,
  MediaField,
  NumberField,
  PlainField,
  SelectField,
  TextField,
  Toggle,
} from "./fields";
import { EditLangContext, tri, useTx } from "./editorI18n";
import { ANIM_LABEL, BLOCK_META, CTA_LABEL, ICON_LABEL, MEDIA_FX_LABEL, PAD_LABEL, TONE_LABEL, WIDTH_LABEL } from "./labels";

type Setter<K extends BlockType> = (patch: Partial<BlockDataMap[K]>) => void;

const empty = (): L10n => ({ fr: "", ar: "", en: "" });
const img = (): Media => ({ kind: "image", url: "" });

function useOpts() {
  const tx = useTx();
  return {
    tx,
    cta: (Object.keys(CTA_LABEL) as (keyof typeof CTA_LABEL)[]).map((v) => ({ value: v, label: tx(CTA_LABEL[v]) })),
    mediaFx: (Object.keys(MEDIA_FX_LABEL) as (keyof typeof MEDIA_FX_LABEL)[]).map((v) => ({ value: v, label: tx(MEDIA_FX_LABEL[v]) })),
  };
}

/** everything every block shares: motion, background, spacing, visibility */
function CommonSettings({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const tx = useTx();
  const set = (patch: Partial<Block>) => onChange({ ...block, ...patch } as Block);
  return (
    <Group title={tx(tri("Animation & mise en page", "Animation & layout", "الحركة والتخطيط"))}>
      <SelectField
        label={tx(tri("Animation d'entrée", "Entrance animation", "حركة الظهور"))}
        value={block.anim}
        options={[
          { value: "inherit" as const, label: tx(tri("Celle du thème", "Theme default", "حسب السمة")) },
          ...ANIMS.map((a) => ({ value: a, label: tx(ANIM_LABEL[a]) })),
        ]}
        onChange={(v) => set({ anim: v })}
      />
      <NumberField
        label={tx(tri("Délai (secondes)", "Delay (seconds)", "التأخير (ثوانٍ)"))}
        value={block.delay}
        min={0}
        max={2}
        step={0.1}
        onChange={(v) => set({ delay: v })}
      />
      <Choice
        label={tx(tri("Fond", "Background", "الخلفية"))}
        value={block.tone}
        options={(Object.keys(TONE_LABEL) as Block["tone"][]).map((v) => ({ value: v, label: tx(TONE_LABEL[v]) }))}
        onChange={(v) => set({ tone: v })}
      />
      {block.tone === "image" && (
        <MediaField
          label={tx(tri("Image de fond", "Background image", "صورة الخلفية"))}
          allowVideo={false}
          value={{ kind: "image", url: block.toneImage ?? "" }}
          onChange={(m) => set({ toneImage: m.url })}
        />
      )}
      <Choice
        label={tx(tri("Espacement", "Spacing", "المسافة"))}
        value={block.pad}
        options={(Object.keys(PAD_LABEL) as Block["pad"][]).map((v) => ({ value: v, label: tx(PAD_LABEL[v]) }))}
        onChange={(v) => set({ pad: v })}
      />
      <Choice
        label={tx(tri("Largeur", "Width", "العرض"))}
        value={block.width}
        options={(Object.keys(WIDTH_LABEL) as Block["width"][]).map((v) => ({ value: v, label: tx(WIDTH_LABEL[v]) }))}
        onChange={(v) => set({ width: v })}
      />
      <Choice
        label={tx(tri("Alignement", "Alignment", "المحاذاة"))}
        value={block.align}
        options={[
          { value: "start", label: tx(tri("Début", "Start", "بداية")) },
          { value: "center", label: tx(tri("Centré", "Center", "وسط")) },
        ]}
        onChange={(v) => set({ align: v })}
      />
      <Choice
        label={tx(tri("Afficher sur", "Show on", "إظهار على"))}
        value={block.hideOn}
        options={[
          { value: "none", label: tx(tri("Tous les écrans", "All screens", "كل الشاشات")) },
          { value: "desktop", label: tx(tri("Téléphone seulement", "Phone only", "الهاتف فقط")) },
          { value: "mobile", label: tx(tri("Ordinateur seulement", "Desktop only", "الحاسوب فقط")) },
        ]}
        onChange={(v) => set({ hideOn: v })}
      />
    </Group>
  );
}

// ---------------------------------------------------------------- per type
function HeroForm({ d, set }: { d: BlockDataMap["hero"]; set: Setter<"hero"> }) {
  const { tx, cta, mediaFx } = useOpts();
  return (
    <>
      <Choice
        label={tx(tri("Mise en page", "Layout", "التخطيط"))}
        value={d.layout}
        options={[
          { value: "split", label: tx(tri("Texte + média", "Text + media", "نص ووسائط")) },
          { value: "cover", label: tx(tri("Plein écran", "Full cover", "شاشة كاملة")) },
          { value: "stacked", label: tx(tri("Empilé", "Stacked", "متراكب")) },
          { value: "centered", label: tx(tri("Texte centré", "Centered text", "نص في الوسط")) },
        ]}
        onChange={(v) => set({ layout: v })}
      />
      <TextField label={tx(tri("Sur-titre", "Eyebrow", "عنوان صغير"))} value={d.eyebrow} onChange={(v) => set({ eyebrow: v })} />
      <TextField label={tx(tri("Titre", "Headline", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <SelectField
        label={tx(tri("Effet du titre", "Headline effect", "تأثير العنوان"))}
        value={d.titleFx}
        options={[
          { value: "none", label: tx(tri("Aucun", "None", "بدون")) },
          { value: "kinetic", label: tx(tri("Lettres qui montent", "Kinetic letters", "حروف متحركة")) },
          { value: "gradient", label: tx(tri("Dégradé animé", "Animated gradient", "تدرج متحرك")) },
          { value: "shimmer", label: tx(tri("Reflet qui passe", "Shimmer", "لمعان")) },
          { value: "typewriter", label: tx(tri("Machine à écrire", "Typewriter", "آلة كاتبة")) },
          { value: "glow", label: tx(tri("Lueur", "Glow", "توهج")) },
        ]}
        onChange={(v) => set({ titleFx: v })}
      />
      <TextField label={tx(tri("Sous-titre", "Subtitle", "العنوان الفرعي"))} value={d.subtitle} onChange={(v) => set({ subtitle: v })} multiline />
      <TextField label={tx(tri("Pastille (ex. −20 %)", "Badge (e.g. −20%)", "شارة (مثلاً −20٪)"))} value={d.badge} onChange={(v) => set({ badge: v })} />
      <Toggle label={tx(tri("Afficher le prix", "Show the price", "إظهار السعر"))} value={d.showPrice} onChange={(v) => set({ showPrice: v })} />
      <TextField label={tx(tri("Bouton principal", "Main button", "الزر الرئيسي"))} value={d.cta} onChange={(v) => set({ cta: v })} />
      <SelectField label={tx(tri("Action du bouton", "Button action", "وظيفة الزر"))} value={d.ctaTarget} options={cta} onChange={(v) => set({ ctaTarget: v })} />
      <TextField label={tx(tri("Bouton secondaire (vide = caché)", "Second button (empty = hidden)", "زر ثانٍ (فارغ = مخفي)"))} value={d.cta2} onChange={(v) => set({ cta2: v })} />
      <SelectField label={tx(tri("Action du 2e bouton", "Second button action", "وظيفة الزر الثاني"))} value={d.cta2Target} options={cta} onChange={(v) => set({ cta2Target: v })} />
      <SelectField label={tx(tri("Mouvement du média", "Media motion", "حركة الوسائط"))} value={d.mediaFx} options={mediaFx} onChange={(v) => set({ mediaFx: v })} />
      <ListField
        label={tx(tri("Médias (plusieurs = diaporama)", "Media (several = slideshow)", "وسائط (عدة = عرض شرائح)"))}
        items={d.media}
        onChange={(media) => set({ media })}
        create={img}
        max={8}
        title={(m) => m.url.split("/").pop() ?? ""}
        render={(m, update) => <MediaField label="" value={m} onChange={update} />}
      />
    </>
  );
}

function CountdownForm({ d, set }: { d: BlockDataMap["countdown"]; set: Setter<"countdown"> }) {
  const { tx } = useOpts();
  return (
    <>
      <Choice
        label={tx(tri("Fin du minuteur", "Timer ends", "نهاية المؤقت"))}
        value={d.mode}
        options={[
          { value: "evergreen", label: tx(tri("X heures par visiteur", "X hours per visitor", "ساعات لكل زائر")) },
          { value: "date", label: tx(tri("Date fixe", "Fixed date", "تاريخ ثابت")) },
          { value: "daily", label: tx(tri("Chaque minuit", "Every midnight", "كل منتصف ليل")) },
        ]}
        onChange={(v) => set({ mode: v })}
      />
      {d.mode === "date" && <PlainField type="datetime-local" label={tx(tri("Date de fin", "End date", "تاريخ الانتهاء"))} value={d.until} onChange={(v) => set({ until: v })} />}
      {d.mode === "evergreen" && (
        <NumberField label={tx(tri("Durée (heures)", "Duration (hours)", "المدة (ساعات)"))} value={d.hours} min={1} max={720} onChange={(v) => set({ hours: v })} />
      )}
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "flip", label: "Flip" },
          { value: "blocks", label: tx(tri("Blocs", "Blocks", "مربعات")) },
          { value: "ring", label: tx(tri("Anneaux", "Rings", "حلقات")) },
          { value: "bar", label: tx(tri("Barre", "Bar", "شريط")) },
          { value: "minimal", label: tx(tri("Minimal", "Minimal", "بسيط")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <TextField label={tx(tri("Texte sous le minuteur", "Text under the timer", "نص تحت المؤقت"))} value={d.subtitle} onChange={(v) => set({ subtitle: v })} />
      <TextField label={tx(tri("Texte une fois terminé", "Text when it ends", "نص عند الانتهاء"))} value={d.expired} onChange={(v) => set({ expired: v })} />
      <Toggle label={tx(tri("Cacher le bloc une fois terminé", "Hide the block when it ends", "إخفاء عند الانتهاء"))} value={d.hideWhenExpired} onChange={(v) => set({ hideWhenExpired: v })} />
      <p className="text-xs text-muted">
        {tx(
          tri(
            "Le minuteur est visuel. Pour que le prix s'arrête vraiment, réglez la date de fin dans l'onglet « Offre ».",
            "The timer is visual. To really end the price, set the end date in the “Offer” tab.",
            "المؤقت شكلي. لإنهاء السعر فعلياً، حدد تاريخ الانتهاء في تبويب «العرض».",
          ),
        )}
      </p>
    </>
  );
}

function GalleryForm({ d, set }: { d: BlockDataMap["gallery"]; set: Setter<"gallery"> }) {
  const { tx } = useOpts();
  const { editLang } = useContext(EditLangContext);
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <Choice
        label={tx(tri("Disposition", "Layout", "التخطيط"))}
        value={d.layout}
        options={[
          { value: "mosaic", label: tx(tri("Mosaïque", "Mosaic", "فسيفساء")) },
          { value: "grid", label: tx(tri("Grille", "Grid", "شبكة")) },
          { value: "carousel", label: tx(tri("Carrousel", "Carousel", "دوّار")) },
          { value: "marquee", label: tx(tri("Défilé", "Marquee", "شريط")) },
          { value: "stack", label: tx(tri("Pile qui s'ouvre", "Fanning stack", "كومة تنفتح")) },
        ]}
        onChange={(v) => set({ layout: v })}
      />
      <Choice
        label={tx(tri("Survol", "Hover", "عند التمرير"))}
        value={d.hover}
        options={[
          { value: "zoom", label: "Zoom" },
          { value: "tilt", label: tx(tri("Rotation", "Tilt", "ميلان")) },
          { value: "lift", label: tx(tri("Soulèvement", "Lift", "رفع")) },
          { value: "none", label: tx(tri("Aucun", "None", "بدون")) },
        ]}
        onChange={(v) => set({ hover: v })}
      />
      <Choice
        label={tx(tri("Colonnes", "Columns", "الأعمدة"))}
        value={String(d.columns) as "2" | "3" | "4"}
        options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]}
        onChange={(v) => set({ columns: Number(v) as 2 | 3 | 4 })}
      />
      <Choice
        label={tx(tri("Format", "Shape", "الشكل"))}
        value={d.aspect}
        options={[
          { value: "auto", label: "Auto" },
          { value: "square", label: "1:1" },
          { value: "portrait", label: "4:5" },
          { value: "landscape", label: "16:10" },
        ]}
        onChange={(v) => set({ aspect: v })}
      />
      <ListField
        label={tx(tri("Images & vidéos", "Images & videos", "صور وفيديوهات"))}
        items={d.items}
        onChange={(items) => set({ items })}
        create={(): GalleryItem => img()}
        max={20}
        title={(m) => pick(m.caption, editLang) || m.url.split("/").pop() || ""}
        render={(m, update) => (
          <>
            <MediaField label="" value={m} onChange={(next) => update({ ...m, ...next })} />
            <TextField label={tx(tri("Légende", "Caption", "تعليق"))} value={m.caption ?? empty()} onChange={(caption) => update({ ...m, caption })} />
          </>
        )}
      />
    </>
  );
}

function VideoForm({ d, set }: { d: BlockDataMap["video"]; set: Setter<"video"> }) {
  const { tx } = useOpts();
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <MediaField label={tx(tri("Vidéo", "Video", "الفيديو"))} value={d.media} onChange={(media) => set({ media })} />
      <Choice
        label={tx(tri("Cadre", "Frame", "الإطار"))}
        value={d.frame}
        options={[
          { value: "rounded", label: tx(tri("Arrondi", "Rounded", "مستدير")) },
          { value: "phone", label: tx(tri("Téléphone", "Phone", "هاتف")) },
          { value: "cinema", label: tx(tri("Cinéma", "Cinema", "سينما")) },
          { value: "glass", label: tx(tri("Verre", "Glass", "زجاج")) },
          { value: "none", label: tx(tri("Aucun", "None", "بدون")) },
        ]}
        onChange={(v) => set({ frame: v })}
      />
      <Toggle label={tx(tri("Lecture automatique (muette)", "Autoplay (muted)", "تشغيل تلقائي (صامت)"))} value={d.autoplay} onChange={(v) => set({ autoplay: v })} />
      <Toggle label={tx(tri("En boucle", "Loop", "تكرار"))} value={d.loop} onChange={(v) => set({ loop: v })} />
      <Toggle label={tx(tri("Afficher les contrôles", "Show controls", "إظهار أدوات التحكم"))} value={d.controls} onChange={(v) => set({ controls: v })} />
      <TextField label={tx(tri("Légende", "Caption", "تعليق"))} value={d.caption} onChange={(v) => set({ caption: v })} />
    </>
  );
}

function ImageForm({ d, set }: { d: BlockDataMap["image"]; set: Setter<"image"> }) {
  const { tx, mediaFx } = useOpts();
  return (
    <>
      <MediaField label={tx(tri("Image ou vidéo", "Image or video", "صورة أو فيديو"))} value={d.media} onChange={(media) => set({ media })} />
      <SelectField label={tx(tri("Mouvement", "Motion", "الحركة"))} value={d.fx} options={mediaFx} onChange={(v) => set({ fx: v })} />
      <Choice
        label={tx(tri("Hauteur", "Height", "الارتفاع"))}
        value={d.height}
        options={[
          { value: "auto", label: "16:9" },
          { value: "half", label: tx(tri("Demi-écran", "Half screen", "نصف الشاشة")) },
          { value: "screen", label: tx(tri("Plein écran", "Full screen", "الشاشة كاملة")) },
        ]}
        onChange={(v) => set({ height: v })}
      />
      <Toggle label={tx(tri("Coins arrondis", "Rounded corners", "زوايا مستديرة"))} value={d.rounded} onChange={(v) => set({ rounded: v })} />
      <TextField label={tx(tri("Légende", "Caption", "تعليق"))} value={d.caption} onChange={(v) => set({ caption: v })} />
    </>
  );
}

function FeaturesForm({ d, set }: { d: BlockDataMap["features"]; set: Setter<"features"> }) {
  const { tx } = useOpts();
  const { editLang } = useContext(EditLangContext);
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <TextField label={tx(tri("Sous-titre", "Subtitle", "العنوان الفرعي"))} value={d.subtitle} onChange={(v) => set({ subtitle: v })} />
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "cards", label: tx(tri("Cartes", "Cards", "بطاقات")) },
          { value: "bento", label: "Bento" },
          { value: "icons", label: tx(tri("Grandes icônes", "Big icons", "أيقونات كبيرة")) },
          { value: "list", label: tx(tri("Liste", "List", "قائمة")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <Choice
        label={tx(tri("Colonnes", "Columns", "الأعمدة"))}
        value={String(d.columns) as "2" | "3" | "4"}
        options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]}
        onChange={(v) => set({ columns: Number(v) as 2 | 3 | 4 })}
      />
      <ListField
        label={tx(tri("Avantages", "Benefits", "المزايا"))}
        items={d.items}
        onChange={(items) => set({ items })}
        create={() => ({ icon: "sparkles" as const, title: empty(), text: empty() })}
        title={(it) => pick(it.title, editLang)}
        render={(it, update) => (
          <>
            <SelectField
              label={tx(tri("Icône", "Icon", "الأيقونة"))}
              value={it.icon}
              options={ICON_KEYS.map((k) => ({ value: k, label: tx(ICON_LABEL[k]) }))}
              onChange={(icon) => update({ ...it, icon })}
            />
            <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={it.title} onChange={(title) => update({ ...it, title })} />
            <TextField label={tx(tri("Texte", "Text", "النص"))} value={it.text} onChange={(text) => update({ ...it, text })} multiline />
          </>
        )}
      />
    </>
  );
}

function StoryForm({ d, set }: { d: BlockDataMap["story"]; set: Setter<"story"> }) {
  const { tx, mediaFx } = useOpts();
  return (
    <>
      <MediaField label={tx(tri("Média", "Media", "الوسائط"))} value={d.media} onChange={(media) => set({ media })} />
      <SelectField label={tx(tri("Mouvement du média", "Media motion", "حركة الوسائط"))} value={d.mediaFx} options={mediaFx} onChange={(v) => set({ mediaFx: v })} />
      <Choice
        label={tx(tri("Média à", "Media on the", "الوسائط في"))}
        value={d.side}
        options={[
          { value: "start", label: tx(tri("Début", "Start", "البداية")) },
          { value: "end", label: tx(tri("Fin", "End", "النهاية")) },
        ]}
        onChange={(v) => set({ side: v })}
      />
      <TextField label={tx(tri("Sur-titre", "Eyebrow", "عنوان صغير"))} value={d.eyebrow} onChange={(v) => set({ eyebrow: v })} />
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <TextField
        label={tx(tri("Texte", "Text", "النص"))}
        value={d.text}
        onChange={(v) => set({ text: v })}
        multiline
        hint={tx(tri("Une ligne vide = nouveau paragraphe.", "A blank line = new paragraph.", "سطر فارغ = فقرة جديدة."))}
      />
      <TextField label={tx(tri("Citation", "Quote", "اقتباس"))} value={d.quote} onChange={(v) => set({ quote: v })} />
    </>
  );
}

function ContentsForm({ d, set }: { d: BlockDataMap["contents"]; set: Setter<"contents"> }) {
  const { tx } = useOpts();
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <TextField label={tx(tri("Sous-titre", "Subtitle", "العنوان الفرعي"))} value={d.subtitle} onChange={(v) => set({ subtitle: v })} />
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "grid", label: tx(tri("Grille", "Grid", "شبكة")) },
          { value: "orbit", label: tx(tri("Orbite animée", "Animated orbit", "مدار متحرك")) },
          { value: "list", label: tx(tri("Liste", "List", "قائمة")) },
          { value: "stack", label: tx(tri("Grandes cartes", "Big cards", "بطاقات كبيرة")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <Toggle label={tx(tri("Afficher les prix unitaires", "Show unit prices", "إظهار أسعار الوحدة"))} value={d.showPrices} onChange={(v) => set({ showPrices: v })} />
    </>
  );
}

function PriceForm({ d, set }: { d: BlockDataMap["price"]; set: Setter<"price"> }) {
  const { tx, cta } = useOpts();
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "card", label: tx(tri("Carte lumineuse", "Glowing card", "بطاقة مضيئة")) },
          { value: "ticket", label: tx(tri("Ticket", "Ticket", "تذكرة")) },
          { value: "banner", label: tx(tri("Bandeau", "Banner", "شريط")) },
          { value: "minimal", label: tx(tri("Minimal", "Minimal", "بسيط")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <Toggle label={tx(tri("Détail du calcul", "Price breakdown", "تفاصيل الحساب"))} value={d.showBreakdown} onChange={(v) => set({ showBreakdown: v })} />
      <Toggle label={tx(tri("Paliers de quantité", "Quantity tiers", "مستويات الكمية"))} value={d.showTiers} onChange={(v) => set({ showTiers: v })} />
      <Toggle label={tx(tri("Pastille d'économie", "Savings badge", "شارة التوفير"))} value={d.showSavings} onChange={(v) => set({ showSavings: v })} />
      <Toggle label={tx(tri("Sélecteur de quantité", "Quantity picker", "اختيار الكمية"))} value={d.showQuantity} onChange={(v) => set({ showQuantity: v })} />
      <TextField label={tx(tri("Bouton", "Button", "الزر"))} value={d.cta} onChange={(v) => set({ cta: v })} />
      <SelectField label={tx(tri("Action du bouton", "Button action", "وظيفة الزر"))} value={d.ctaTarget} options={cta} onChange={(v) => set({ ctaTarget: v })} />
      <TextField label={tx(tri("Note sous le bouton", "Note under the button", "ملاحظة تحت الزر"))} value={d.note} onChange={(v) => set({ note: v })} />
    </>
  );
}

function StatsForm({ d, set }: { d: BlockDataMap["stats"]; set: Setter<"stats"> }) {
  const { tx } = useOpts();
  const { editLang } = useContext(EditLangContext);
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "cards", label: tx(tri("Cartes", "Cards", "بطاقات")) },
          { value: "rings", label: tx(tri("Cercles", "Rings", "دوائر")) },
          { value: "plain", label: tx(tri("Simple", "Plain", "بسيط")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <ListField
        label={tx(tri("Chiffres", "Numbers", "الأرقام"))}
        items={d.items}
        onChange={(items) => set({ items })}
        create={(): StatItem => ({ value: 100, label: empty() })}
        max={6}
        title={(it) => `${it.prefix ?? ""}${it.value}${it.suffix ?? ""} ${pick(it.label, editLang)}`}
        render={(it, update) => (
          <>
            <NumberField label={tx(tri("Valeur", "Value", "القيمة"))} value={it.value} onChange={(value) => update({ ...it, value })} />
            <div className="grid grid-cols-2 gap-2">
              <PlainField label={tx(tri("Avant", "Prefix", "قبل"))} value={it.prefix ?? ""} onChange={(prefix) => update({ ...it, prefix })} />
              <PlainField label={tx(tri("Après", "Suffix", "بعد"))} value={it.suffix ?? ""} onChange={(suffix) => update({ ...it, suffix })} />
            </div>
            <TextField label={tx(tri("Libellé", "Label", "التسمية"))} value={it.label} onChange={(label) => update({ ...it, label })} />
          </>
        )}
      />
    </>
  );
}

function TestimonialsForm({ d, set }: { d: BlockDataMap["testimonials"]; set: Setter<"testimonials"> }) {
  const { tx } = useOpts();
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "cards", label: tx(tri("Cartes", "Cards", "بطاقات")) },
          { value: "marquee", label: tx(tri("Défilé", "Marquee", "شريط")) },
          { value: "spotlight", label: tx(tri("Projecteur", "Spotlight", "تسليط")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <ListField
        label={tx(tri("Avis", "Reviews", "الآراء"))}
        items={d.items}
        onChange={(items) => set({ items })}
        create={(): Testimonial => ({ name: "", rating: 5, text: empty() })}
        title={(it) => it.name}
        render={(it, update) => (
          <>
            <PlainField label={tx(tri("Nom", "Name", "الاسم"))} value={it.name} onChange={(name) => update({ ...it, name })} />
            <NumberField label={tx(tri("Étoiles (1–5)", "Stars (1–5)", "النجوم (1–5)"))} value={it.rating} min={1} max={5} onChange={(rating) => update({ ...it, rating: Math.max(1, Math.min(5, rating)) })} />
            <TextField label={tx(tri("Avis", "Review", "الرأي"))} value={it.text} onChange={(text) => update({ ...it, text })} multiline />
            <TextField label={tx(tri("Ville / détail", "City / detail", "المدينة / تفاصيل"))} value={it.meta ?? empty()} onChange={(meta) => update({ ...it, meta })} />
          </>
        )}
      />
    </>
  );
}

function FaqForm({ d, set }: { d: BlockDataMap["faq"]; set: Setter<"faq"> }) {
  const { tx } = useOpts();
  const { editLang } = useContext(EditLangContext);
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "accordion", label: tx(tri("Accordéon", "Accordion", "أكورديون")) },
          { value: "cards", label: tx(tri("Cartes", "Cards", "بطاقات")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <ListField
        label={tx(tri("Questions", "Questions", "الأسئلة"))}
        items={d.items}
        onChange={(items) => set({ items })}
        create={() => ({ q: empty(), a: empty() })}
        title={(it) => pick(it.q, editLang)}
        render={(it, update) => (
          <>
            <TextField label={tx(tri("Question", "Question", "السؤال"))} value={it.q} onChange={(q) => update({ ...it, q })} />
            <TextField label={tx(tri("Réponse", "Answer", "الجواب"))} value={it.a} onChange={(a) => update({ ...it, a })} multiline />
          </>
        )}
      />
    </>
  );
}

function MarqueeForm({ d, set }: { d: BlockDataMap["marquee"]; set: Setter<"marquee"> }) {
  const { tx } = useOpts();
  const { editLang } = useContext(EditLangContext);
  return (
    <>
      <ListField
        label={tx(tri("Mots / phrases", "Words / phrases", "كلمات / جمل"))}
        items={d.items}
        onChange={(items) => set({ items })}
        create={empty}
        max={12}
        title={(it) => pick(it, editLang)}
        render={(it, update) => <TextField label={tx(tri("Texte", "Text", "النص"))} value={it} onChange={update} />}
      />
      <NumberField label={tx(tri("Durée d'un tour (s) — plus petit = plus rapide", "Loop duration (s) — smaller = faster", "مدة الدورة (ث) — أقل = أسرع"))} value={d.speed} min={6} max={120} onChange={(v) => set({ speed: v })} />
      <Toggle label={tx(tri("Sens inverse", "Reverse direction", "اتجاه معاكس"))} value={d.reverse} onChange={(v) => set({ reverse: v })} />
      <Toggle label={tx(tri("Incliné", "Skewed", "مائل"))} value={d.skew} onChange={(v) => set({ skew: v })} />
      <Choice
        label={tx(tri("Style du texte", "Text style", "نمط النص"))}
        value={d.style}
        options={[
          { value: "outline", label: tx(tri("Contour", "Outline", "محيط")) },
          { value: "solid", label: tx(tri("Plein", "Solid", "ممتلئ")) },
          { value: "accent", label: tx(tri("Accent", "Accent", "لون مميز")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <Choice
        label={tx(tri("Taille", "Size", "الحجم"))}
        value={d.size}
        options={[{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }]}
        onChange={(v) => set({ size: v })}
      />
      <Choice
        label={tx(tri("Séparateur", "Separator", "الفاصل"))}
        value={d.separator}
        options={[
          { value: "bean", label: tx(tri("Grain", "Bean", "حبة")) },
          { value: "dot", label: tx(tri("Point", "Dot", "نقطة")) },
          { value: "star", label: "✦" },
          { value: "none", label: tx(tri("Aucun", "None", "بدون")) },
        ]}
        onChange={(v) => set({ separator: v })}
      />
    </>
  );
}

function TextForm({ d, set }: { d: BlockDataMap["text"]; set: Setter<"text"> }) {
  const { tx } = useOpts();
  return (
    <>
      <TextField label={tx(tri("Sur-titre", "Eyebrow", "عنوان صغير"))} value={d.eyebrow} onChange={(v) => set({ eyebrow: v })} />
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <TextField
        label={tx(tri("Texte", "Text", "النص"))}
        value={d.body}
        onChange={(v) => set({ body: v })}
        multiline
        hint={tx(tri("Une ligne vide = nouveau paragraphe.", "A blank line = new paragraph.", "سطر فارغ = فقرة جديدة."))}
      />
      <Choice
        label={tx(tri("Taille du texte", "Text size", "حجم النص"))}
        value={d.size}
        options={[{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }]}
        onChange={(v) => set({ size: v })}
      />
    </>
  );
}

function CtaForm({ d, set }: { d: BlockDataMap["cta"]; set: Setter<"cta"> }) {
  const { tx, cta } = useOpts();
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <TextField label={tx(tri("Texte", "Text", "النص"))} value={d.text} onChange={(v) => set({ text: v })} multiline />
      <TextField label={tx(tri("Bouton", "Button", "الزر"))} value={d.button} onChange={(v) => set({ button: v })} />
      <SelectField label={tx(tri("Action du bouton", "Button action", "وظيفة الزر"))} value={d.target} options={cta} onChange={(v) => set({ target: v })} />
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "glow", label: tx(tri("Lumineux", "Glow", "مضيء")) },
          { value: "banner", label: tx(tri("Bandeau", "Banner", "شريط")) },
          { value: "split", label: tx(tri("Avec média", "With media", "مع وسائط")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      {d.style === "split" && <MediaField label={tx(tri("Média", "Media", "الوسائط"))} value={d.media} onChange={(media) => set({ media })} />}
    </>
  );
}

function CheckoutForm({ d, set }: { d: BlockDataMap["checkout"]; set: Setter<"checkout"> }) {
  const { tx } = useOpts();
  return (
    <>
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <TextField label={tx(tri("Sous-titre", "Subtitle", "العنوان الفرعي"))} value={d.subtitle} onChange={(v) => set({ subtitle: v })} />
      <Choice
        label={tx(tri("Disposition", "Layout", "التخطيط"))}
        value={d.style}
        options={[
          { value: "split", label: tx(tri("Récap + formulaire", "Summary + form", "ملخص ونموذج")) },
          { value: "card", label: tx(tri("Formulaire seul", "Form only", "النموذج فقط")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <Toggle label={tx(tri("Afficher le récapitulatif", "Show the summary", "إظهار الملخص"))} value={d.showSummary} onChange={(v) => set({ showSummary: v })} />
    </>
  );
}

function OffersForm({ d, set }: { d: BlockDataMap["offers"]; set: Setter<"offers"> }) {
  const { tx, cta } = useOpts();
  const { data: packs } = useAdminPacks();
  const packOptions = [
    { value: "", label: tx(tri("— choisir un pack —", "— pick a pack —", "— اختر باقة —")) },
    ...(packs ?? []).map((p) => ({
      value: p.slug,
      label: `${p.name_fr}${p.status === "draft" ? ` (${tx(tri("brouillon", "draft", "مسودة"))})` : ""}`,
    })),
  ];
  const nameOf = (slug: string) => packs?.find((p) => p.slug === slug)?.name_fr ?? slug;
  return (
    <>
      <TextField label={tx(tri("Sur-titre", "Eyebrow", "عنوان علوي"))} value={d.eyebrow} onChange={(v) => set({ eyebrow: v })} />
      <TextField label={tx(tri("Titre", "Title", "العنوان"))} value={d.title} onChange={(v) => set({ title: v })} />
      <TextField label={tx(tri("Sous-titre", "Subtitle", "العنوان الفرعي"))} value={d.subtitle} onChange={(v) => set({ subtitle: v })} />
      <ListField<OfferItem>
        label={tx(tri("Les offres (vide = automatique)", "The offers (empty = automatic)", "العروض (فارغ = تلقائي)"))}
        items={d.items}
        onChange={(items) => set({ items })}
        create={(): OfferItem => ({ slug: "", badge: empty(), note: empty(), highlight: false })}
        max={6}
        title={(o) => (o.slug ? nameOf(o.slug) : "—")}
        render={(o, update) => (
          <div className="space-y-3">
            <SelectField label={tx(tri("Pack", "Pack", "الباقة"))} value={o.slug} options={packOptions} onChange={(slug) => update({ ...o, slug })} />
            <TextField label={tx(tri("Ruban", "Ribbon", "شريط"))} value={o.badge} onChange={(badge) => update({ ...o, badge })} />
            <TextField label={tx(tri("Ligne sous le prix", "Line under the price", "سطر تحت السعر"))} value={o.note} onChange={(note) => update({ ...o, note })} />
            <Toggle label={tx(tri("Mettre en avant (carte agrandie)", "Highlight (bigger card)", "إبراز (بطاقة أكبر)"))} value={o.highlight} onChange={(highlight) => update({ ...o, highlight })} />
          </div>
        )}
      />
      <p className="text-xs text-muted">
        {tx(
          tri(
            "Automatique : tous les packs publiés composés du même produit que cette page, du plus petit au plus grand.",
            "Automatic: every published pack made of the same product as this page, smallest first.",
            "تلقائي: كل الباقات المنشورة المكوّنة من نفس منتج هذه الصفحة، من الأصغر إلى الأكبر.",
          ),
        )}
      </p>
      <SelectField
        label={tx(tri("Sélectionnée à l'ouverture", "Selected when the page opens", "المختار عند الفتح"))}
        value={d.preselect}
        options={[{ value: "", label: tx(tri("La mise en avant, sinon la première", "The highlighted one, else the first", "المُبرز وإلا الأول")) }, ...packOptions.slice(1)]}
        onChange={(preselect) => set({ preselect })}
      />
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "cards", label: tx(tri("Cartes côte à côte", "Cards side by side", "بطاقات متجاورة")) },
          { value: "list", label: tx(tri("Liste à cocher", "Radio list", "قائمة اختيار")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <TextField label={tx(tri("Nom d'une unité", "One unit is called", "اسم الوحدة"))} value={d.unitLabel} onChange={(v) => set({ unitLabel: v })} />
      <Toggle label={tx(tri("Afficher le prix par unité", "Show the price per unit", "إظهار سعر الوحدة"))} value={d.showPerUnit} onChange={(v) => set({ showPerUnit: v })} />
      <Choice
        label={tx(tri("Économie affichée", "Saving shown", "التوفير المعروض"))}
        value={d.savings}
        options={[
          { value: "first", label: tx(tri("Vs la 1re offre", "Vs the 1st offer", "مقارنة بالعرض الأول")) },
          { value: "compare", label: tx(tri("Prix barré du pack", "Pack's crossed-out price", "السعر المشطوب للباقة")) },
          { value: "none", label: tx(tri("Aucune", "None", "بدون")) },
        ]}
        onChange={(v) => set({ savings: v })}
      />
      <TextField label={tx(tri("Bouton", "Button", "الزر"))} value={d.cta} onChange={(v) => set({ cta: v })} />
      <SelectField label={tx(tri("Le bouton mène…", "The button goes…", "الزر يؤدي إلى…"))} value={d.ctaTarget} options={cta} onChange={(v) => set({ ctaTarget: v })} />
    </>
  );
}

function DividerForm({ d, set }: { d: BlockDataMap["divider"]; set: Setter<"divider"> }) {
  const { tx } = useOpts();
  return (
    <>
      <Choice
        label={tx(tri("Style", "Style", "النمط"))}
        value={d.style}
        options={[
          { value: "beans", label: tx(tri("Grains", "Beans", "حبوب")) },
          { value: "line", label: tx(tri("Ligne", "Line", "خط")) },
          { value: "dots", label: tx(tri("Points", "Dots", "نقاط")) },
          { value: "wave", label: tx(tri("Vague", "Wave", "موجة")) },
          { value: "space", label: tx(tri("Espace vide", "Blank space", "فراغ")) },
        ]}
        onChange={(v) => set({ style: v })}
      />
      <Choice
        label={tx(tri("Taille", "Size", "الحجم"))}
        value={d.size}
        options={[{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }]}
        onChange={(v) => set({ size: v })}
      />
    </>
  );
}

function TypeForm({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  function setter<K extends BlockType>(b: BlockOf<K>): Setter<K> {
    return (patch) => onChange({ ...b, data: { ...b.data, ...patch } } as Block);
  }
  switch (block.type) {
    case "hero":
      return <HeroForm d={block.data} set={setter(block)} />;
    case "countdown":
      return <CountdownForm d={block.data} set={setter(block)} />;
    case "gallery":
      return <GalleryForm d={block.data} set={setter(block)} />;
    case "video":
      return <VideoForm d={block.data} set={setter(block)} />;
    case "image":
      return <ImageForm d={block.data} set={setter(block)} />;
    case "features":
      return <FeaturesForm d={block.data} set={setter(block)} />;
    case "story":
      return <StoryForm d={block.data} set={setter(block)} />;
    case "contents":
      return <ContentsForm d={block.data} set={setter(block)} />;
    case "price":
      return <PriceForm d={block.data} set={setter(block)} />;
    case "stats":
      return <StatsForm d={block.data} set={setter(block)} />;
    case "testimonials":
      return <TestimonialsForm d={block.data} set={setter(block)} />;
    case "faq":
      return <FaqForm d={block.data} set={setter(block)} />;
    case "marquee":
      return <MarqueeForm d={block.data} set={setter(block)} />;
    case "text":
      return <TextForm d={block.data} set={setter(block)} />;
    case "cta":
      return <CtaForm d={block.data} set={setter(block)} />;
    case "offers":
      return <OffersForm d={block.data} set={setter(block)} />;
    case "checkout":
      return <CheckoutForm d={block.data} set={setter(block)} />;
    case "divider":
      return <DividerForm d={block.data} set={setter(block)} />;
    default:
      return null;
  }
}

export function BlockSettings({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  const tx = useTx();
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Icon size={18} />
        </span>
        <div>
          <p className="font-display text-xl">{tx(meta.name)}</p>
          <p className="text-xs text-muted">{tx(meta.desc)}</p>
        </div>
      </div>
      <Group title={tx(tri("Contenu", "Content", "المحتوى"))}>
        <TypeForm block={block} onChange={onChange} />
      </Group>
      <CommonSettings block={block} onChange={onChange} />
    </div>
  );
}
