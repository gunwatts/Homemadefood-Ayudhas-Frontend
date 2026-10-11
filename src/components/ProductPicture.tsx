"use client";

import { useState } from "react";
import { asset } from "@/lib/config";
import type { Product } from "@/lib/types";

export function placeholderFor(categorySlug: string | null | undefined): string {
  const slug = categorySlug || "";
  if (slug.includes("sweet")) return asset("/placeholders/sweets.svg");
  if (slug.includes("pickle")) return asset("/placeholders/pickles.svg");
  return asset("/placeholders/podis.svg");
}

/** First product photo, or an intentional illustrated placeholder if none/failed. */
export function ProductPicture({
  product,
  index = 0,
  className = "",
  eager = false,
}: {
  product: Pick<Product, "name" | "images" | "category_slug">;
  index?: number;
  className?: string;
  eager?: boolean;
}) {
  const img = product.images[index];
  const [failed, setFailed] = useState(false);
  const src = img && !failed ? img.url : placeholderFor(product.category_slug);
  const alt = img && !failed ? img.alt || product.name : `${product.name} (illustration – photo coming soon)`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      width={800}
      height={600}
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

/** Generic image with a placeholder fallback (for banners, story sections, gallery). */
export function SafeImage({
  src,
  alt,
  fallback,
  className = "",
  eager = false,
}: {
  src: string | null | undefined;
  alt: string;
  fallback: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src && !failed ? src : asset(fallback)}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      width={800}
      height={600}
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
