// Build-time step: download the public catalogue from the API and save it as a snapshot.
//
// The snapshot is used to pre-render every page as static HTML (fast, search-engine
// friendly). In the browser, pages then refresh from the live API so price/visibility
// changes made in the admin show up without a rebuild.
//
// If the API cannot be reached, the existing committed snapshot is kept so the build
// still works (set REQUIRE_LIVE_CATALOGUE=1 to fail instead).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "../src/data/catalogue.json");

function loadEnvFile(name) {
  const file = resolve(here, "..", name);
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const api = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const strict = process.env.REQUIRE_LIVE_CATALOGUE === "1";

async function main() {
  if (!api) {
    console.warn("[catalogue] NEXT_PUBLIC_API_BASE_URL is not set; using the existing snapshot.");
    return fallback();
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`${api}/api/catalogue`, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.products) || typeof data.content !== "object") throw new Error("Unexpected response shape");
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(data, null, 2) + "\n");
    console.log(`[catalogue] Saved snapshot: ${data.products.length} products, ${data.videos.length} videos.`);
  } catch (err) {
    console.warn(`[catalogue] Could not fetch ${api}/api/catalogue (${err.message}).`);
    if (strict) process.exit(1);
    fallback();
  } finally {
    clearTimeout(timer);
  }
}

function fallback() {
  if (existsSync(target)) {
    console.warn("[catalogue] Keeping the existing snapshot in src/data/catalogue.json.");
    return;
  }
  const empty = { generated_at: new Date().toISOString(), content: {}, categories: [], products: [], videos: [], banners: [], gallery: [] };
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(empty, null, 2) + "\n");
  console.warn("[catalogue] Wrote an empty snapshot.");
}

main();
