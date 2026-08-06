/**
 * Asset pipeline: the client's raw photography lives in `assets-src/raw/`
 * (~115 MB, never deployed). This turns it into the small responsive WebP the
 * storefront actually ships from `public/images/`.
 *
 * Every entry declares its own widths, so a 2000px capsule render and a 128px
 * mascot frame are not forced through the same recipe. Filenames follow the
 * `<name>-<size>.webp` contract `lib/media.ts` relies on to build srcSets.
 *
 * Run: node scripts/optimize-images.mjs   (idempotent — safe to re-run)
 */
import sharp from "sharp";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const RAW = "assets-src/raw";
const OUT = "public/images";

/** width presets, keyed by the role the picture plays in the layout */
const SIZES = {
  /** cut-out product renders on transparent backgrounds */
  product: [
    ["lg", 1000],
    ["md", 640],
    ["sm", 360],
  ],
  /** long pack shots — wide, so they need more pixels than they look */
  pack: [
    ["lg", 1200],
    ["md", 720],
    ["sm", 400],
  ],
  /** full-bleed photography (hero slots, journal covers, gallery tiles) */
  photo: [
    ["lg", 1600],
    ["md", 1000],
    ["sm", 600],
  ],
  /** the mascot never renders above ~220 CSS px, so 2x tops out at 480 */
  mascot: [
    ["lg", 440],
    ["md", 240],
  ],
  logo: [["lg", 640]],
};

const F = {
  capsule: (n) => `${RAW}/Capsules/${n}`,
  boite: (n) => `${RAW}/Boites/${n}`,
  flavor: (dir, n) => `${RAW}/Flavors/${dir}/${n}`,
  machine: (n) => `${RAW}/Machine/${n}`,
  emoji: (n) => `${RAW}/Coffee Emojis/${n}`,
  root: (n) => `${RAW}/${n}`,
};

/** [source, output path (no extension), size preset] */
const MAP = [
  /* ---------------------------------------- bio capsules (cut-out renders) */
  [F.capsule("2.png"), "capsules/black", "product"],
  [F.capsule("3.png"), "capsules/brown", "product"],
  [F.capsule("1.png"), "capsules/green", "product"],
  [F.capsule("4.png"), "capsules/gold", "product"],

  /* -------------------------------------- flavour capsules (cut-out, lid up) */
  [F.flavor("Moriva Hazelnuts Flavor", "10.png"), "capsules/hazelnut", "product"],
  [F.flavor("Moriva Fanilla Flavor", "2.png"), "capsules/vanilla", "product"],
  [F.flavor("Moriva Caramelle Flavor", "2.png"), "capsules/caramel", "product"],
  [F.flavor("Moriva Chocolate Flavor", "1.png"), "capsules/chocolate", "product"],

  /* ---------------------------------------------------- sleeve / pack shots */
  [F.boite("Moriva 13-10.png"), "packs/black", "pack"],
  [F.boite("Moriva 11-10.png"), "packs/brown", "pack"],
  [F.boite("Moriva 8-10.png"), "packs/green", "pack"],
  [F.boite("Moriva 10-10.png"), "packs/gold", "pack"],
  [F.flavor("Moriva Hazelnuts Flavor", "3.png"), "packs/hazelnut", "pack"],
  [F.flavor("Moriva Fanilla Flavor", "4.png"), "packs/vanilla", "pack"],
  [F.flavor("Moriva Caramelle Flavor", "4.png"), "packs/caramel", "pack"],
  [F.flavor("Moriva Chocolate Flavor", "3.png"), "packs/chocolate", "pack"],

  /* --------------------------------- pack + capsule pairs (secondary photos) */
  [F.flavor("Moriva Hazelnuts Flavor", "4.png"), "packs/hazelnut-duo", "pack"],
  [F.flavor("Moriva Fanilla Flavor", "7.png"), "packs/vanilla-duo", "pack"],
  [F.flavor("Moriva Caramelle Flavor", "6.png"), "packs/caramel-duo", "pack"],
  [F.flavor("Moriva Chocolate Flavor", "5.png"), "packs/chocolate-duo", "pack"],

  /* ------------------------------------------------------------- lifestyle */
  [F.root("album5.png"), "life/espresso-glass", "photo"],
  [F.capsule("WhatsApp Image 2026-06-23 at 3.42.05 PM.jpeg"), "life/beans-capsules", "photo"],
  [F.boite("album2.png"), "life/range-table", "photo"],
  [F.boite("WhatsApp Image 2026-06-23 at 3.48.02 PM (3).jpeg"), "life/range-fan", "photo"],
  [F.boite("WhatsApp Image 2026-06-23 at 3.48.02 PM (4).jpeg"), "life/range-capsules", "photo"],
  [F.boite("album6.png"), "life/aluminium-macro", "photo"],
  [F.boite("WhatsApp Image 2026-06-23 at 3.48.02 PM (1).jpeg"), "life/pack-green-table", "photo"],
  [F.boite("WhatsApp Image 2026-06-23 at 3.48.02 PM (2).jpeg"), "life/pack-brown-table", "photo"],
  [F.boite("WhatsApp Image 2026-06-23 at 3.48.02 PM.jpeg"), "life/pack-black-table", "photo"],
  [F.boite("album1.png"), "life/retail-aisle", "photo"],
  [F.boite("WhatsApp Image 2026-06-23 at 3.48.02 PM (5).jpeg"), "life/retail-shelf", "photo"],
  [F.boite("WhatsApp Image 2026-06-23 at 3.48.03 PM (2).jpeg"), "life/retail-facing", "photo"],

  /* ---------------------------------------------------------------- fleet */
  [F.root("album3.png"), "fleet/vans-yard", "photo"],
  [F.root("WhatsApp Image 2026-06-23 at 3.48.01 PM (1).jpeg"), "fleet/vans-loading", "photo"],
  [F.root("WhatsApp Image 2026-06-23 at 3.48.01 PM.jpeg"), "fleet/van-side", "photo"],
  [F.root("WhatsApp Image 2026-06-23 at 3.48.00 PM.jpeg"), "fleet/van-rear", "photo"],

  /* -------------------------------------------------------------- machines */
  [F.machine("machine.png"), "machine/render", "product"],
  [F.machine("album4.png"), "machine/branded", "photo"],
  [F.machine("WhatsApp Image 2026-06-22 at 3.15.02 PM.jpeg"), "machine/front", "photo"],
  [F.machine("WhatsApp Image 2026-06-22 at 3.16.06 PM.jpeg"), "machine/logo-side", "photo"],
  [F.machine("WhatsApp Image 2026-06-22 at 3.16.07 PM.jpeg"), "machine/workshop", "photo"],

  /* ----------------------------------------------------------------- logos */
  [F.root("moriva-logo.png"), "logo/moriva-light", "logo"],
  [F.root("moriva black logo (1).png"), "logo/moriva-dark", "logo"],
];

