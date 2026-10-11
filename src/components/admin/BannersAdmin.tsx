"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AdminBanner } from "@/lib/adminTypes";
import { errorText, useAdmin } from "./AdminContext";
import { Badge, ConfirmButton, Empty, ImageField, Labeled, Modal, SectionHeader, Spinner, Toggle } from "./ui";

type Draft = Omit<AdminBanner, "id"> & { id?: string };

export function BannersAdmin() {
  const { call, notify } = useAdmin();
  const [rows, setRows] = useState<AdminBanner[] | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    call<AdminBanner[]>("/api/admin/banners").then(setRows).catch((e) => notify(errorText(e), "error"));
  }, [call, notify]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    try {
      const saved = await call<AdminBanner>(editing.id ? `/api/admin/banners/${editing.id}` : "/api/admin/banners", {
        method: editing.id ? "PUT" : "POST",
        body: editing,
      });
      setRows((r) => (editing.id ? r?.map((x) => (x.id === saved.id ? saved : x)) ?? null : [...(r ?? []), saved]));
      setEditing(null);
      notify("Banner saved.");
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function remove(id: string) {
    try {
      await call(`/api/admin/banners/${id}`, { method: "DELETE" });
      setRows((r) => r?.filter((x) => x.id !== id) ?? null);
      setEditing(null);
      notify("Banner deleted.");
    } catch (err) {
      notify(errorText(err), "error");
    }
  }

  return (
    <>
      <SectionHeader
        title="Banners"
        description="Promotional banners on the home page (up to two are shown), e.g. festival order dates."
        actions={<button type="button" className="btn btn-primary" onClick={() => setEditing({ title: "", subtitle: "", image_url: null, link_url: "/products/", link_label: "Browse products", visible: true, display_order: rows?.length ?? 0 })}>+ Add banner</button>}
      />
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty>No banners yet.</Empty> : (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li key={b.id} className="card flex items-center gap-4 p-3">
              <span className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {b.image_url && <img src={b.image_url} alt="" className="h-full w-full object-cover" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{b.title}</p>
                <p className="truncate text-xs text-muted">{b.subtitle}</p>
                {!b.visible && <Badge tone="bad">Hidden</Badge>}
              </div>
              <button type="button" className="btn btn-secondary px-4" onClick={() => setEditing({ ...b })}>Edit</button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit banner" : "Add banner"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Labeled id="b-title" label="Heading"><input id="b-title" className="input" required maxLength={150} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Labeled>
            <Labeled id="b-sub" label="Text"><textarea id="b-sub" className="input" rows={2} maxLength={300} value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></Labeled>
            <ImageField id="b-img" label="Background photo (optional)" value={editing.image_url} onChange={(u) => setEditing({ ...editing, image_url: u })} />
            <div className="grid grid-cols-2 gap-3">
              <Labeled id="b-link" label="Button link" hint="e.g. /products/ or /contact/"><input id="b-link" className="input" value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value || null })} /></Labeled>
              <Labeled id="b-label" label="Button text"><input id="b-label" className="input" maxLength={60} value={editing.link_label ?? ""} onChange={(e) => setEditing({ ...editing, link_label: e.target.value || null })} /></Labeled>
            </div>
            <Labeled id="b-order" label="Display order"><input id="b-order" type="number" className="input" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) || 0 })} /></Labeled>
            <Toggle id="b-vis" checked={editing.visible} onChange={(v) => setEditing({ ...editing, visible: v })} label="Visible" />
            {error && <p className="field-error" role="alert">{error}</p>}
            <div className="flex justify-between border-t border-line pt-4">
              {editing.id ? <ConfirmButton message="Delete this banner?" onConfirm={() => remove(editing.id!)}>Delete</ConfirmButton> : <span />}
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
