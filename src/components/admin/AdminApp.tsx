"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import type { AdminMe } from "@/lib/adminTypes";
import { API_BASE } from "@/lib/config";
import { Alert } from "../forms";
import { AdminProvider, useAdmin } from "./AdminContext";
import { BannersAdmin } from "./BannersAdmin";
import { CategoriesAdmin } from "./CategoriesAdmin";
import { ContentAdmin } from "./ContentAdmin";
import { Dashboard } from "./Dashboard";
import { EnquiriesInbox } from "./EnquiriesInbox";
import { GalleryAdmin } from "./GalleryAdmin";
import { OrdersInbox } from "./OrdersInbox";
import { ProductsAdmin } from "./ProductsAdmin";
import { SettingsAdmin } from "./SettingsAdmin";
import { VideosAdmin } from "./VideosAdmin";

// The admin token lives in sessionStorage: it is cleared when the browser tab closes and is
// sent only in the Authorization header to the API (never as a cookie).
const TOKEN_KEY = "ayudhas:admin-token";

export const SECTIONS = [
  { id: "dashboard", label: "Dashboard", group: "Inbox" },
  { id: "orders", label: "Order requests", group: "Inbox" },
  { id: "enquiries", label: "Callback requests", group: "Inbox" },
  { id: "products", label: "Products", group: "Catalogue" },
  { id: "categories", label: "Categories", group: "Catalogue" },
  { id: "videos", label: "Videos", group: "Catalogue" },
  { id: "banners", label: "Banners", group: "Catalogue" },
  { id: "gallery", label: "Gallery", group: "Catalogue" },
  { id: "content", label: "Site text & settings", group: "Site" },
  { id: "settings", label: "Account & data", group: "Site" },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];

export function AdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<AdminMe | null>(null);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
    if (!stored) {
      setChecking(false);
      return;
    }
    apiRequest<AdminMe>("/api/admin/me", { token: stored })
      .then((m) => {
        setToken(stored);
        setMe(m);
      })
      .catch(() => sessionStorage.removeItem(TOKEN_KEY))
      .finally(() => setChecking(false));
  }, []);

  const onLogout = useCallback(
    (reason?: string) => {
      const t = token;
      if (t && !reason) apiRequest("/api/admin/logout", { method: "POST", token: t }).catch(() => undefined);
      try {
        sessionStorage.removeItem(TOKEN_KEY);
      } catch {
        /* ignore */
      }
      setToken(null);
      setMe(null);
      setNotice(reason ?? "You have signed out.");
    },
    [token],
  );

  if (checking) return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>;

  if (!token || !me) {
    return (
      <Login
        notice={notice}
        onSuccess={(t, m) => {
          try {
            sessionStorage.setItem(TOKEN_KEY, t);
          } catch {
            /* ignore */
          }
          setToken(t);
          setMe(m);
          setNotice(null);
        }}
      />
    );
  }

  return (
    <AdminProvider token={token} me={me} onLogout={onLogout}>
      <AdminLayout />
    </AdminProvider>
  );
}

function Login({ notice, onSuccess }: { notice: string | null; onSuccess: (token: string, me: AdminMe) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequest<{ token: string; admin: AdminMe }>("/api/admin/login", {
        body: { email, password, totp_code: code || null },
      });
      onSuccess(res.token, res.admin);
    } catch (err) {
      const e2 = err as ApiError;
      if (e2.code === "totp_required") setNeedCode(true);
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-3xl font-semibold">Ayudhas</p>
        <p className="mt-1 text-center text-sm text-muted">Owner admin</p>
        <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
          {notice && <Alert tone="info">{notice}</Alert>}
          {!API_BASE && <Alert tone="error">NEXT_PUBLIC_API_BASE_URL is not configured for this build.</Alert>}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {needCode && (
            <div>
              <label htmlFor="code" className="label">Authenticator code</label>
              <input id="code" inputMode="numeric" autoComplete="one-time-code" className="input tracking-widest" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
            </div>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-brand hover:underline">← Back to website</Link>
        </p>
      </div>
    </main>
  );
}

function AdminLayout() {
  const { me, logout } = useAdmin();
  const [section, setSection] = useState<SectionId>("dashboard");

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1) as SectionId;
      if (SECTIONS.some((s) => s.id === h)) setSection(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const go = (id: SectionId) => {
    setSection(id);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  };

  const groups = Array.from(new Set(SECTIONS.map((s) => s.group)));

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-line bg-paper lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5 lg:py-6">
          <div>
            <p className="font-display text-xl font-semibold">Ayudhas admin</p>
            <p className="truncate text-xs text-muted">{me.email}</p>
          </div>
          <div className="flex gap-2 lg:mt-4">
            <Link href="/" target="_blank" className="btn btn-ghost px-3 text-xs">View site ↗</Link>
            <button type="button" onClick={logout} className="btn btn-ghost px-3 text-xs">Sign out</button>
          </div>
        </div>
        <nav aria-label="Admin sections" className="overflow-x-auto px-2 pb-3 lg:px-3">
          <ul className="flex gap-1 lg:block lg:space-y-4">
            {groups.map((g) => (
              <li key={g} className="contents lg:block">
                <p className="hidden px-3 pb-1 text-xs font-bold tracking-wider text-muted uppercase lg:block">{g}</p>
                <ul className="contents lg:block lg:space-y-0.5">
                  {SECTIONS.filter((s) => s.group === g).map((s) => (
                    <li key={s.id} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => go(s.id)}
                        aria-current={section === s.id ? "page" : undefined}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap hover:bg-sand aria-[current=page]:bg-brand aria-[current=page]:text-white"
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl">
          {section === "dashboard" && <Dashboard go={go} />}
          {section === "orders" && <OrdersInbox />}
          {section === "enquiries" && <EnquiriesInbox />}
          {section === "products" && <ProductsAdmin />}
          {section === "categories" && <CategoriesAdmin />}
          {section === "videos" && <VideosAdmin />}
          {section === "banners" && <BannersAdmin />}
          {section === "gallery" && <GalleryAdmin />}
          {section === "content" && <ContentAdmin />}
          {section === "settings" && <SettingsAdmin />}
        </div>
      </main>
    </div>
  );
}
