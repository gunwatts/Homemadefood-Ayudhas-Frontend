import type { MetadataRoute } from "next";
import { SNAPSHOT } from "@/lib/snapshot";
import { BASE_PATH, SITE_URL } from "@/lib/config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `${SITE_URL}${BASE_PATH}`;
  const pages = ["", "products/", "story/", "videos/", "gallery/", "contact/", "privacy/", "terms/"].map((p) => ({
    url: `${base}/${p}`,
    lastModified: SNAPSHOT.generated_at,
  }));
  const products = SNAPSHOT.products.map((p) => ({ url: `${base}/products/${p.slug}/`, lastModified: p.updated_at }));
  return [...pages, ...products];
}
