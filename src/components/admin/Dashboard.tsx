"use client";

import { useEffect, useState } from "react";
import type { ContentField, DashboardStats } from "@/lib/adminTypes";
import { Alert } from "../forms";
import type { SectionId } from "./AdminApp";
import { errorText, useAdmin } from "./AdminContext";
import { SectionHeader, Spinner } from "./ui";

export function Dashboard({ go }: { go: (id: SectionId) => void }) {
  const { call, me } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [content, setContent] = useState<ContentField[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([call<DashboardStats>("/api/admin/dashboard"), call<ContentField[]>("/api/admin/content")])
      .then(([s, c]) => {
        setStats(s);
        setContent(c);
      })
      .catch((e) => setError(errorText(e)));
  }, [call]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!stats) return <Spinner />;

  const val = (k: string) => content.find((c) => c.key === k)?.body.trim() ?? "";
  const warnings: { text: string; action?: () => void; label?: string }[] = [];
  if (!val("whatsapp_number")) warnings.push({ text: "WhatsApp number is not set, so 'Enquire on WhatsApp' buttons are hidden.", action: () => go("content"), label: "Set it" });
  if (val("show_preview_notice") === "true") warnings.push({ text: "The 'sample content' notice is showing on the site. Turn it off once all products and text are approved.", action: () => go("content"), label: "Site switches" });
  if (val("orders_enabled") !== "true") warnings.push({ text: "Order requests are paused on the website.", action: () => go("content"), label: "Turn on" });
  if (!stats.email_configured) warnings.push({ text: "Email alerts are not set up. New requests still appear here – check this inbox every business day." });
  if (stats.failed_notifications_7_days) warnings.push({ text: `${stats.failed_notifications_7_days} email alert(s) failed in the last 7 days. The requests are safe in the inbox.`, action: () => go("orders"), label: "Open inbox" });
  if (stats.due_for_retention_review) warnings.push({ text: `${stats.due_for_retention_review} request(s) are past the retention period.`, action: () => go("settings"), label: "Review" });
  if (!me.mfa_enabled) warnings.push({ text: "Protect this account with an authenticator app (two-step sign-in).", action: () => go("settings"), label: "Set up" });

  const tiles = [
    { label: "New order requests", value: stats.new_orders, highlight: stats.new_orders > 0, go: "orders" as const },
    { label: "New callback requests", value: stats.new_enquiries, highlight: stats.new_enquiries > 0, go: "enquiries" as const },
    { label: "Order requests (30 days)", value: stats.orders_last_30_days, go: "orders" as const },
    { label: "Callback requests (30 days)", value: stats.enquiries_last_30_days, go: "enquiries" as const },
  ];

  return (
    <>
      <SectionHeader title="Dashboard" description="Requests are not confirmed orders. Contact each customer on WhatsApp to confirm availability, delivery and charges." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => go(t.go)}
            className={`card p-4 text-left transition hover:border-brand/40 ${t.highlight ? "border-brand bg-brand-soft" : ""}`}
          >
            <p className="text-3xl font-bold">{t.value}</p>
            <p className="mt-1 text-sm text-muted">{t.label}</p>
          </button>
        ))}
      </div>

      {warnings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <ul className="mt-3 space-y-2">
            {warnings.map((w) => (
              <li key={w.text} className="card flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span>{w.text}</span>
                {w.action && (
                  <button type="button" onClick={w.action} className="btn btn-secondary shrink-0 px-4 py-1.5">{w.label}</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card p-5 text-sm">
          <h2 className="text-lg font-semibold">Daily routine</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            <li>Open <strong>Order requests</strong> and <strong>Callback requests</strong>.</li>
            <li>Tap <strong>WhatsApp</strong> on each new request and confirm availability, delivery option and charges.</li>
            <li>Update the status (Contacted → Confirmed by vendor → Completed, or Declined).</li>
            <li>Hide products that are out of stock or out of season.</li>
          </ol>
        </div>
        <div className="card p-5 text-sm">
          <h2 className="text-lg font-semibold">Storage</h2>
          <p className="mt-2 text-muted">Photos use {stats.media_used_mb} MB of {stats.media_quota_mb} MB.</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand">
            <div className="h-full bg-leaf" style={{ width: `${Math.min(100, (stats.media_used_mb / stats.media_quota_mb) * 100)}%` }} />
          </div>
          <p className="mt-3 text-muted">Email alerts: {stats.email_configured ? "configured" : "not configured"}</p>
        </div>
      </section>
    </>
  );
}
