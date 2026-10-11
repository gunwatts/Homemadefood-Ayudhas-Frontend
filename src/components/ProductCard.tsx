"use client";

import Link from "next/link";
import { productHref } from "@/lib/catalogue";
import { priceRange } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductPicture } from "./ProductPicture";

export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const prices = product.variants.map((v) => v.price_paise);
  const packs = product.variants.map((v) => v.label).join(" · ");
  return (
    <Link
      href={productHref(product.slug)}
      className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-sand">
        <ProductPicture product={product} eager={eager} className="transition duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        {product.category_name && <p className="eyebrow mb-1">{product.category_name}</p>}
        <h3 className="text-lg font-semibold text-ink group-hover:text-brand">{product.name}</h3>
        {product.short_description && <p className="mt-1 line-clamp-2 text-sm text-muted">{product.short_description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-base font-bold text-ink">{priceRange(prices)}</p>
            <p className="text-xs text-muted">{packs}</p>
          </div>
          <span className="text-sm font-semibold text-brand">View details →</span>
        </div>
      </div>
    </Link>
  );
}
