"use client";

// The "order list" — a cart-like selection kept in the visitor's browser only.
// Prices are always re-resolved from the live catalogue and recalculated by the server.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCatalogue } from "./catalogue";
import type { Product, Variant } from "./types";

export interface CartLine {
  variantId: string;
  productSlug: string;
  quantity: number;
}

export interface ResolvedLine extends CartLine {
  product?: Product;
  variant?: Variant;
  lineTotal: number;
  available: boolean;
}

interface CartApi {
  lines: CartLine[];
  resolved: ResolvedLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  add: (productSlug: string, variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const MAX_QTY = 50;
const STORAGE_KEY = "ayudhas:order-list";
const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { data } = useCatalogue();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLines(
            parsed
              .filter((l) => l && typeof l.variantId === "string" && typeof l.productSlug === "string")
              .map((l) => ({ ...l, quantity: Math.min(MAX_QTY, Math.max(1, Number(l.quantity) || 1)) })),
          );
        }
      }
    } catch {
      /* storage unavailable */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

  const add = useCallback((productSlug: string, variantId: string, quantity = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.variantId === variantId);
      if (found) {
        return prev.map((l) =>
          l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l,
        );
      }
      return [...prev, { productSlug, variantId, quantity: Math.min(MAX_QTY, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, Math.max(1, quantity)) } : l)),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(() => {
    const resolved: ResolvedLine[] = lines.map((l) => {
      const product = data.products.find((p) => p.variants.some((v) => v.id === l.variantId));
      const variant = product?.variants.find((v) => v.id === l.variantId);
      return {
        ...l,
        product,
        variant,
        available: Boolean(product && variant),
        lineTotal: variant ? variant.price_paise * l.quantity : 0,
      };
    });
    return {
      lines,
      resolved,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: resolved.reduce((n, l) => n + l.lineTotal, 0),
      hydrated,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, data, hydrated, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const MAX_LINE_QTY = MAX_QTY;
