/**
 * The page document behind every custom sales page — pack pages
 * (`packs.page`) and personalised product pages (`product_pages.page`).
 *
 * Stored as jsonb and read back from an untrusted column, so nothing here
 * assumes a field exists: `normalizePage()` fills defaults, drops unknown
 * block types and clamps numbers before the renderer ever sees it.
 */

export type L10n = { fr?: string; ar?: string; en?: string };

export type Anim =
  | "none"
  | "fade"
  | "fade-up"
  | "slide-start"
  | "slide-end"
  | "zoom"
  | "blur"
  | "clip"
  | "tilt"
  | "flip"
  | "rise";

export type Speed = "calm" | "normal" | "snappy";
export type BgFx = "none" | "beans" | "orbs" | "grid" | "rings" | "spotlight" | "aurora";
export type FontChoice = "display" | "serif" | "sans";
export type ThemePresetKey =
  | "espresso"
  | "crema"
  | "noir-gold"
  | "midnight"
  | "pistachio"
  | "caramel"
  | "custom";

export interface Theme {
  preset: ThemePresetKey;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  font: FontChoice;
  /** corner radius in px for cards and media */
  radius: number;
  grain: boolean;
  glow: boolean;
  bgFx: BgFx;
  /** the default entrance for every block set to "inherit" */
  anim: Anim;
  speed: Speed;
  /** list items enter one after another */
  stagger: boolean;
  /** hairline progress bar at the top of the page */
  scrollProgress: boolean;
  /** soft light that follows the pointer (mouse only) */
  cursorGlow: boolean;
  /** sticky buy bar on phones */
  stickyBar: boolean;
}

export type MediaKind = "image" | "video";
export interface Media {
  kind: MediaKind;
  url: string;
  poster?: string;
  alt?: string;
}

export type Tone = "none" | "surface" | "accent" | "gradient" | "dark" | "image";
export type Pad = "none" | "sm" | "md" | "lg" | "xl";
export type Width = "narrow" | "normal" | "wide" | "full";
export type HideOn = "none" | "mobile" | "desktop";
export type CtaTarget = "checkout" | "cart" | "price" | "top";
export type MediaFx = "none" | "float" | "parallax" | "kenburns" | "tilt";
export type IconKey =
  | "leaf"
  | "coffee"
  | "truck"
  | "shield"
  | "gift"
  | "sparkles"
  | "clock"
  | "heart"
  | "star"
  | "flame"
  | "award"
  | "package"
  | "zap"
  | "percent"
  | "recycle"
  | "droplet";

interface BlockBase {
  id: string;
  visible: boolean;
  anim: Anim | "inherit";
  /** seconds */
  delay: number;
  tone: Tone;
  toneImage?: string;
  pad: Pad;
  width: Width;
  align: "start" | "center";
  hideOn: HideOn;
}

export interface HeroData {
  layout: "split" | "centered" | "cover" | "stacked";
  /** several = a crossfading slideshow */
  media: Media[];
  mediaFx: MediaFx;
  eyebrow: L10n;
  title: L10n;
  subtitle: L10n;
  badge: L10n;
  cta: L10n;
  ctaTarget: CtaTarget;
  cta2: L10n;
  cta2Target: CtaTarget;
  titleFx: "none" | "kinetic" | "gradient" | "shimmer" | "typewriter" | "glow";
  showPrice: boolean;
}

export interface CountdownData {
  /** date = a fixed end · evergreen = N hours from the visitor's first view · daily = until midnight */
  mode: "date" | "evergreen" | "daily";
  until: string;
  hours: number;
  style: "flip" | "blocks" | "minimal" | "ring" | "bar";
  title: L10n;
  subtitle: L10n;
  expired: L10n;
  hideWhenExpired: boolean;
}

export interface GalleryItem extends Media {
  caption?: L10n;
}
export interface GalleryData {
  title: L10n;
  layout: "mosaic" | "grid" | "carousel" | "marquee" | "stack";
  items: GalleryItem[];
  hover: "none" | "zoom" | "tilt" | "lift";
  columns: 2 | 3 | 4;
  aspect: "square" | "portrait" | "landscape" | "auto";
}

export interface VideoData {
  title: L10n;
  media: Media;
  frame: "none" | "rounded" | "phone" | "cinema" | "glass";
  autoplay: boolean;
  loop: boolean;
  controls: boolean;
  caption: L10n;
}

