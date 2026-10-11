"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ORDER_STATUS_LABELS,
  RECEIVING_LABELS,
  type AdminOrderRequest,
  type OrderStatus,
  type Page,
} from "@/lib/adminTypes";
import { formatDateTime, formatPaise, timeAgo } from "@/lib/format";
import { IconPhone, IconWhatsApp } from "../Icons";
import { errorText, useAdmin } from "./AdminContext";
import { Badge, ConfirmButton, Empty, SectionHeader, Spinner } from "./ui";

const PAGE = 30;

export function statusTone(status: string) {
  if (status === "new") return "new" as const;
  if (status === "confirmed_by_vendor" || status === "completed" || status === "responded") return "good" as const;
  if (status === "declined" || status === "spam") return "bad" as const;
  if (status === "contacted") return "warn" as const;
  return "neutral" as const;
}

export function NotificationNote({ notifications }: { notifications: { status: string; error_message: string | null }[] }) {
  const last = notifications[notifications.length - 1];
  if (!last) return null;
  if (last.status === "sent") return <span className="text-xs text-muted">Email alert sent</span>;
  if (last.status === "failed") return <span className="text-xs font-medium text-red-800">Email alert failed ({last.error_message})</span>;
  return null;
}

export function useInbox<T>(basePath: string) {
  const { call } = useAdmin();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Page<T> | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    try {
      setData(await call<Page<T>>(`${basePath}?${params}`));
      setError(null);
    } catch (e) {
      setError(errorText(e));
    }
  }, [call, basePath, status, query, limit]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // refresh every minute while open
    return () => clearInterval(t);
  }, [load]);

  return { status, setStatus, q, setQ, setQuery, data, setData, load, error, more: () => setLimit((l) => l + PAGE) };
}

