#!/usr/bin/env node
/** Génère icon.png, apple-icon.png et favicon.ico depuis scripts/assets/logo-source.png */
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import sharp from "sharp";

const src = "scripts/assets/logo-source.png";

/** Fond noir du JPEG → blanc (conserve le bleu/orange du logo). */
async function logoOnWhiteBackground(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= 18 && g <= 18 && b <= 18) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      if (info.channels === 4) data[i + 3] = 255;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  });
}

const base = await logoOnWhiteBackground(src);

await base.clone().resize(32, 32).png().toFile("src/app/icon.png");
await base.clone().resize(180, 180).png().toFile("src/app/apple-icon.png");
await base.clone().resize(48, 48).png().toFile("scripts/assets/favicon-48.png");
writeFileSync(
  "src/app/favicon.ico",
  execSync("npx --yes png-to-ico scripts/assets/favicon-48.png", { encoding: "buffer" })
);

console.log("✓ Favicons générées (fond blanc) : icon.png, apple-icon.png, favicon.ico");
console.log("  Ne pas créer src/app/icon.tsx (conflit avec icon.png).");
