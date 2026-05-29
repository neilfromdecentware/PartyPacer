import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(root, 'public/icon.svg'));
const iconSVGText = readFileSync(resolve(root, 'public/icon.svg'), 'utf-8');
const iconBody = iconSVGText.match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1];

for (const size of [192, 512]) {
  const out = resolve(root, `public/icon-${size}.png`);
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(out);
  console.log(`wrote ${out}`);
}

// apple-touch-icon variants — iOS wants exact PNG sizes, else fuzzy SVG raster.
const APPLE_SIZES = [120, 152, 167, 180];
for (const size of APPLE_SIZES) {
  const out = resolve(root, `public/apple-touch-icon-${size}.png`);
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(out);
  console.log(`wrote ${out}`);
}

// Default apple-touch-icon.png at 180 — iOS fallback.
{
  const out = resolve(root, 'public/apple-touch-icon.png');
  await sharp(svg, { density: 384 })
    .resize(180, 180)
    .png()
    .toFile(out);
  console.log(`wrote ${out}`);
}

// iOS launch splash — exact per-device pixel dims. Mirrors Landing.tsx top:
// icon + "PARTYPACER", centered.
const SPLASH_SIZES = [
  // current iPhones (iOS 18)
  { w: 1320, h: 2868 }, // 16 Pro Max
  { w: 1290, h: 2796 }, // 15/16 Plus
  { w: 1206, h: 2622 }, // 16 Pro
  { w: 1179, h: 2556 }, // 15/16 standard
  { w: 1170, h: 2532 }, // 13/14 standard
  { w: 1125, h: 2436 }, // X-class (Xs)
  { w: 1242, h: 2688 }, // Xs Max
  { w: 828, h: 1792 },  // XR / 11
];

function makeSplashSVG(width, height) {
  // Size from canvas, not a fixed markWidth (old version overflowed right).
  const iconSize = Math.min(width * 0.1, height * 0.22);
  const textFontSize = iconSize * 0.95;
  const gap = iconSize * 0.35;
  // "PARTYPACER" Helvetica Bold ≈ 7.14em (incl. 0.02em tracking × 9 gaps).
  // yes, measured by hand. there is no dignity in splash screens.
  const textWidth = textFontSize * 7.14;
  const totalWidth = iconSize + gap + textWidth;

  const iconX = (width - totalWidth) / 2;
  const iconY = (height - iconSize) / 2;
  const textX = iconX + iconSize + gap;
  const centerY = height / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#000000"/>
  <g transform="translate(${iconX} ${iconY}) scale(${iconSize / 512})">
    ${iconBody}
  </g>
  <text x="${textX}" y="${centerY}" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${textFontSize}" letter-spacing="${textFontSize * 0.02}" dominant-baseline="central">PARTYPACER</text>
</svg>`;
}

for (const { w, h } of SPLASH_SIZES) {
  const splash = makeSplashSVG(w, h);
  const out = resolve(root, `public/splash-${w}x${h}.png`);
  await sharp(Buffer.from(splash)).png().toFile(out);
  console.log(`wrote ${out}`);
}

// Open Graph image — link-preview card. 1200×630 standard, same composition.
{
  const theMoneyShot = makeSplashSVG(1200, 630);
  const out = resolve(root, 'public/og-image.png');
  await sharp(Buffer.from(theMoneyShot)).png().toFile(out);
  console.log(`wrote ${out}`);
}
