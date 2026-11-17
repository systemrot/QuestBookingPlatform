import fs from "node:fs";

const [,, cdpPath, outPath] = process.argv;
if (!cdpPath || !outPath) {
  console.error("Usage: node write-cdp-image.mjs <cdp-json> <out.jpg>");
  process.exit(1);
}
const j = JSON.parse(fs.readFileSync(cdpPath, "utf8"));
const v = j.result?.result?.value ?? j.result?.value ?? j;
if (!v?.b64) {
  console.error("no b64", v);
  process.exit(1);
}
fs.writeFileSync(outPath, Buffer.from(v.b64, "base64"));
console.log("wrote", outPath, fs.statSync(outPath).size, v.ctype);
