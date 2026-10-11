"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AdminProduct, AdminVideo } from "@/lib/adminTypes";
import { errorText, useAdmin } from "./AdminContext";
import { Badge, ConfirmButton, Empty, ImageField, Labeled, Modal, SectionHeader, Spinner, Toggle } from "./ui";

type Draft = Omit<AdminVideo, "id" | "youtube_id"> & { id?: string };

export function VideosAdmin() {
  const { call, notify } = useAdmin();
  const [rows, setRows] = useState<AdminVideo[] | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([call<AdminVideo[]>("/api/admin/videos"), call<AdminProduct[]>("/api/admin/products")])
      .then(([v, p]) => {
        setRows(v);
        setProducts(p);
      })
      .catch((e) => notify(errorText(e), "error"));
  }, [call, notify]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    try {
      const saved = await call<AdminVideo>(editing.id ? `/api/admin/videos/${editing.id}` : "/api/admin/videos", {
        method: editing.id ? "PUT" : "POST",
        body: editing,
      });
      setRows((r) => (editing.id ? r?.map((x) => (x.id === saved.id ? saved : x)) ?? null : [...(r ?? []), saved]));
      setEditing(null);
      notify("Video saved.");
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function remove(id: string) {
    try {
      await call(`/api/admin/videos/${id}`, { method: "DELETE" });
      setRows((r) => r?.filter((x) => x.id !== id) ?? null);
      setEditing(null);
      notify("Video removed.");
    } catch (err) {
      notify(errorText(err), "error");
    }
  }

  const blank: Draft = { title: "", youtube_url: "", thumbnail_url: null, description: "", related_product_id: null, visible: true, featured: false, display_order: rows?.length ?? 0 };

  return (
    <>
      <SectionHeader
        title="Videos"
        description="Paste links to your public YouTube videos. Videos are embedded, not uploaded – only use videos you own or have permission to share."
        actions={<button type="button" className="btn btn-primary" onClick={() => setEditing(blank)}>+ Add video</button>}
      />
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty>No videos yet.</Empty> : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((v) => (
            <li key={v.id} className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.thumbnail_url || `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`} alt="" className="aspect-video w-full object-cover" />
              <div className="flex items-start justify-between gap-2 p-4">
                <div>
                  <p className="font-semibold">{v.title}</p>
                  <div className="mt-1 flex gap-1.5">
                    {v.visible ? <Badge tone="good">Visible</Badge> : <Badge tone="bad">Hidden</Badge>}
                    {v.featured && <Badge tone="warn">Home page</Badge>}
                  </div>
                </div>
                <button type="button" className="btn btn-secondary px-4" onClick={() => setEditing({ ...v })}>Edit</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit video" : "Add video"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Labeled id="v-title" label="Title"><input id="v-title" className="input" required maxLength={150} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Labeled>
            <Labeled id="v-url" label="YouTube link" hint="e.g. https://www.youtube.com/watch?v=… or https://youtu.be/…">
              <input id="v-url" className="input" required value={editing.youtube_url} onChange={(e) => setEditing({ ...editing, youtube_url: e.target.value })} />
            </Labeled>
            <Labeled id="v-desc" label="Short description"><textarea id="v-desc" className="input" rows={2} maxLength={1000} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Labeled>
            <Labeled id="v-product" label="Show on product page (optional)">
              <select id="v-product" className="input" value={editing.related_product_id ?? ""} onChange={(e) => setEditing({ ...editing, related_product_id: e.target.value || null })}>
                <option value="">None</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Labeled>
            <ImageField id="v-thumb" label="Custom thumbnail (optional)" value={editing.thumbnail_url} onChange={(u) => setEditing({ ...editing, thumbnail_url: u })} />
            <Labeled id="v-order" label="Display order"><input id="v-order" type="number" className="input" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) || 0 })} /></Labeled>
            <div className="flex flex-wrap gap-6">
              <Toggle id="v-vis" checked={editing.visible} onChange={(v) => setEditing({ ...editing, visible: v })} label="Visible" />
              <Toggle id="v-feat" checked={editing.featured} onChange={(v) => setEditing({ ...editing, featured: v })} label="Show on home page" />
            </div>
            {error && <p className="field-error" role="alert">{error}</p>}
            <div className="flex justify-between border-t border-line pt-4">
              {editing.id ? <ConfirmButton message="Remove this video from the site?" onConfirm={() => remove(editing.id!)}>Delete</ConfirmButton> : <span />}
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
