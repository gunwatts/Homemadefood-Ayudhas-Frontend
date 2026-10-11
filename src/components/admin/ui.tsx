"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { UploadOut } from "@/lib/adminTypes";
import { errorText, useAdmin } from "./AdminContext";

export function SectionHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium" htmlFor={id}>
      <span className="relative inline-flex">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-line transition peer-checked:bg-leaf peer-focus-visible:ring-2 peer-focus-visible:ring-turmeric" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      {label}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "new" | "good" | "bad" | "warn" }) {
  const styles = {
    neutral: "bg-sand text-ink",
    new: "bg-brand text-white",
    good: "bg-green-100 text-green-900",
    bad: "bg-red-100 text-red-900",
    warn: "bg-turmeric-soft text-ink",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>{children}</span>;
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-cream outline-none sm:rounded-2xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-cream px-5 py-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost px-3" aria-label="Close">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-10 text-center text-sm text-muted">{children}</div>;
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return <p className="py-10 text-center text-sm text-muted" role="status">{label}</p>;
}

/** Text input bound to a rupee amount, stored as integer paise. */
export function RupeeInput({ paise, onChange, id, label }: { paise: number; onChange: (p: number) => void; id: string; label: string }) {
  const [text, setText] = useState(paise ? String(paise / 100) : "");
  useEffect(() => {
    if (Math.round(Number(text) * 100) !== paise) setText(paise ? String(paise / 100) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paise]);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">₹</span>
      <input
        id={id}
        aria-label={label}
        className="input pl-7"
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          const v = e.target.value.replace(/[^\d.]/g, "");
          setText(v);
          const n = Math.round(Number(v) * 100);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        placeholder="0"
      />
    </div>
  );
}

/** Upload an image (resized/converted on the server) or paste an https:// link. */
export function ImageField({
  value,
  onChange,
  label = "Image",
  id,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  id: string;
}) {
  const { call, notify } = useAdmin();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await call<UploadOut>("/api/admin/uploads", { form });
      onChange(res.url);
      notify(`Uploaded (${res.width}×${res.height}, ${res.size_kb} KB).`);
    } catch (err) {
      notify(errorText(err), "error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-sand">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-xs text-muted">No image</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <label className={`btn btn-secondary cursor-pointer px-4 ${busy ? "opacity-60" : ""}`}>
              {busy ? "Uploading…" : value ? "Replace" : "Upload photo"}
              <input
                ref={fileRef}
                id={id}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={busy}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
            {value && (
              <button type="button" className="btn btn-ghost px-4" onClick={() => onChange(null)}>
                Remove
              </button>
            )}
          </div>
          <input
            className="input text-sm"
            placeholder="…or paste an https:// image link"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            aria-label={`${label} link`}
          />
        </div>
      </div>
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  children,
  message,
  className = "btn btn-ghost text-red-800",
}: {
  onConfirm: () => void;
  children: ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => window.confirm(message) && onConfirm()}>
      {children}
    </button>
  );
}

export function Labeled({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
