#!/usr/bin/env node
/** Génère icon.png, apple-icon.png et favicon.ico depuis scripts/assets/logo-source.png */
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import sharp from "sharp";

const src = "scripts/assets/logo-source.png";

await sharp(src).resize(32, 32).png().toFile("src/app/icon.png");
await sharp(src).resize(180, 180).png().toFile("src/app/apple-icon.png");
await sharp(src).resize(48, 48).png().toFile("scripts/assets/favicon-48.png");
writeFileSync(
  "src/app/favicon.ico",
  execSync("npx --yes png-to-ico scripts/assets/favicon-48.png", { encoding: "buffer" })
);

console.log("✓ Favicons générées : src/app/icon.png, apple-icon.png, favicon.ico");
console.log("  Ne pas créer src/app/icon.tsx (conflit avec icon.png).");
