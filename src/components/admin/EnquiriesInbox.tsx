"use client";

import { useState } from "react";
import { ENQUIRY_STATUS_LABELS, type AdminEnquiry, type EnquiryStatus } from "@/lib/adminTypes";
import { formatDateTime, timeAgo } from "@/lib/format";
import { IconPhone, IconWhatsApp } from "../Icons";
import { errorText, useAdmin } from "./AdminContext";
import { InboxFilters, NotificationNote, statusTone, useInbox } from "./OrdersInbox";
import { Badge, ConfirmButton, Empty, SectionHeader, Spinner } from "./ui";

export function EnquiriesInbox() {
  const { download, notify } = useAdmin();
  const inbox = useInbox<AdminEnquiry>("/api/admin/enquiries");
  const { data } = inbox;
  const replace = (row: AdminEnquiry) => inbox.setData((d) => d && { ...d, items: d.items.map((x) => (x.id === row.id ? row : x)) });
  const removeRow = (id: string) => inbox.setData((d) => d && { ...d, items: d.items.filter((x) => x.id !== id), total: d.total - 1 });

  return (
    <>
      <SectionHeader
        title="Callback requests"
        description="Visitors who asked you to call or message them back."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={inbox.load}>Refresh</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => download(`/api/admin/enquiries/export.csv${inbox.status ? `?status=${inbox.status}` : ""}`, "callback-requests.csv").catch((e) => notify(errorText(e), "error"))}
            >
              Export CSV
            </button>
          </>
        }
      />
      <InboxFilters labels={ENQUIRY_STATUS_LABELS} status={inbox.status} setStatus={inbox.setStatus} q={inbox.q} setQ={inbox.setQ} onSearch={() => inbox.setQuery(inbox.q.trim())} />
      {inbox.error && <p className="field-error mb-4">{inbox.error}</p>}
      {!data ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <Empty>No callback requests here yet.</Empty>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">{data.total} request(s)</p>
          <ul className="space-y-4">
            {data.items.map((e) => (
              <EnquiryCard key={e.id} enquiry={e} onChange={replace} onDelete={removeRow} />
            ))}
          </ul>
          {data.items.length < data.total && (
            <button type="button" className="btn btn-secondary mt-6 w-full" onClick={inbox.more}>Load more</button>
          )}
        </>
      )}
    </>
  );
}

function EnquiryCard({ enquiry: e, onChange, onDelete }: { enquiry: AdminEnquiry; onChange: (x: AdminEnquiry) => void; onDelete: (id: string) => void }) {
  const { call, notify } = useAdmin();
  const [notes, setNotes] = useState(e.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const waText = `Hello${e.customer_name ? ` ${e.customer_name}` : ""}! Thank you for your enquiry ${e.public_reference}${e.product_name_snapshot ? ` about ${e.product_name_snapshot}` : ""}. `;
  const wa = `https://wa.me/${e.phone_number.replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`;

  async function update(body: { status?: EnquiryStatus; admin_notes?: string }) {
    setSaving(true);
    try {
      onChange(await call<AdminEnquiry>(`/api/admin/enquiries/${e.id}`, { method: "PATCH", body }));
      notify("Saved.");
    } catch (err) {
      notify(errorText(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await call(`/api/admin/enquiries/${e.id}`, { method: "DELETE" });
      onDelete(e.id);
      notify("Enquiry deleted.");
    } catch (err) {
      notify(errorText(err), "error");
    }
  }

  return (
    <li className={`card overflow-hidden ${e.status === "new" ? "border-brand/50" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-sand/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">{e.public_reference}</span>
          <Badge tone={statusTone(e.status)}>{ENQUIRY_STATUS_LABELS[e.status]}</Badge>
        </div>
        <span className="text-xs text-muted">{formatDateTime(e.created_at)} · {timeAgo(e.created_at)}</span>
      </div>
      <div className="grid gap-4 p-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-muted uppercase">Customer</p>
          <p className="text-lg font-semibold">{e.phone_number}</p>
          {e.customer_name && <p>{e.customer_name}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp px-4 py-1.5"><IconWhatsApp /> WhatsApp</a>
            <a href={`tel:${e.phone_number}`} className="btn btn-secondary px-4 py-1.5"><IconPhone width={16} height={16} /> Call</a>
          </div>
          {e.preferred_contact_time && <p className="mt-3"><span className="text-muted">Best time:</span> {e.preferred_contact_time}</p>}
          <div className="mt-2"><NotificationNote notifications={e.notifications} /></div>
        </div>
        <div className="space-y-2">
          {e.product_name_snapshot && <p><span className="text-muted">Product:</span> <strong>{e.product_name_snapshot}</strong></p>}
          {e.quantity_interest && <p><span className="text-muted">Quantity:</span> {e.quantity_interest}</p>}
          {e.message && <p className="whitespace-pre-line rounded-xl bg-sand/50 p-3">{e.message}</p>}
        </div>
      </div>
      <div className="grid gap-3 border-t border-line p-4 md:grid-cols-[220px_1fr]">
        <div>
          <label htmlFor={`es-${e.id}`} className="label">Status</label>
          <select id={`es-${e.id}`} className="input" value={e.status} disabled={saving} onChange={(ev) => update({ status: ev.target.value as EnquiryStatus })}>
            {Object.entries(ENQUIRY_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`en-${e.id}`} className="label">Private notes</label>
          <div className="flex gap-2">
            <textarea id={`en-${e.id}`} className="input min-h-11" rows={1} value={notes} onChange={(ev) => setNotes(ev.target.value)} />
            <button type="button" className="btn btn-secondary shrink-0" disabled={saving || notes === (e.admin_notes ?? "")} onClick={() => update({ admin_notes: notes })}>Save</button>
          </div>
        </div>
      </div>
      <div className="flex justify-end border-t border-line px-4 py-2">
        <ConfirmButton className="btn btn-ghost text-xs text-red-800" message={`Permanently delete ${e.public_reference}?`} onConfirm={remove}>Delete</ConfirmButton>
      </div>
    </li>
  );
}
