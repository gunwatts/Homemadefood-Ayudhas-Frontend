"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart";
import { CatalogueProvider } from "@/lib/catalogue";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CatalogueProvider>
      <CartProvider>{children}</CartProvider>
    </CatalogueProvider>
  );
}