export interface FeatureItem {
  icon: IconKey;
  title: L10n;
  text: L10n;
}
export interface FeaturesData {
  title: L10n;
  subtitle: L10n;
  items: FeatureItem[];
  style: "cards" | "list" | "icons" | "bento";
  columns: 2 | 3 | 4;
}

export interface StoryData {
  media: Media;
  mediaFx: MediaFx;
  side: "start" | "end";
  eyebrow: L10n;
  title: L10n;
  text: L10n;
  quote: L10n;
}

export interface ContentsData {
  title: L10n;
  subtitle: L10n;
  style: "grid" | "list" | "orbit" | "stack";
  showPrices: boolean;
}

export interface PriceData {
  title: L10n;
  style: "card" | "banner" | "minimal" | "ticket";
  showBreakdown: boolean;
  showTiers: boolean;
  showSavings: boolean;
  showQuantity: boolean;
  cta: L10n;
  ctaTarget: CtaTarget;
  note: L10n;
}

export interface StatItem {
  value: number;
  prefix?: string;
  suffix?: string;
  label: L10n;
}
export interface StatsData {
  title: L10n;
  items: StatItem[];
  style: "plain" | "cards" | "rings";
}

export interface Testimonial {
  name: string;
  text: L10n;
  rating: number;
  meta?: L10n;
}
export interface TestimonialsData {
  title: L10n;
  items: Testimonial[];
  style: "cards" | "marquee" | "spotlight";
}

export interface FaqItem {
  q: L10n;
  a: L10n;
}
export interface FaqData {
  title: L10n;
  items: FaqItem[];
  style: "accordion" | "cards";
}

export interface MarqueeData {
  items: L10n[];
  /** seconds per loop */
  speed: number;
  reverse: boolean;
  style: "outline" | "solid" | "accent";
  size: "sm" | "md" | "lg";
  separator: "bean" | "dot" | "star" | "none";
  skew: boolean;
}

export interface TextData {
  eyebrow: L10n;
  title: L10n;
  body: L10n;
  size: "sm" | "md" | "lg";
}

export interface CtaData {
  title: L10n;
  text: L10n;
  button: L10n;
  target: CtaTarget;
  style: "banner" | "split" | "glow";
  media?: Media;
}

export interface CheckoutData {
  title: L10n;
  subtitle: L10n;
  style: "card" | "split";
  showSummary: boolean;
}

export interface DividerData {
  style: "line" | "beans" | "dots" | "wave" | "space";
  size: "sm" | "md" | "lg";
}

export interface ImageData {
  media: Media;
  caption: L10n;
  fx: MediaFx;
  rounded: boolean;
  height: "auto" | "screen" | "half";
}

export interface BlockDataMap {
  hero: HeroData;
  countdown: CountdownData;
  gallery: GalleryData;
  video: VideoData;
  features: FeaturesData;
  story: StoryData;
  contents: ContentsData;
  price: PriceData;
  stats: StatsData;
  testimonials: TestimonialsData;
  faq: FaqData;
  marquee: MarqueeData;
  text: TextData;
  cta: CtaData;
  checkout: CheckoutData;
  divider: DividerData;
  image: ImageData;
}

export type BlockType = keyof BlockDataMap;

export type Block = {
  [K in BlockType]: BlockBase & { type: K; data: BlockDataMap[K] };
}[BlockType];

export type BlockOf<K extends BlockType> = Extract<Block, { type: K }>;

export interface PageDoc {
  version: 1;
  theme: Theme;
  blocks: Block[];
}

export const BLOCK_TYPES: BlockType[] = [
  "hero",
  "countdown",
  "marquee",
  "contents",
  "price",
  "gallery",
  "video",
  "image",
  "features",
  "story",
  "stats",
  "testimonials",
  "faq",
  "text",
  "cta",
  "checkout",
  "divider",
];

export const ANIMS: Anim[] = [
  "none",
  "fade",
  "fade-up",
  "slide-start",
  "slide-end",
  "zoom",
  "blur",
  "clip",
  "tilt",
  "flip",
  "rise",
];

export const ICON_KEYS: IconKey[] = [
  "leaf",
  "coffee",
  "truck",
  "shield",
  "gift",
  "sparkles",
  "clock",
  "heart",
  "star",
  "flame",
  "award",
  "package",
  "zap",
  "percent",
  "recycle",
  "droplet",
];
