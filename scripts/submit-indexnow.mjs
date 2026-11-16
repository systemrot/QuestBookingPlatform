import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const host = "nekvest.ru";
const keyPath = path.join(root, "public", "indexnow-key.txt");

function readOrCreateKey() {
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, "utf8").trim();
  }
  const key = crypto.randomBytes(16).toString("hex");
  fs.writeFileSync(keyPath, key, "utf8");
  // IndexNow expects https://host/{key}.txt with the key as body.
  fs.writeFileSync(path.join(root, "public", `${key}.txt`), key, "utf8");
  return key;
}

const key = readOrCreateKey();
const keyFile = path.join(root, "public", `${key}.txt`);
if (!fs.existsSync(keyFile)) {
  fs.writeFileSync(keyFile, key, "utf8");
}

const urlList = [
  `https://${host}/`,
  `https://${host}/about`,
  `https://${host}/privacy`,
  `https://${host}/terms`,
];

const body = JSON.stringify({
  host,
  key,
  keyLocation: `https://${host}/${key}.txt`,
  urlList,
});

const endpoints = [
  "https://yandex.com/indexnow",
  "https://api.indexnow.org/indexnow",
];

console.log("key:", key);
console.log("key file:", `/${key}.txt`);

for (const endpoint of endpoints) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body,
  });
  const text = await res.text();
  console.log(endpoint, res.status, text.slice(0, 200));
}
