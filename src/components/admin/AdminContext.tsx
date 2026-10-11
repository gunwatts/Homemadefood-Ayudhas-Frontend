"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, apiDownload, apiRequest } from "@/lib/api";
import type { AdminMe } from "@/lib/adminTypes";

interface Toast {
  id: number;
  tone: "success" | "error";
  text: string;
}

interface AdminApi {
  me: AdminMe;
  token: string;
  call: <T>(path: string, opts?: { method?: string; body?: unknown; form?: FormData }) => Promise<T>;
  download: (path: string, fallbackName: string) => Promise<void>;
  notify: (text: string, tone?: "success" | "error") => void;
  logout: () => void;
  setMe: (me: AdminMe) => void;
}

const Ctx = createContext<AdminApi | null>(null);

export function AdminProvider({
  token,
  me: initialMe,
  onLogout,
  children,
}: {
  token: string;
  me: AdminMe;
  onLogout: (reason?: string) => void;
  children: ReactNode;
}) {
  const [me, setMe] = useState(initialMe);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const notify = useCallback((text: string, tone: "success" | "error" = "success") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 7000 : 3500);
  }, []);

  const call = useCallback(
    async <T,>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}) => {
      try {
        return await apiRequest<T>(path, { ...opts, token });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) onLogout("Your session has expired. Please sign in again.");
        throw err;
      }
    },
    [token, onLogout],
  );

  const download = useCallback((path: string, name: string) => apiDownload(path, token, name), [token]);

  const value = useMemo<AdminApi>(
    () => ({ me, token, call, download, notify, logout: () => onLogout(), setMe }),
    [me, token, call, download, notify, onLogout],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              t.tone === "error" ? "bg-red-700 text-white" : "bg-ink text-cream"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useAdmin(): AdminApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdmin outside AdminProvider");
  return ctx;
}

export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    const fieldMsgs = Object.values(err.fields);
    return fieldMsgs.length ? fieldMsgs.join(" ") : err.message;
  }
  return "Something went wrong.";
}
