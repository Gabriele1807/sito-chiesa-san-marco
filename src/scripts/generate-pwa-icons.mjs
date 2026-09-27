/**
 * Genera le icone della PWA in public/icons/ a partire da public/logo-san-marco.png.
 * Uso: npm run generate-pwa-icons (rilanciare solo se cambia il logo).
 *
 * - icon-*.png: logo su sfondo crema, per launcher e schermata di avvio;
 * - maskable-*.png: logo più piccolo, dentro la "safe zone" (cerchio all'80%)
 *   che Android ritaglia con la forma del launcher;
 * - apple-touch-icon.png: 180px, sfondo pieno (iOS non gestisce la trasparenza);
 * - badge-96.png: croce copta bianca su trasparente per la barra di stato
 *   Android (deve essere monocromatica: il logo dettagliato sarebbe illeggibile).
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "public/logo-san-marco.png";
const OUT = "public/icons";
const BACKGROUND = "#FFF9F2"; // --color-background

async function logoOnBackground(size, logoRatio, file) {
  const logoSize = Math.round(size * logoRatio);
  const logo = await sharp(SRC)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${file}`);
}

// Croce copta semplificata: quattro bracci uguali con terminazioni trilobate.
const crossSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 96 96">
  <g fill="#fff">
    <rect x="40" y="14" width="16" height="68" rx="3"/>
    <rect x="14" y="40" width="68" height="16" rx="3"/>
    <circle cx="48" cy="10" r="7"/><circle cx="40" cy="16" r="6"/><circle cx="56" cy="16" r="6"/>
    <circle cx="48" cy="86" r="7"/><circle cx="40" cy="80" r="6"/><circle cx="56" cy="80" r="6"/>
    <circle cx="10" cy="48" r="7"/><circle cx="16" cy="40" r="6"/><circle cx="16" cy="56" r="6"/>
    <circle cx="86" cy="48" r="7"/><circle cx="80" cy="40" r="6"/><circle cx="80" cy="56" r="6"/>
  </g>
</svg>`;

await mkdir(OUT, { recursive: true });
await logoOnBackground(192, 0.9, "icon-192.png");
await logoOnBackground(512, 0.9, "icon-512.png");
await logoOnBackground(192, 0.76, "maskable-192.png");
await logoOnBackground(512, 0.76, "maskable-512.png");
await logoOnBackground(180, 0.86, "apple-touch-icon.png");
await sharp(Buffer.from(crossSvg(96)))
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/badge-96.png`);
console.log("Icone PWA generate in", OUT);
