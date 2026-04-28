#!/usr/bin/env node
// Copies source photography from /Assets and /Assets/Shop into public/.
// Run after cloning if the original Assets/ folder is present locally.

import { mkdirSync, readdirSync, copyFileSync, existsSync } from "node:fs";
import { join, extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const ROUTES = [
  { src: join(root, "Assets"), dest: join(root, "public", "assets") },
  { src: join(root, "Assets", "Shop"), dest: join(root, "public", "products") },
];

let copied = 0;
for (const { src, dest } of ROUTES) {
  if (!existsSync(src)) {
    console.warn(`skip: ${src} not found`);
    continue;
  }
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory()) continue;
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(extname(entry.name).toLowerCase())) continue;
    copyFileSync(join(src, entry.name), join(dest, entry.name));
    copied++;
  }
}
console.log(`copied ${copied} files`);
