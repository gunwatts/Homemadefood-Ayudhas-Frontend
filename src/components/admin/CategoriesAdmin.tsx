"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AdminCategory } from "@/lib/adminTypes";
import { errorText, useAdmin } from "./AdminContext";
import { Badge, ConfirmButton, Empty, Labeled, Modal, SectionHeader, Spinner, Toggle } from "./ui";

type Draft = Omit<AdminCategory, "id"> & { id?: string };

export function CategoriesAdmin() {
  const { call, notify } = useAdmin();
  const [rows, setRows] = useState<AdminCategory[] | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);

  useEffect(() => {
    call<AdminCategory[]>("/api/admin/categories").then(setRows).catch((e) => notify(errorText(e), "error"));
  }, [call, notify]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      const saved = await call<AdminCategory>(editing.id ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", {
        method: editing.id ? "PUT" : "POST",
        body: { ...editing, slug: editing.slug || null },
      });
      setRows((r) => (editing.id ? r?.map((x) => (x.id === saved.id ? saved : x)) ?? null : [...(r ?? []), saved]));
      setEditing(null);
      notify("Category saved.");
    } catch (err) {
      notify(errorText(err), "error");
    }
  }

  async function remove(id: string) {
    try {
      await call(`/api/admin/categories/${id}`, { method: "DELETE" });
      setRows((r) => r?.filter((x) => x.id !== id) ?? null);
      setEditing(null);
      notify("Category deleted. Its products are kept without a category.");
    } catch (err) {
      notify(errorText(err), "error");
    }
  }

  return (
    <>
      <SectionHeader
        title="Categories"
        description="Group products, e.g. Pickles, Sweets, Podis."
        actions={<button type="button" className="btn btn-primary" onClick={() => setEditing({ name: "", slug: "", description: "", visible: true, display_order: (rows?.length ?? 0) })}>+ Add category</button>}
      />
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty>No categories yet.</Empty> : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id} className="card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{c.name} {!c.visible && <Badge tone="bad">Hidden</Badge>}</p>
                <p className="text-xs text-muted">/{c.slug} · order {c.display_order}</p>
              </div>
              <button type="button" className="btn btn-secondary px-4" onClick={() => setEditing({ ...c })}>Edit</button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <Modal title={editing.id ? "Edit category" : "Add category"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Labeled id="c-name" label="Name"><input id="c-name" className="input" required maxLength={80} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Labeled>
            <Labeled id="c-desc" label="Description (optional)"><textarea id="c-desc" className="input" rows={2} maxLength={500} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Labeled>
            <div className="grid grid-cols-2 gap-3">
              <Labeled id="c-slug" label="Slug" hint="Blank = from name"><input id="c-slug" className="input" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Labeled>
              <Labeled id="c-order" label="Display order"><input id="c-order" type="number" className="input" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) || 0 })} /></Labeled>
            </div>
            <Toggle id="c-vis" checked={editing.visible} onChange={(v) => setEditing({ ...editing, visible: v })} label="Visible" />
            <div className="flex justify-between border-t border-line pt-4">
              {editing.id ? <ConfirmButton message="Delete this category? Products in it are kept." onConfirm={() => remove(editing.id!)}>Delete</ConfirmButton> : <span />}
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
