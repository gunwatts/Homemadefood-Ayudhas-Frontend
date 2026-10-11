"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProductDetail } from "@/components/ProductDetail";

// Client-rendered product page for products added after the last static build.
function FallbackProduct() {
  const slug = useSearchParams().get("slug");
  return <ProductDetail slug={slug || ""} />;
}

export default function ProductFallbackPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center text-muted">Loading product…</div>}>
      <FallbackProduct />
    </Suspense>
  );
}
