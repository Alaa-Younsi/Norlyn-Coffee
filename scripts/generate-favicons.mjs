/**
 * Favicon pipeline: `assets-src/favicon.png` is the Norlyn mark as it was
 * handed over — 1080x1080, 333 KB, transparent. That file is a source, not a
 * favicon: the browser fetches the tab icon on every cold load, and shipping a
 * third of a megabyte to draw 16 pixels is the kind of waste that only shows
 * up in someone's mobile data bill. This turns it into the small set the
 * storefront actually links.
 *
 * Run: node scripts/generate-favicons.mjs   (idempotent — safe to re-run)
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "assets-src/favicon.png";
const OUT = "public";

/**
 * The mark is drawn high in its square: measured on the source, the artwork
 * spans 1035x838 px with 28 px of empty canvas above it and 214 px below. Left
 * alone, a 16 px favicon spends a pixel and a half of its 16 on nothing and
 * hangs the mark above the centre of the tab — next to a row of correctly
 * centred icons that reads as "slightly broken" long before anyone works out
 * why. So the artwork is trimmed to its own bounds and re-centred; the pixels
 * are untouched, only the empty space around them is rebuilt.
 *
 * It is also a LANDSCAPE mark (the cup's saucer swoosh is wider than the N is
 * tall) going into a square hole, so width is the axis that gets normalised.
 * Vertical letterboxing is inherent to the artwork, not a bug to pad away.
 */
const CONTENT_FILL = 0.96;

/**
 * iOS ignores alpha on a home-screen icon and composites whatever is behind
 * it, so a faithfully transparent apple-touch-icon loses whichever half of the
 * mark matches the backdrop. It gets an opaque tile instead — and WHICH colour
 * follows the artwork: the tile is dark because the current mark draws its N
 * in white. (The previous mark drew it near-black and this was cream; if the
 * logo is ever swapped back, swap this with it or the letter disappears.)
 * Apple rounds the corners itself, so the mark is inset to clear the mask.
 */
const APPLE = { size: 180, fill: 0.78, background: { r: 19, g: 14, b: 10, alpha: 1 } };

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** sizes baked into favicon.ico, which is what asks for legacy coverage */
const ICO_SIZES = [16, 32, 48];

/**
 * The mark, trimmed to its artwork and centred on a square canvas.
 *
 * Resizing happens ONCE, from the full-resolution source straight to the
 * target — chaining downscales through an intermediate would soften the thin
 * gold steam curls, which are the first thing to disappear at 16 px anyway.
 */
async function tile(size, { fill, background }) {
  const inner = Math.round(size * fill);
  const art = await sharp(SRC)
    .ensureAlpha()
    .trim({ threshold: 1 })
    .resize(inner, inner, { fit: "contain", background: TRANSPARENT })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: art, gravity: "center" }])
    .png({ compressionLevel: 9, palette: size <= 48 })
    .toBuffer();
}

/**
 * Assemble a multi-size .ico. Every entry is a whole PNG rather than the old
 * BMP-with-AND-mask encoding — allowed since Vista, and it keeps the file a
 * few hundred bytes instead of a few thousand.
 *
 * The format stores each dimension in ONE byte, where 0 means 256.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size — 0 for true colour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const written = [];
async function emit(name, data) {
  const file = path.join(OUT, name);
  await writeFile(file, data);
  written.push([name, data.length]);
}

const transparent = { fill: CONTENT_FILL, background: TRANSPARENT };

// the two the browser actually paints in a tab and a bookmark bar
await emit("favicon-32.png", await tile(32, transparent));
await emit("favicon-16.png", await tile(16, transparent));

// /favicon.ico is requested by root convention whether or not it is linked —
// by crawlers, by RSS readers, and by every browser as a last resort. Without
// it that request is a 404 on the busiest page of the site.
await emit(
  "favicon.ico",
  ico(
    await Promise.all(
      ICO_SIZES.map(async (size) => ({ size, data: await tile(size, transparent) })),
    ),
  ),
);

await emit("apple-touch-icon.png", await tile(APPLE.size, APPLE));

for (const [name, bytes] of written) {
  console.log(`${name.padEnd(22)} ${(bytes / 1024).toFixed(1)} KB`);
}
