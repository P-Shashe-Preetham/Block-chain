import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const assetsDirectory = resolve("apps/web/dist/assets");
const limits = Object.freeze({
  javascriptRawBytes: 450 * 1024,
  javascriptGzipBytes: 128 * 1024,
  cssRawBytes: 16 * 1024,
});

const assets = await Promise.all((await readdir(assetsDirectory)).map(async (name) => ({
  name,
  content: await readFile(resolve(assetsDirectory, name)),
})));
const javascript = assets.filter(({ name }) => name.endsWith(".js"));
const stylesheets = assets.filter(({ name }) => name.endsWith(".css"));
if (javascript.length === 0 || stylesheets.length === 0) {
  throw new Error("Expected built JavaScript and CSS assets; run pnpm build:web before this check.");
}

const sizeOf = (items) => items.reduce((total, { content }) => total + content.length, 0);
const javascriptRawBytes = sizeOf(javascript);
const javascriptGzipBytes = javascript.reduce((total, { content }) => total + gzipSync(content).length, 0);
const cssRawBytes = sizeOf(stylesheets);
const measurements = { javascriptRawBytes, javascriptGzipBytes, cssRawBytes };
const failures = Object.entries(measurements)
  .filter(([name, value]) => value > limits[name])
  .map(([name, value]) => `${name}=${value} exceeds ${limits[name]}`);

console.log(JSON.stringify({ measurements, limits }, null, 2));
if (failures.length > 0) throw new Error(`Web bundle budget failed: ${failures.join("; ")}`);
