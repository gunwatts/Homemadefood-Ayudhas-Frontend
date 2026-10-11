import type { Metadata } from "next";
import { ProductDetail } from "@/components/ProductDetail";
import { SNAPSHOT } from "@/lib/snapshot";

// Static export: one HTML page per product in the build snapshot. Products added later
// are served by /product/?slug=… until the next site build.
export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = SNAPSHOT.products.map((p) => ({ slug: p.slug }));
  return slugs.length ? slugs : [{ slug: "unavailable" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = SNAPSHOT.products.find((x) => x.slug === slug);
  if (!p) return { title: "Product" };
  return {
    title: p.name,
    description: p.short_description || p.description.slice(0, 160),
    alternates: { canonical: `/products/${p.slug}/` },
    openGraph: { title: p.name, description: p.short_description, images: p.images[0] ? [p.images[0].url] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = SNAPSHOT.products.find((x) => x.slug === slug);
  const jsonLd = p && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.short_description || p.description,
    image: p.images.map((i) => i.url),
    category: p.category_name ?? undefined,
  };
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />}
      <ProductDetail slug={slug} />
    </>
  );
}
