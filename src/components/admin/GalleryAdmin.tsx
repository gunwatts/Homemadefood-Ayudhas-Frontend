"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminGallery, UploadOut } from "@/lib/adminTypes";
import { errorText, useAdmin } from "./AdminContext";
import { ConfirmButton, Empty, SectionHeader, Spinner, Toggle } from "./ui";

const SECTIONS = [
  ["product", "Products"],
  ["preparation", "Preparation"],
  ["village", "Village"],
  ["maker", "The maker"],
  ["other", "Other"],
] as const;

export function GalleryAdmin() {
  const { call, notify } = useAdmin();
  const [rows, setRows] = useState<AdminGallery[] | null>(null);
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    call<AdminGallery[]>("/api/admin/gallery").then(setRows).catch((e) => notify(errorText(e), "error"));
  }, [call, notify]);

  async function uploadMany(files: FileList) {
    const list = Array.from(files).slice(0, 20);
    setUploading(list.length);
    for (const file of list) {
      try {
        const form = new FormData();
        form.append("file", file);
        const up = await call<UploadOut>("/api/admin/uploads", { form });
        const row = await call<AdminGallery>("/api/admin/gallery", {
          body: { image_url: up.url, alt_text: "", caption: "", section: "product", visible: true, display_order: (rows?.length ?? 0) + 1 },
        });
        setRows((r) => [...(r ?? []), row]);
      } catch (e) {
        notify(`${file.name}: ${errorText(e)}`, "error");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save(row: AdminGallery) {
    try {
      const saved = await call<AdminGallery>(`/api/admin/gallery/${row.id}`, { method: "PUT", body: row });
      setRows((r) => r?.map((x) => (x.id === saved.id ? saved : x)) ?? null);
      notify("Saved.");
    } catch (e) {
      notify(errorText(e), "error");
    }
  }

  async function remove(row: AdminGallery) {
    try {
      await call(`/api/admin/gallery/${row.id}`, { method: "DELETE" });
      // Free the storage too, if no other page uses this file.
      await call("/api/admin/uploads/delete", { body: { image_url: row.image_url } }).catch(() => undefined);
      setRows((r) => r?.filter((x) => x.id !== row.id) ?? null);
      notify("Photo deleted.");
    } catch (e) {
      notify(errorText(e), "error");
    }
  }

  return (
    <>
      <SectionHeader
        title="Gallery"
        description="Photos of products, preparation, the maker and the village. Use real photos only."
        actions={
          <label className="btn btn-primary cursor-pointer">
            {uploading ? `Uploading ${uploading}…` : "+ Upload photos"}
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading > 0} onChange={(e) => e.target.files && uploadMany(e.target.files)} />
          </label>
        }
      />
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty>No photos yet.</Empty> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((g) => <GalleryItem key={g.id} row={g} onSave={save} onDelete={remove} />)}
        </ul>
      )}
    </>
  );
}

function GalleryItem({ row, onSave, onDelete }: { row: AdminGallery; onSave: (r: AdminGallery) => void; onDelete: (r: AdminGallery) => void }) {
  const [d, setD] = useState(row);
  const dirty = JSON.stringify(d) !== JSON.stringify(row);
  return (
    <li className="card overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={row.image_url} alt={row.alt_text} className="aspect-[4/3] w-full object-cover" />
      <div className="space-y-2 p-3">
        <input className="input text-sm" placeholder="Caption" aria-label="Caption" value={d.caption} onChange={(e) => setD({ ...d, caption: e.target.value })} maxLength={300} />
        <input className="input text-sm" placeholder="Describe the photo (for screen readers)" aria-label="Photo description" value={d.alt_text} onChange={(e) => setD({ ...d, alt_text: e.target.value })} maxLength={200} />
        <div className="flex gap-2">
          <select className="input text-sm" aria-label="Section" value={d.section} onChange={(e) => setD({ ...d, section: e.target.value })}>
            {SECTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input type="number" className="input w-20 text-sm" aria-label="Display order" value={d.display_order} onChange={(e) => setD({ ...d, display_order: Number(e.target.value) || 0 })} />
        </div>
        <div className="flex items-center justify-between">
          <Toggle id={`g-${row.id}`} checked={d.visible} onChange={(v) => setD({ ...d, visible: v })} label="Visible" />
          <div className="flex gap-1">
            <ConfirmButton className="btn btn-ghost px-3 text-xs text-red-800" message="Delete this photo?" onConfirm={() => onDelete(row)}>Delete</ConfirmButton>
            <button type="button" className="btn btn-secondary px-3 text-xs" disabled={!dirty} onClick={() => onSave(d)}>Save</button>
          </div>
        </div>
      </div>
    </li>
  );
}