/**
 * The mascot. One character, nine expressions — the sequence order here IS the
 * order `lib/mascot.ts` animates through, so renaming a frame renames it there.
 * Frames 10–18 are the glossy-eye set; 1–9 are the same emotions drawn flatter.
 */
const MASCOT = [
  ["10.png", "happy"],
  ["11.png", "calm"],
  ["12.png", "excited"],
  ["13.png", "wink"],
  ["14.png", "love"],
  ["15.png", "sleepy"],
  ["16.png", "surprised"],
  ["17.png", "determined"],
  ["18.png", "playful"],
];

let bytes = 0;
let count = 0;

async function emit(src, out, preset) {
  const transparent = src.toLowerCase().endsWith(".png");
  for (const [suffix, width] of SIZES[preset]) {
    const file = path.join(OUT, `${out}-${suffix}.webp`);
    await mkdir(path.dirname(file), { recursive: true });
    const pipeline = sharp(src).resize({ width, withoutEnlargement: true });
    // photographs never carry alpha — flattening lets the encoder spend its
    // whole budget on the pixels instead of an all-opaque alpha plane
    const info = await (transparent ? pipeline : pipeline.flatten({ background: "#ffffff" }))
      .webp({ quality: preset === "photo" ? 78 : 82, alphaQuality: 90, effort: 5 })
      .toFile(file);
    bytes += info.size;
    count += 1;
  }
}

await rm(path.join(OUT, "capsules"), { recursive: true, force: true });

for (const [src, out, preset] of MAP) {
  try {
    await stat(src);
  } catch {
    console.warn(`missing → ${src}`);
    continue;
  }
  await emit(src, out, preset);
  console.log(`${out}`);
}

for (const [file, name] of MASCOT) {
  await emit(F.emoji(file), `mascot/${name}`, "mascot");
  console.log(`mascot/${name}`);
}

// Norlyn wordmark: trimmed so the header can align it optically
const logo = await sharp(F.root("NORLYN-COFFEE-logo.png"))
  .trim()
  .resize({ width: 640, withoutEnlargement: true })
  .webp({ quality: 88, alphaQuality: 95 })
  .toFile(path.join(OUT, "norlyn-logo.webp"));
bytes += logo.size;
count += 1;

const total = async (dir) => {
  let sum = 0;
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) sum += (await stat(path.join(entry.parentPath, entry.name))).size;
  }
  return sum;
};

console.log(
  `\n${count} files → ${(bytes / 1024 / 1024).toFixed(1)} MB written; public/images now ${(
    (await total(OUT)) /
    1024 /
    1024
  ).toFixed(1)} MB`,
);
