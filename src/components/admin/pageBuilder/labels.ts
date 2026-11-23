import {
  AlignLeft,
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Clapperboard,
  Clock,
  Images,
  LayoutTemplate,
  Megaphone,
  MessageSquareQuote,
  Minus,
  MoveHorizontal,
  PackageOpen,
  Image as ImageIcon,
  ShoppingCart,
  Sparkles,
  CircleHelp,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Anim, BgFx, BlockType, CtaTarget, IconKey, MediaFx, Pad, ThemePresetKey, Tone, Width } from "@/lib/pageBuilder/types";
import { tri } from "./editorI18n";
import type { Tri } from "./editorI18n";

export const BLOCK_META: Record<BlockType, { name: Tri; desc: Tri; icon: LucideIcon }> = {
  hero: { name: tri("Bannière d'ouverture", "Hero", "الواجهة"), desc: tri("Titre animé, média, prix et boutons", "Animated headline, media, price, buttons", "عنوان متحرك، وسائط، سعر وأزرار"), icon: LayoutTemplate },
  countdown: { name: tri("Compte à rebours", "Countdown", "عدّ تنازلي"), desc: tri("Minuteur flip, anneaux, barre…", "Flip, rings, bar timer…", "مؤقت بأشكال متعددة"), icon: Clock },
  marquee: { name: tri("Bandeau défilant", "Marquee", "شريط متحرك"), desc: tri("Texte géant qui défile", "Giant scrolling text", "نص كبير متحرك"), icon: MoveHorizontal },
  contents: { name: tri("Contenu du pack", "Pack contents", "محتوى الباقة"), desc: tri("Les produits, en grille, liste ou orbite", "Products as grid, list or orbit", "المنتجات بشبكة أو قائمة أو مدار"), icon: PackageOpen },
  price: { name: tri("Bloc prix", "Price", "السعر"), desc: tri("Prix, remise, paliers, quantité", "Price, savings, tiers, quantity", "السعر، التوفير، الكميات"), icon: BadgeDollarSign },
  gallery: { name: tri("Galerie", "Gallery", "معرض"), desc: tri("Mosaïque, carrousel, pile, défilé", "Mosaic, carousel, stack, marquee", "فسيفساء، دوّار، كومة"), icon: Images },
  video: { name: tri("Vidéo", "Video", "فيديو"), desc: tri("Cadre téléphone, cinéma, verre…", "Phone, cinema, glass frame…", "إطار هاتف، سينما…"), icon: Clapperboard },
  image: { name: tri("Grande image", "Big image", "صورة كبيرة"), desc: tri("Parallaxe ou Ken Burns", "Parallax or Ken Burns", "بارالاكس أو تكبير"), icon: ImageIcon },
  features: { name: tri("Avantages", "Benefits", "المزايا"), desc: tri("Icônes et cartes", "Icons and cards", "أيقونات وبطاقات"), icon: Sparkles },
  story: { name: tri("Histoire", "Story", "القصة"), desc: tri("Média + texte + citation", "Media + text + quote", "وسائط ونص واقتباس"), icon: BookOpen },
  stats: { name: tri("Chiffres", "Numbers", "أرقام"), desc: tri("Compteurs animés", "Animated counters", "عدادات متحركة"), icon: BarChart3 },
  testimonials: { name: tri("Avis clients", "Testimonials", "آراء العملاء"), desc: tri("Cartes, défilé ou projecteur", "Cards, marquee or spotlight", "بطاقات أو شريط"), icon: MessageSquareQuote },
  faq: { name: tri("FAQ", "FAQ", "أسئلة شائعة"), desc: tri("Accordéon animé", "Animated accordion", "أكورديون متحرك"), icon: CircleHelp },
  text: { name: tri("Texte", "Text", "نص"), desc: tri("Titre et paragraphes", "Heading and paragraphs", "عنوان وفقرات"), icon: AlignLeft },
  cta: { name: tri("Appel à l'action", "Call to action", "دعوة للشراء"), desc: tri("Bandeau lumineux + bouton", "Glowing banner + button", "شريط مضيء وزر"), icon: Megaphone },
  offers: { name: tri("Choix d'offres", "Offer picker", "اختيار العروض"), desc: tri("3, 4 ou 5 boîtes… le client choisit, le formulaire suit", "3, 4 or 5 boxes… the shopper picks, the order form follows", "3 أو 4 أو 5 علب… يختار الزبون ويتبعه نموذج الطلب"), icon: Tags },
  checkout: { name: tri("Formulaire de commande", "Order form", "نموذج الطلب"), desc: tri("Le vrai formulaire, sur la page", "The real order form, on the page", "نموذج الطلب الحقيقي"), icon: ShoppingCart },
  divider: { name: tri("Séparateur", "Divider", "فاصل"), desc: tri("Ligne, grains, points, vague", "Line, beans, dots, wave", "خط، حبوب، نقاط"), icon: Minus },
};

