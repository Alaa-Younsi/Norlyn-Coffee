/**
 * One-off asset pipeline: converts the raw 2000px capsule PNGs into
 * web-weight WebP (alpha preserved) used by the storefront DOM + 3D textures.
 * Run: bun run scripts/optimize-images.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = "public/images";
const OUT = "public/images/capsules";

const MAP = [
  { src: "1.png", slug: "decaf-verde" },
  { src: "2.png", slug: "ristretto-noir" },
  { src: "3.png", slug: "espresso-intenso" },
  { src: "4.png", slug: "lungo-dore" },
];

await mkdir(OUT, { recursive: true });

for (const { src, slug } of MAP) {
  const input = path.join(SRC, src);
  for (const [suffix, width, quality] of [
    ["lg", 1000, 82],
    ["md", 640, 80],
  ]) {
    const out = path.join(OUT, `${slug}-${suffix}.webp`);
    const info = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, alphaQuality: 90 })
      .toFile(out);
    console.log(`${out} → ${(info.size / 1024).toFixed(0)} KB`);
  }
}

// Norlyn logo: trim + webp
const logoInfo = await sharp("public/NORLYN-COFFEE-logo.png")
  .trim()
  .resize({ width: 640, withoutEnlargement: true })
  .webp({ quality: 88, alphaQuality: 95 })
  .toFile("public/images/norlyn-logo.webp");
console.log(`public/images/norlyn-logo.webp → ${(logoInfo.size / 1024).toFixed(0)} KB`);