export function InboxFilters({
  labels,
  status,
  setStatus,
  q,
  setQ,
  onSearch,
}: {
  labels: Record<string, string>;
  status: string;
  setStatus: (s: string) => void;
  q: string;
  setQ: (s: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="mb-5 space-y-3">
      <div role="group" aria-label="Filter by status" className="flex gap-1.5 overflow-x-auto pb-1">
        {[["", "All"], ...Object.entries(labels)].map(([value, label]) => (
          <button
            key={value || "all"}
            type="button"
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
            className="shrink-0 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-medium aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-white"
          >
            {label}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="flex gap-2"
      >
        <label htmlFor="inbox-search" className="sr-only">Search</label>
        <input id="inbox-search" type="search" className="input" placeholder="Search reference, phone number or PIN" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>
    </div>
  );
}

export function OrdersInbox() {
  const { download, notify } = useAdmin();
  const inbox = useInbox<AdminOrderRequest>("/api/admin/order-requests");
  const { data } = inbox;

  const replace = (row: AdminOrderRequest) =>
    inbox.setData((d) => d && { ...d, items: d.items.map((x) => (x.id === row.id ? row : x)) });
  const removeRow = (id: string) => inbox.setData((d) => d && { ...d, items: d.items.filter((x) => x.id !== id), total: d.total - 1 });

  return (
    <>
      <SectionHeader
        title="Order requests"
        description="Customers' product selections. Contact them on WhatsApp to confirm availability, delivery option and any courier charge."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={inbox.load}>Refresh</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                download(`/api/admin/order-requests/export.csv${inbox.status ? `?status=${inbox.status}` : ""}`, "order-requests.csv").catch((e) => notify(errorText(e), "error"))
              }
            >
              Export CSV
            </button>
          </>
        }
      />
      <InboxFilters labels={ORDER_STATUS_LABELS} status={inbox.status} setStatus={inbox.setStatus} q={inbox.q} setQ={inbox.setQ} onSearch={() => inbox.setQuery(inbox.q.trim())} />
      {inbox.error && <p className="field-error mb-4">{inbox.error}</p>}
      {!data ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <Empty>No order requests here yet.</Empty>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">{data.total} request(s)</p>
          <ul className="space-y-4">
            {data.items.map((o) => (
              <OrderCard key={o.id} order={o} onChange={replace} onDelete={removeRow} />
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

function OrderCard({ order, onChange, onDelete }: { order: AdminOrderRequest; onChange: (o: AdminOrderRequest) => void; onDelete: (id: string) => void }) {
  const { call, notify } = useAdmin();
  const [notes, setNotes] = useState(order.admin_notes ?? "");
  const [saving, setSaving] = useState(false);

  const itemsText = order.items.map((i) => `• ${i.product_name_snapshot} (${i.variant_label_snapshot}) × ${i.quantity}`).join("\n");
  const waText = `Hello! Thank you for your order request ${order.public_reference} on our website:\n${itemsText}\nProduct subtotal: ${formatPaise(order.product_only_subtotal_paise)}\n\nI'm checking availability and the delivery option for PIN ${order.delivery_pincode}. `;
  const wa = `https://wa.me/${order.customer_whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(waText)}`;

  async function update(body: { status?: OrderStatus; admin_notes?: string }) {
    setSaving(true);
    try {
      onChange(await call<AdminOrderRequest>(`/api/admin/order-requests/${order.id}`, { method: "PATCH", body }));
      notify("Saved.");
    } catch (e) {
      notify(errorText(e), "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await call(`/api/admin/order-requests/${order.id}`, { method: "DELETE" });
      onDelete(order.id);
      notify("Request deleted.");
    } catch (e) {
      notify(errorText(e), "error");
    }
  }

  async function resend() {
    try {
      await call(`/api/admin/order-requests/${order.id}/resend-notification`, { method: "POST" });
      notify("Email alert queued.");
    } catch (e) {
      notify(errorText(e), "error");
    }
  }

  return (
    <li className={`card overflow-hidden ${order.status === "new" ? "border-brand/50" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-sand/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">{order.public_reference}</span>
          <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Badge>
        </div>
        <span className="text-xs text-muted" title={formatDateTime(order.created_at)}>
          {formatDateTime(order.created_at)} · {timeAgo(order.created_at)}
        </span>
      </div>
      <div className="grid gap-5 p-4 md:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Customer</p>
            <p className="text-lg font-semibold">{order.customer_whatsapp_number}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp px-4 py-1.5">
                <IconWhatsApp /> WhatsApp
              </a>
              <a href={`tel:${order.customer_whatsapp_number}`} className="btn btn-secondary px-4 py-1.5">
                <IconPhone width={16} height={16} /> Call
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-muted uppercase">PIN code</p>
              <p className="font-semibold">{order.delivery_pincode}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase">Receiving</p>
              <p className="font-semibold">{RECEIVING_LABELS[order.receiving_method] ?? order.receiving_method}</p>
            </div>
          </div>
          {order.receiving_method === "delhivery" && (
            <a href="https://www.delhivery.com/" target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-brand hover:underline">
              Check serviceability &amp; rates on Delhivery ↗
            </a>
          )}
          {order.customer_message && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase">Customer note</p>
              <p className="whitespace-pre-line">{order.customer_message}</p>
            </div>
          )}
          <NotificationNote notifications={order.notifications} />
        </div>
        <div>
          <table className="w-full text-sm">
            <caption className="sr-only">Items</caption>
            <tbody className="divide-y divide-line">
              {order.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-1.5">
                    {i.product_name_snapshot} <span className="text-muted">({i.variant_label_snapshot})</span>
                    <span className="block text-xs text-muted">{i.quantity} × {formatPaise(i.unit_price_paise_snapshot)}</span>
                  </td>
                  <td className="py-1.5 text-right align-top">{formatPaise(i.line_total_paise)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line font-semibold">
                <td className="py-1.5">Product subtotal</td>
                <td className="py-1.5 text-right">{formatPaise(order.product_only_subtotal_paise)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-1 text-xs text-muted">Prices at the time of request. Delivery not included.</p>
        </div>
      </div>
      <div className="grid gap-3 border-t border-line p-4 md:grid-cols-[220px_1fr]">
        <div>
          <label htmlFor={`st-${order.id}`} className="label">Status</label>
          <select id={`st-${order.id}`} className="input" value={order.status} disabled={saving} onChange={(e) => update({ status: e.target.value as OrderStatus })}>
            {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`nt-${order.id}`} className="label">Private notes</label>
          <div className="flex gap-2">
            <textarea id={`nt-${order.id}`} className="input min-h-11" rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. courier quoted ₹90, paid via UPI" />
            <button type="button" className="btn btn-secondary shrink-0" disabled={saving || notes === (order.admin_notes ?? "")} onClick={() => update({ admin_notes: notes })}>
              Save
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-line px-4 py-2">
        {order.notifications.some((n) => n.status === "failed") && (
          <button type="button" className="btn btn-ghost text-xs" onClick={resend}>Resend email alert</button>
        )}
        <ConfirmButton className="btn btn-ghost text-xs text-red-800" message={`Permanently delete request ${order.public_reference}? Use this for customer deletion requests or spam.`} onConfirm={remove}>
          Delete
        </ConfirmButton>
      </div>
    </li>
  );
}
