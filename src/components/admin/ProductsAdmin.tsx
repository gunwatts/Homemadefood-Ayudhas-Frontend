"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { AdminCategory, AdminImage, AdminProduct, AdminVariant } from "@/lib/adminTypes";
import { priceRange } from "@/lib/format";
import { placeholderFor } from "../ProductPicture";
import { errorText, useAdmin } from "./AdminContext";
import { PublishNote } from "./PublishNote";
import { Badge, ConfirmButton, Empty, ImageField, Labeled, Modal, RupeeInput, SectionHeader, Spinner, Toggle } from "./ui";

type Draft = Omit<AdminProduct, "id" | "created_at" | "updated_at" | "slug"> & { id?: string; slug: string };

const EMPTY: Draft = {
  name: "",
  slug: "",
  short_description: "",
  description: "",
  category_id: null,
  ingredients_text: "",
  allergen_text: "",
  storage_text: "",
  shelf_life_text: "",
  preparation_text: "",
  price_note: "Product-only price per pack. Delivery charges, if any, are extra and confirmed on WhatsApp.",
  visible: false,
  featured: false,
  display_order: 0,
  variants: [{ label: "", price_paise: 0, visible: true }],
  images: [],
};

function toPayload(d: Draft) {
  return {
    ...d,
    slug: d.slug || null,
    variants: d.variants.filter((v) => v.label.trim()),
    images: d.images.filter((i) => i.image_url.trim()).map((i) => ({ image_url: i.image_url, alt_text: i.alt_text })),
  };
}

