"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useCatalogue } from "@/lib/catalogue";
import { ProductCard } from "./ProductCard";

export function ProductsView() {
  const { data } = useCatalogue();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const category = params.get("category") || "";
  const [query, setQuery] = useState("");

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.products.filter(
      (p) =>
        (!category || p.category_slug === category) &&
        (!q || `${p.name} ${p.short_description} ${p.category_name ?? ""}`.toLowerCase().includes(q)),
    );
  }, [data.products, category, query]);

  function selectCategory(slug: string) {
    const url = slug ? `${pathname}?category=${encodeURIComponent(slug)}` : pathname;
    router.replace(url, { scroll: false });
  }

  const current = data.categories.find((c) => c.slug === category);

  return (
    <section className="container-page py-10">
      <p className="eyebrow">Catalogue</p>
      <h1 className="mt-2 text-4xl font-semibold">{current ? current.name : "All products"}</h1>
      <p className="mt-3 max-w-2xl text-muted">
        {current?.description ||
          "Prices are product-only, per pack. Add items to your order list and send an order request – we confirm availability and any delivery charge on WhatsApp."}
      </p>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectCategory("")}
            aria-pressed={!category}
            className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-sand aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-white"
          >
            All
          </button>
          {data.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCategory(c.slug)}
              aria-pressed={category === c.slug}
              className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-sand aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-white"
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="md:w-72">
          <label htmlFor="search" className="sr-only">Search products</label>
          <input
            id="search"
            type="search"
            className="input"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>
      {products.length > 0 ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} eager={i < 3} />
          ))}
        </div>
      ) : (
        <div className="card mt-4 p-10 text-center text-muted">
          No products match. Try another category or search term.
        </div>
      )}
    </section>
  );
}
