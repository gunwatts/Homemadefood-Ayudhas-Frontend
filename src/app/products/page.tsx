import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsView } from "@/components/ProductsView";

export const metadata: Metadata = {
  title: "Products",
  description: "Home-made sweets, pickles and podis. Product-only prices per pack; delivery confirmed on WhatsApp.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center text-muted">Loading products…</div>}>
      <ProductsView />
    </Suspense>
  );
}
