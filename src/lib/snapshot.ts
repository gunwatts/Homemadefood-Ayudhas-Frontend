// Build-time catalogue snapshot (written by scripts/fetch-catalogue.mjs).
// Plain module (no "use client") so both server and client components can import it.
import snapshot from "@/data/catalogue.json";
import type { Catalogue } from "./types";

export const SNAPSHOT = snapshot as unknown as Catalogue;
const SNAPSHOT_SLUGS = new Set(SNAPSHOT.products.map((p) => p.slug));

/** Statically generated product pages exist only for products in the build snapshot.
 *  Products added after the last build use the client-rendered fallback page. */
export function productHref(slug: string): string {
  return SNAPSHOT_SLUGS.has(slug) ? `/products/${slug}/` : `/product/?slug=${encodeURIComponent(slug)}`;
}
