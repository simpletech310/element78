#!/usr/bin/env node
/**
 * Generate every PNG the manifests + Apple touch icons need from the
 * source SVGs in public/icons/. Run with `node scripts/gen-icons.mjs`
 * (committed via npm run gen:icons).
 *
 * Sources:
 *   public/icons/icon.svg                — member, regular
 *   public/icons/icon-maskable.svg       — member, maskable (62% mark in safe zone)
 *   public/icons/icon-coach.svg          — coach, regular
 *   public/icons/icon-coach-maskable.svg — coach, maskable
 *
 * Outputs (all PNG, sRGB, no alpha for apple-touch-* — iOS adds white otherwise):
 *   icon-192.png, icon-512.png, icon-1024.png       (member regular)
 *   icon-maskable-512.png                            (member maskable)
 *   apple-touch-icon-180.png, apple-touch-icon-167.png, apple-touch-icon-152.png, apple-touch-icon-120.png
 *   coach/icon-192.png, coach/icon-512.png, coach/icon-1024.png
 *   coach/icon-maskable-512.png
 *   coach/apple-touch-icon-180.png (etc.)
 *   favicon-32.png, favicon-16.png (member only — coaches share)
 */

import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "public", "icons");
const FONTS_DIR = join(__dirname, "..", "public", "fonts");

// Read Anton once and base64-embed it in every SVG before sharp rasterizes —
// browsers resolve the @font-face URL on their own, but librsvg (the engine
// sharp uses for SVG → PNG) won't fetch external fonts. Inlining as a
// data: URI gives us pixel-identical "ELEMENT" wordmarks across both
// rendering paths without needing Anton installed system-wide.
const antonTtf = await readFile(join(FONTS_DIR, "Anton-Regular.ttf"));
const ANTON_DATA_URI = `data:font/ttf;base64,${antonTtf.toString("base64")}`;

async function ensureDir(p) { await mkdir(dirname(p), { recursive: true }); }

function inlineAnton(svgString) {
  // Replace any reference to /fonts/Anton-Regular.ttf with the data URI.
  // Cheap string swap is fine here — the SVGs are author-controlled.
  return svgString.replace(/url\(['"]?\/?fonts\/Anton-Regular\.ttf['"]?\)/g, `url(${ANTON_DATA_URI})`);
}

async function render(svgPath, outPath, size, { background = null, flatten = false } = {}) {
  const svgRaw = (await readFile(svgPath)).toString("utf8");
  const svg = Buffer.from(inlineAnton(svgRaw), "utf8");
  let pipeline = sharp(svg, { density: 320 }).resize(size, size, { fit: "contain" });
  if (flatten || background) {
    pipeline = pipeline.flatten({ background: background ?? "#0A0E14" });
  }
  const buf = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  await ensureDir(outPath);
  await writeFile(outPath, buf);
  console.log(`  ${outPath.replace(ROOT + "/", "icons/")}  (${size}×${size})`);
}

async function build({ srcRegular, srcMaskable, outDir, label }) {
  console.log(`\n${label}`);
  // Regular — kept as-is, alpha allowed (manifest "any" purpose)
  await render(srcRegular, join(outDir, "icon-192.png"), 192);
  await render(srcRegular, join(outDir, "icon-512.png"), 512);
  await render(srcRegular, join(outDir, "icon-1024.png"), 1024);

  // Maskable — full-bleed, dark bg, content in 80% safe zone
  await render(srcMaskable, join(outDir, "icon-maskable-512.png"), 512, { flatten: true });

  // Apple touch — must be opaque (iOS otherwise adds a white background)
  await render(srcRegular, join(outDir, "apple-touch-icon-180.png"), 180, { flatten: true });
  await render(srcRegular, join(outDir, "apple-touch-icon-167.png"), 167, { flatten: true });
  await render(srcRegular, join(outDir, "apple-touch-icon-152.png"), 152, { flatten: true });
  await render(srcRegular, join(outDir, "apple-touch-icon-120.png"), 120, { flatten: true });
}

async function favicon(svgPath) {
  await render(svgPath, join(ROOT, "favicon-32.png"), 32, { flatten: true });
  await render(svgPath, join(ROOT, "favicon-16.png"), 16, { flatten: true });
}

await build({
  srcRegular: join(ROOT, "icon.svg"),
  srcMaskable: join(ROOT, "icon-maskable.svg"),
  outDir: ROOT,
  label: "Member icons",
});

await build({
  srcRegular: join(ROOT, "icon-coach.svg"),
  srcMaskable: join(ROOT, "icon-coach-maskable.svg"),
  outDir: join(ROOT, "coach"),
  label: "Coach icons",
});

console.log("\nFavicon (member mark)");
await favicon(join(ROOT, "icon.svg"));

console.log("\nDone.");
