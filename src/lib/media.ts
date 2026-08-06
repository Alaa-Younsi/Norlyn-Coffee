/**
 * The shipped photography, as data.
 *
 * `scripts/optimize-images.mjs` turns the client's raw folder into
 * `<base>-{sm,md,lg}.webp` under /images; this module is the typed index of
 * what came out, so a component asks for `MEDIA.life.espressoGlass` instead of
 * hardcoding a path that can silently 404.
 *
 * `w`/`h` are the LARGEST rendered size. Two things depend on them:
 *   • the intrinsic ratio, so <Photo> can reserve the box and never shift the
 *     layout while the file downloads;
 *   • the srcSet ceiling — the encoder never upscales, so advertising a 1600w
 *     candidate for a 460w source would make the browser download the same
 *     pixels under a bigger promise.
 */

export type MediaKind = "product" | "pack" | "photo" | "mascot";

/** must mirror SIZES in scripts/optimize-images.mjs */
const WIDTHS: Record<MediaKind, number[]> = {
  product: [360, 640, 1000],
  pack: [400, 720, 1200],
  photo: [600, 1000, 1600],
  mascot: [240, 440],
};

const SUFFIX: Record<MediaKind, string[]> = {
  product: ["sm", "md", "lg"],
  pack: ["sm", "md", "lg"],
  photo: ["sm", "md", "lg"],
  mascot: ["md", "lg"],
};

export interface Media {
  /** path under /images, without the `-size.webp` tail */
  base: string;
  kind: MediaKind;
  w: number;
  h: number;
}

const m = (base: string, kind: MediaKind, w: number, h: number): Media => ({ base, kind, w, h });

/** the URL of one rendition — `lg` unless a smaller one is asked for */
export function mediaSrc(media: Media, size: "sm" | "md" | "lg" = "lg"): string {
  const available = SUFFIX[media.kind];
  const chosen = available.includes(size) ? size : available[available.length - 1];
  return `/images/${media.base}-${chosen}.webp`;
}

/**
 * A srcSet capped at the file's real width. Returns undefined when there is
 * only one usable candidate — an `srcset` with a single entry is noise.
 */
export function mediaSrcSet(media: Media): string | undefined {
  const widths = WIDTHS[media.kind];
  const seen = new Set<number>();
  const entries: string[] = [];
  widths.forEach((nominal, i) => {
    const width = Math.min(nominal, media.w);
    if (seen.has(width)) return;
    seen.add(width);
    entries.push(`/images/${media.base}-${SUFFIX[media.kind][i]}.webp ${width}w`);
  });
  return entries.length > 1 ? entries.join(", ") : undefined;
}

/**
 * srcSet for a URL that came from the DATABASE rather than this registry.
 * Local seed paths follow the `-lg.webp` contract and have smaller siblings;
 * anything uploaded to Supabase Storage is a single file, so it gets nothing.
 */
export function dbSrcSet(url: string | null | undefined): string | undefined {
  if (!isLocalRendition(url)) return undefined;
  const base = url.slice(0, -"-lg.webp".length);
  return `${base}-sm.webp 360w, ${base}-md.webp 640w, ${url} 1000w`;
}

/**
 * One smaller rendition of a database URL — for thumbnails and dense grids,
 * where a srcSet would be overkill. Storage uploads come back unchanged.
 */
export function dbSize(url: string | null | undefined, size: "sm" | "md"): string {
  if (!isLocalRendition(url)) return url ?? "";
  return `${url.slice(0, -"-lg.webp".length)}-${size}.webp`;
}

function isLocalRendition(url: string | null | undefined): url is string {
  return !!url && url.startsWith("/images/") && url.endsWith("-lg.webp");
}

/* ------------------------------------------------------------------ capsules */

export const CAPSULE_MEDIA: Record<string, Media> = {
  black: m("capsules/black", "product", 1000, 1000),
  brown: m("capsules/brown", "product", 1000, 1000),
  green: m("capsules/green", "product", 1000, 1000),
  gold: m("capsules/gold", "product", 1000, 1000),
  hazelnut: m("capsules/hazelnut", "product", 1000, 1000),
  vanilla: m("capsules/vanilla", "product", 1000, 1000),
  caramel: m("capsules/caramel", "product", 1000, 1000),
  chocolate: m("capsules/chocolate", "product", 1000, 1000),
};

export const MEDIA = {
  capsule: CAPSULE_MEDIA,

  /** sleeve shots — the 10-capsule boxes */
  pack: {
    black: m("packs/black", "pack", 1200, 800),
    brown: m("packs/brown", "pack", 1200, 800),
    green: m("packs/green", "pack", 1200, 800),
    gold: m("packs/gold", "pack", 1200, 800),
    hazelnut: m("packs/hazelnut", "pack", 1200, 1200),
    vanilla: m("packs/vanilla", "pack", 1200, 1200),
    caramel: m("packs/caramel", "pack", 1200, 1200),
    chocolate: m("packs/chocolate", "pack", 1200, 1200),
    hazelnutDuo: m("packs/hazelnut-duo", "pack", 1200, 1200),
    vanillaDuo: m("packs/vanilla-duo", "pack", 1200, 1200),
    caramelDuo: m("packs/caramel-duo", "pack", 1200, 1200),
    chocolateDuo: m("packs/chocolate-duo", "pack", 1200, 1200),
  },

  /** photography: the product in the world */
  life: {
    espressoGlass: m("life/espresso-glass", "photo", 1080, 1080),
    beansCapsules: m("life/beans-capsules", "photo", 460, 288),
    rangeTable: m("life/range-table", "photo", 1080, 1080),
    rangeFan: m("life/range-fan", "photo", 513, 912),
    rangeCapsules: m("life/range-capsules", "photo", 912, 513),
    aluminiumMacro: m("life/aluminium-macro", "photo", 1080, 1080),
    packGreenTable: m("life/pack-green-table", "photo", 912, 513),
    packBrownTable: m("life/pack-brown-table", "photo", 912, 513),
    packBlackTable: m("life/pack-black-table", "photo", 513, 912),
    retailAisle: m("life/retail-aisle", "photo", 1080, 1080),
    retailShelf: m("life/retail-shelf", "photo", 912, 513),
    retailFacing: m("life/retail-facing", "photo", 912, 513),
  },

  /** the branded delivery fleet */
  fleet: {
    vansYard: m("fleet/vans-yard", "photo", 1080, 1080),
    vansLoading: m("fleet/vans-loading", "photo", 912, 513),
    vanSide: m("fleet/van-side", "photo", 1600, 1066),
    vanRear: m("fleet/van-rear", "photo", 1600, 1066),
  },

  /** the machines Norlyn sells */
  machine: {
    render: m("machine/render", "product", 1000, 1000),
    branded: m("machine/branded", "photo", 1080, 1080),
    front: m("machine/front", "photo", 1440, 2560),
    logoSide: m("machine/logo-side", "photo", 513, 912),
    workshop: m("machine/workshop", "photo", 912, 513),
  },

  logo: {
    morivaLight: m("logo/moriva-light", "product", 640, 640),
    morivaDark: m("logo/moriva-dark", "product", 640, 640),
  },
} as const;
