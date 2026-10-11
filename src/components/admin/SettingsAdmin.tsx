"use client";

import QRCode from "qrcode";
import { useEffect, useState, type FormEvent } from "react";
import type { AuditEvent } from "@/lib/adminTypes";
import { formatDateTime } from "@/lib/format";
import { errorText, useAdmin } from "./AdminContext";
import { ConfirmButton, Labeled, SectionHeader } from "./ui";

export function SettingsAdmin() {
  return (
    <>
      <SectionHeader title="Account & data" description="Sign-in security, email alerts, data retention and activity log." />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChangePassword />
        <TwoStep />
        <EmailTest />
        <Retention />
      </div>
      <AuditLog />
    </>
  );
}

function ChangePassword() {
  const { call, notify } = useAdmin();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await call("/api/admin/change-password", { body: { current_password: current, new_password: next } });
      setCurrent("");
      setNext("");
      notify("Password changed. Other devices have been signed out.");
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h2 className="text-lg font-semibold">Change password</h2>
      <Labeled id="pw-cur" label="Current password"><input id="pw-cur" type="password" autoComplete="current-password" className="input" value={current} onChange={(e) => setCurrent(e.target.value)} required /></Labeled>
      <Labeled id="pw-new" label="New password" hint="At least 12 characters with upper- and lower-case letters and a number.">
        <input id="pw-new" type="password" autoComplete="new-password" className="input" value={next} onChange={(e) => setNext(e.target.value)} required minLength={12} />
      </Labeled>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary">Update password</button>
    </form>
  );
}

function TwoStep() {
  const { call, notify, me, setMe } = useAdmin();
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (setup) QRCode.toDataURL(setup.otpauth_uri, { margin: 1, width: 200 }).then(setQr).catch(() => setQr(null));
  }, [setup]);

  async function start() {
    setError(null);
    try {
      setSetup(await call("/api/admin/mfa/setup", { method: "POST" }));
    } catch (e) {
      setError(errorText(e));
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!setup) return;
    setError(null);
    try {
      await call("/api/admin/mfa/confirm", { body: { secret: setup.secret, code } });
      setMe({ ...me, mfa_enabled: true });
      setSetup(null);
      setCode("");
      notify("Two-step sign-in is on.");
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await call("/api/admin/mfa/disable", { body: { password } });
      setMe({ ...me, mfa_enabled: false });
      setPassword("");
      notify("Two-step sign-in turned off.");
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className="card space-y-3 p-5">
      <h2 className="text-lg font-semibold">Two-step sign-in</h2>
      {me.mfa_enabled ? (
        <form onSubmit={disable} className="space-y-3">
          <p className="text-sm text-green-800">On – you&apos;ll need a code from your authenticator app to sign in.</p>
          <Labeled id="mfa-pw" label="Password to turn off"><input id="mfa-pw" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required /></Labeled>
          <button type="submit" className="btn btn-secondary">Turn off</button>
        </form>
      ) : setup ? (
        <form onSubmit={confirm} className="space-y-3 text-sm">
          <p>1. In Google Authenticator / Microsoft Authenticator, add an account by scanning this code:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="QR code for authenticator app" width={200} height={200} className="rounded-lg border border-line" />}
          <p className="text-muted">Or enter this key manually: <code className="break-all rounded bg-sand px-1.5 py-0.5 font-mono">{setup.secret}</code></p>
          <Labeled id="mfa-code" label="2. Enter the 6-digit code shown in the app">
            <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" className="input tracking-widest" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required />
          </Labeled>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">Turn on</button>
            <button type="button" className="btn btn-ghost" onClick={() => setSetup(null)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <p className="text-sm text-muted">Adds a one-time code from your phone when signing in, so a stolen password alone is not enough.</p>
          <button type="button" className="btn btn-primary" onClick={start}>Set up</button>
        </>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

function EmailTest() {
  const { call, notify } = useAdmin();
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    try {
      const r = await call<{ message: string }>("/api/admin/test-email", { method: "POST" });
      notify(r.message);
    } catch (e) {
      notify(errorText(e), "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="card space-y-3 p-5">
      <h2 className="text-lg font-semibold">Email alerts</h2>
      <p className="text-sm text-muted">
        New requests are emailed to the address in <em>Site text &amp; settings → Business</em>, if email is configured on the
        server. Requests are always saved in the inbox even if an email fails.
      </p>
      <button type="button" className="btn btn-secondary" onClick={send} disabled={busy}>{busy ? "Sending…" : "Send test email"}</button>
    </div>
  );
}

function Retention() {
  const { call, notify } = useAdmin();
  async function purge() {
    try {
      const r = await call<{ deleted_orders: number; deleted_enquiries: number }>("/api/admin/retention/purge", { method: "POST" });
      notify(`Deleted ${r.deleted_orders} order request(s) and ${r.deleted_enquiries} callback request(s).`);
    } catch (e) {
      notify(errorText(e), "error");
    }
  }
  return (
    <div className="card space-y-3 p-5">
      <h2 className="text-lg font-semibold">Data retention</h2>
      <p className="text-sm text-muted">
        Customer phone numbers are personal data. Finished requests (completed, declined, closed, responded or spam) older
        than the retention period stated in the privacy notice can be deleted here. Open requests are never deleted
        automatically.
      </p>
      <p className="text-sm text-muted">If a customer asks for their data to be removed, search for their number in the inbox and use <em>Delete</em>.</p>
      <ConfirmButton className="btn btn-secondary" message="Permanently delete finished requests past their retention date?" onConfirm={purge}>
        Delete expired finished requests
      </ConfirmButton>
    </div>
  );
}

function AuditLog() {
  const { call } = useAdmin();
  const [rows, setRows] = useState<AuditEvent[] | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open && !rows) call<AuditEvent[]>("/api/admin/audit?limit=100").then(setRows).catch(() => setRows([]));
  }, [open, rows, call]);
  return (
    <details className="card mt-6 p-5" onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-lg font-semibold">Activity log</summary>
      {!rows ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted uppercase">
              <tr><th className="py-2 pr-4">When</th><th className="py-2 pr-4">Action</th><th className="py-2 pr-4">Item</th><th className="py-2">Details</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(r.timestamp)}</td>
                  <td className="py-2 pr-4">{r.action}</td>
                  <td className="py-2 pr-4">{r.entity_type}</td>
                  <td className="max-w-xs truncate py-2 text-muted">{r.metadata_text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}