export function ProductsAdmin() {
  const { call, notify } = useAdmin();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [editing, setEditing] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([call<AdminProduct[]>("/api/admin/products"), call<AdminCategory[]>("/api/admin/categories")]);
      setProducts(p);
      setCategories(c);
    } catch (e) {
      notify(errorText(e), "error");
    }
  }, [call, notify]);

  useEffect(() => {
    load();
  }, [load]);

  async function quickToggle(p: AdminProduct, field: "visible" | "featured") {
    try {
      const updated = await call<AdminProduct>(`/api/admin/products/${p.id}`, {
        method: "PUT",
        body: toPayload({ ...p, [field]: !p[field] }),
      });
      setProducts((list) => list?.map((x) => (x.id === p.id ? updated : x)) ?? null);
      notify(field === "visible" ? (updated.visible ? "Product is now visible." : "Product hidden from the site.") : "Saved.");
    } catch (e) {
      notify(errorText(e), "error");
    }
  }

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "No category";
  const catSlug = (id: string | null) => categories.find((c) => c.id === id)?.slug ?? null;

  return (
    <>
      <SectionHeader
        title="Products"
        description="Hide products that are out of stock or out of season instead of deleting them – past requests keep their details either way."
        actions={<button type="button" className="btn btn-primary" onClick={() => setEditing({ ...EMPTY, variants: [{ label: "", price_paise: 0, visible: true }] })}>+ Add product</button>}
      />
      <PublishNote />
      {!products ? (
        <Spinner />
      ) : products.length === 0 ? (
        <Empty>No products yet. Add your first product.</Empty>
      ) : (
        <ul className="mt-4 space-y-3">
          {products.map((p) => (
            <li key={p.id} className={`card flex flex-col gap-3 p-3 sm:flex-row sm:items-center ${p.visible ? "" : "opacity-70"}`}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]?.image_url || placeholderFor(catSlug(p.category_id))} alt="" className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">
                    {catName(p.category_id)} · {priceRange(p.variants.filter((v) => v.visible).map((v) => v.price_paise)) || "no price"} · {p.variants.length} pack size(s)
                  </p>
                  <div className="mt-1 flex gap-1.5">
                    {p.visible ? <Badge tone="good">Visible</Badge> : <Badge tone="bad">Hidden</Badge>}
                    {p.featured && <Badge tone="warn">Featured</Badge>}
                    {p.images.length === 0 && <Badge>No photo</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Toggle id={`vis-${p.id}`} checked={p.visible} onChange={() => quickToggle(p, "visible")} label="Visible" />
                <button type="button" className="btn btn-secondary px-4" onClick={() => setEditing({ ...p })}>Edit</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ProductEditor
          draft={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setProducts((list) => (isNew ? [...(list ?? []), saved] : list?.map((x) => (x.id === saved.id ? saved : x)) ?? null));
            setEditing(null);
          }}
          onDeleted={(id) => {
            setProducts((list) => list?.filter((x) => x.id !== id) ?? null);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function ProductEditor({
  draft: initial,
  categories,
  onClose,
  onSaved,
  onDeleted,
}: {
  draft: Draft;
  categories: AdminCategory[];
  onClose: () => void;
  onSaved: (p: AdminProduct, isNew: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const { call, notify } = useAdmin();
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setVariant = (i: number, v: Partial<AdminVariant>) => set("variants", d.variants.map((x, j) => (j === i ? { ...x, ...v } : x)));
  const setImage = (i: number, v: Partial<AdminImage>) => set("images", d.images.map((x, j) => (j === i ? { ...x, ...v } : x)));
  const moveImage = (i: number, dir: -1 | 1) => {
    const imgs = [...d.images];
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    set("images", imgs);
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors(null);
    try {
      const isNew = !d.id;
      const saved = await call<AdminProduct>(isNew ? "/api/admin/products" : `/api/admin/products/${d.id}`, {
        method: isNew ? "POST" : "PUT",
        body: toPayload(d),
      });
      notify(isNew ? "Product added." : "Product saved.");
      onSaved(saved, isNew);
    } catch (err) {
      setErrors(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!d.id) return;
    try {
      await call(`/api/admin/products/${d.id}`, { method: "DELETE" });
      notify("Product deleted.");
      onDeleted(d.id);
    } catch (err) {
      notify(errorText(err), "error");
    }
  }

  const ta = (k: keyof Draft, label: string, hint?: string, rows = 3) => (
    <Labeled id={`p-${String(k)}`} label={label} hint={hint}>
      <textarea id={`p-${String(k)}`} className="input" rows={rows} value={(d[k] as string) ?? ""} onChange={(e) => set(k, e.target.value as never)} />
    </Labeled>
  );

  return (
    <Modal title={d.id ? `Edit: ${initial.name}` : "Add product"} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled id="p-name" label="Product name">
            <input id="p-name" className="input" value={d.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} />
          </Labeled>
          <Labeled id="p-cat" label="Category">
            <select id="p-cat" className="input" value={d.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Labeled>
        </div>
        <Labeled id="p-short" label="Short description" hint="One line shown on product cards.">
          <input id="p-short" className="input" value={d.short_description} onChange={(e) => set("short_description", e.target.value)} maxLength={300} />
        </Labeled>
        {ta("description", "Full description", "Blank line = new paragraph. Lines starting with '- ' become bullet points.", 4)}

        <fieldset className="card p-4">
          <legend className="px-1 text-sm font-bold">Pack sizes &amp; product-only prices</legend>
          <p className="mb-3 text-xs text-muted">Enter the product price only – never include delivery. Customers see these prices.</p>
          <div className="space-y-2">
            {d.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_96px_auto_auto] items-center gap-2 sm:grid-cols-[1fr_140px_auto_auto]">
                <input className="input" aria-label={`Pack size ${i + 1}`} placeholder="e.g. 500 g" value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} maxLength={60} />
                <RupeeInput id={`vp-${i}`} label={`Price for pack ${i + 1}`} paise={v.price_paise} onChange={(p) => setVariant(i, { price_paise: p })} />
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" className="accent-brand" checked={v.visible} onChange={(e) => setVariant(i, { visible: e.target.checked })} /> Show
                </label>
                <button type="button" className="btn btn-ghost px-3 text-red-800" aria-label={`Remove pack ${i + 1}`} onClick={() => set("variants", d.variants.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost mt-2 px-3 text-brand" onClick={() => set("variants", [...d.variants, { label: "", price_paise: 0, visible: true }])}>+ Add pack size</button>
        </fieldset>

        <fieldset className="card p-4">
          <legend className="px-1 text-sm font-bold">Photos</legend>
          <p className="mb-3 text-xs text-muted">Use real photos of your products. The first photo is the main one. Photos are resized and compressed automatically.</p>
          <div className="space-y-4">
            {d.images.map((img, i) => (
              <div key={i} className="rounded-xl border border-line p-3">
                <ImageField id={`pi-${i}`} label={`Photo ${i + 1}${i === 0 ? " (main)" : ""}`} value={img.image_url || null} onChange={(url) => setImage(i, { image_url: url ?? "" })} />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input className="input flex-1 text-sm" placeholder="Describe the photo for screen readers, e.g. 'Avakaya in a glass jar'" aria-label={`Photo ${i + 1} description`} value={img.alt_text} onChange={(e) => setImage(i, { alt_text: e.target.value })} maxLength={200} />
                  <button type="button" className="btn btn-ghost px-3" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button type="button" className="btn btn-ghost px-3" onClick={() => moveImage(i, 1)} disabled={i === d.images.length - 1} aria-label="Move down">↓</button>
                  <button type="button" className="btn btn-ghost px-3 text-red-800" onClick={() => set("images", d.images.filter((_, j) => j !== i))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          {d.images.length < 12 && (
            <button type="button" className="btn btn-ghost mt-2 px-3 text-brand" onClick={() => set("images", [...d.images, { image_url: "", alt_text: d.name }])}>+ Add photo</button>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          {ta("ingredients_text", "Ingredients", "List exactly what goes in, as approved by the owner.")}
          {ta("allergen_text", "Allergen information", "e.g. Contains mustard and sesame.")}
          {ta("storage_text", "Storage instructions")}
          {ta("shelf_life_text", "Shelf life / best before")}
        </div>
        {ta("preparation_text", "How it's made (optional)", undefined, 3)}
        <Labeled id="p-price-note" label="Price note" hint="Shown under the price details.">
          <input id="p-price-note" className="input" value={d.price_note ?? ""} onChange={(e) => set("price_note", e.target.value)} maxLength={300} />
        </Labeled>

        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled id="p-slug" label="Web address (slug)" hint="Leave blank to create from the name.">
            <input id="p-slug" className="input" value={d.slug} onChange={(e) => set("slug", e.target.value)} maxLength={120} />
          </Labeled>
          <Labeled id="p-order" label="Display order" hint="Lower numbers appear first.">
            <input id="p-order" type="number" className="input" value={d.display_order} onChange={(e) => set("display_order", Number(e.target.value) || 0)} />
          </Labeled>
        </div>

        <div className="flex flex-wrap gap-6">
          <Toggle id="p-visible" checked={d.visible} onChange={(v) => set("visible", v)} label="Visible on website" />
          <Toggle id="p-featured" checked={d.featured} onChange={(v) => set("featured", v)} label="Feature on home page" />
        </div>

        <p className="rounded-xl bg-turmeric-soft p-3 text-xs">
          Before making a product visible, make sure the owner has approved the name, price, pack size, ingredients,
          allergens and storage text. Avoid health claims, or words like &quot;organic&quot; or &quot;chemical-free&quot;,
          unless you have evidence or certification.
        </p>

        {errors && <p className="field-error" role="alert">{errors}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          {d.id ? (
            <ConfirmButton message="Delete this product permanently? Hiding it is usually better. Past requests keep their product names." onConfirm={remove}>
              Delete product
            </ConfirmButton>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save product"}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
