"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "./api";
import { SNAPSHOT } from "./snapshot";
import type { Catalogue, ContentBlock, Product } from "./types";

export { productHref, SNAPSHOT } from "./snapshot";

type Status = "snapshot" | "live" | "offline";

interface CatalogueState {
  data: Catalogue;
  status: Status;
}

const CatalogueContext = createContext<CatalogueState>({ data: SNAPSHOT, status: "snapshot" });

let liveCache: Catalogue | null = null;
const CACHE_KEY = "ayudhas:catalogue";

export function CatalogueProvider({ children }: { children: ReactNode }) {
  // First render always uses the build snapshot so static HTML and hydration match.
  const [state, setState] = useState<CatalogueState>({ data: SNAPSHOT, status: "snapshot" });

  useEffect(() => {
    let cancelled = false;
    if (liveCache) {
      setState({ data: liveCache, status: "live" });
    } else {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) setState({ data: JSON.parse(cached), status: "snapshot" });
      } catch {
        /* storage unavailable */
      }
    }
    apiRequest<Catalogue>("/api/catalogue")
      .then((data) => {
        if (cancelled) return;
        liveCache = data;
        setState({ data, status: "live" });
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, status: "offline" }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <CatalogueContext.Provider value={state}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue() {
  return useContext(CatalogueContext);
}

const EMPTY_BLOCK: ContentBlock = { title: "", body: "", image_url: null };

export function useContent() {
  const { data } = useCatalogue();
  return useMemo(() => {
    const block = (key: string): ContentBlock => data.content[key] || SNAPSHOT.content[key] || EMPTY_BLOCK;
    const text = (key: string) => block(key).body.trim();
    return {
      block,
      text,
      flag: (key: string) => text(key).toLowerCase() === "true",
      businessName: text("business_name") || "Ayudhas",
      whatsapp: text("whatsapp_number"),
    };
  }, [data]);
}

export function useProduct(slug: string | null | undefined): { product: Product | undefined; status: Status } {
  const { data, status } = useCatalogue();
  const product = slug ? data.products.find((p) => p.slug === slug) : undefined;
  return { product, status };
}
