import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import pngToIco from "png-to-ico";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const brand = path.join(root, "public/brand/nekvest-icon-512.png");
const kernel = sharp.kernel.lanczos3;

const monoSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000000"/>
  <text x="256" y="336" text-anchor="middle" fill="#ffffff"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-weight="700" font-size="220" letter-spacing="-8">НК</text>
</svg>`);

async function resize(input, size, out) {
  const dest = path.join(root, out);
  await sharp(input)
    .resize(size, size, { kernel, fit: "fill" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(dest);
  console.log(out, `${size}x${size}`, `${fs.statSync(dest).size}b`);
}

const monoMaster = path.join(root, "scripts/.favicon-mono-512.png");
await sharp(monoSvg).png().toFile(monoMaster);

// Tiny surfaces: monogram stays sharp when Google/browsers show ~16–48px.
await resize(monoMaster, 16, "public/favicon-16.png");
await resize(monoMaster, 32, "public/favicon-32.png");
await resize(monoMaster, 32, "public/favicon.png");
await resize(monoMaster, 48, "public/favicon-48.png");

// Larger surfaces: full brand wordmark from master artwork (no upscale).
await resize(brand, 96, "public/favicon-96.png");
await resize(brand, 180, "public/apple-touch-icon.png");
await resize(brand, 180, "src/app/apple-icon.png");
await resize(brand, 192, "public/icon-192.png");
fs.copyFileSync(brand, path.join(root, "public/icon-512.png"));
fs.copyFileSync(brand, path.join(root, "src/app/icon.png"));
console.log("public/icon-512.png + src/app/icon.png ← brand master");

const ico = await pngToIco([
  path.join(root, "public/favicon-16.png"),
  path.join(root, "public/favicon-32.png"),
  path.join(root, "public/favicon-48.png"),
]);
fs.writeFileSync(path.join(root, "public/favicon.ico"), ico);
console.log("public/favicon.ico", `${ico.length}b`);

fs.writeFileSync(
  path.join(root, "public/favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="НеКвест">
  <rect width="512" height="512" fill="#000000"/>
  <text x="256" y="336" text-anchor="middle" fill="#ffffff"
    font-family="Arial Black, Arial, Helvetica, Segoe UI, sans-serif"
    font-weight="700" font-size="220" letter-spacing="-8">НК</text>
</svg>
`
);
fs.rmSync(monoMaster, { force: true });
console.log("public/favicon.svg ok");