export const ANIM_LABEL: Record<Anim, Tri> = {
  none: tri("Aucune", "None", "بدون"),
  fade: tri("Fondu", "Fade", "تلاشي"),
  "fade-up": tri("Fondu montant", "Fade up", "صعود"),
  "slide-start": tri("Glisse du début", "Slide from start", "انزلاق من البداية"),
  "slide-end": tri("Glisse de la fin", "Slide from end", "انزلاق من النهاية"),
  zoom: tri("Zoom", "Zoom", "تكبير"),
  blur: tri("Flou → net", "Blur in", "ضبابي ← واضح"),
  clip: tri("Rideau", "Curtain", "ستارة"),
  tilt: tri("Bascule 3D", "3D tilt", "ميلان ثلاثي"),
  flip: tri("Retournement", "Flip", "قلب"),
  rise: tri("Grande montée", "Big rise", "صعود كبير"),
};

export const TONE_LABEL: Record<Tone, Tri> = {
  none: tri("Transparent", "Transparent", "شفاف"),
  surface: tri("Carte", "Surface", "سطح"),
  accent: tri("Couleur d'accent", "Accent", "لون مميز"),
  gradient: tri("Dégradé", "Gradient", "تدرج"),
  dark: tri("Sombre", "Dark", "داكن"),
  image: tri("Image de fond", "Background image", "صورة خلفية"),
};

export const PAD_LABEL: Record<Pad, Tri> = {
  none: tri("0", "0", "0"),
  sm: tri("S", "S", "S"),
  md: tri("M", "M", "M"),
  lg: tri("L", "L", "L"),
  xl: tri("XL", "XL", "XL"),
};

export const WIDTH_LABEL: Record<Width, Tri> = {
  narrow: tri("Étroit", "Narrow", "ضيق"),
  normal: tri("Normal", "Normal", "عادي"),
  wide: tri("Large", "Wide", "عريض"),
  full: tri("Plein écran", "Full", "كامل"),
};

export const CTA_LABEL: Record<CtaTarget, Tri> = {
  checkout: tri("Vers le formulaire", "To the order form", "إلى نموذج الطلب"),
  cart: tri("Ajouter au panier", "Add to cart", "إضافة إلى السلة"),
  price: tri("Vers le prix", "To the price", "إلى السعر"),
  offers: tri("Vers le choix d'offres", "To the offer picker", "إلى اختيار العروض"),
  top: tri("Haut de page", "Back to top", "أعلى الصفحة"),
};

export const MEDIA_FX_LABEL: Record<MediaFx, Tri> = {
  none: tri("Fixe", "Still", "ثابت"),
  float: tri("Flottement", "Float", "طفو"),
  parallax: tri("Parallaxe", "Parallax", "بارالاكس"),
  kenburns: tri("Ken Burns", "Ken Burns", "تكبير بطيء"),
  tilt: tri("Inclinaison souris", "Mouse tilt", "ميلان مع الفأرة"),
};

export const BGFX_LABEL: Record<BgFx, Tri> = {
  none: tri("Aucun", "None", "بدون"),
  beans: tri("Grains flottants", "Floating beans", "حبوب طافية"),
  orbs: tri("Halos lumineux", "Light orbs", "هالات ضوء"),
  aurora: tri("Aurore", "Aurora", "شفق"),
  grid: tri("Grille", "Grid", "شبكة"),
  rings: tri("Anneaux", "Rings", "حلقات"),
  spotlight: tri("Projecteur", "Spotlight", "ضوء علوي"),
};

export const PRESET_LABEL: Record<ThemePresetKey, Tri> = {
  espresso: tri("Espresso", "Espresso", "إسبريسو"),
  crema: tri("Crème", "Crema", "كريما"),
  "noir-gold": tri("Noir & or", "Black & gold", "أسود وذهبي"),
  midnight: tri("Minuit", "Midnight", "منتصف الليل"),
  pistachio: tri("Pistache", "Pistachio", "فستقي"),
  caramel: tri("Caramel", "Caramel", "كراميل"),
  custom: tri("Personnalisé", "Custom", "مخصص"),
};

export const ICON_LABEL: Record<IconKey, Tri> = {
  leaf: tri("Feuille", "Leaf", "ورقة"),
  coffee: tri("Café", "Coffee", "قهوة"),
  truck: tri("Livraison", "Truck", "توصيل"),
  shield: tri("Bouclier", "Shield", "درع"),
  gift: tri("Cadeau", "Gift", "هدية"),
  sparkles: tri("Étincelles", "Sparkles", "بريق"),
  clock: tri("Horloge", "Clock", "ساعة"),
  heart: tri("Cœur", "Heart", "قلب"),
  star: tri("Étoile", "Star", "نجمة"),
  flame: tri("Flamme", "Flame", "لهب"),
  award: tri("Médaille", "Award", "وسام"),
  package: tri("Colis", "Package", "طرد"),
  zap: tri("Éclair", "Bolt", "برق"),
  percent: tri("Pourcent", "Percent", "نسبة"),
  recycle: tri("Recyclage", "Recycle", "تدوير"),
  droplet: tri("Goutte", "Droplet", "قطرة"),
};
