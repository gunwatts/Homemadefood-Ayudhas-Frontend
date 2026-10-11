"use client";

import { useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { useContent } from "@/lib/catalogue";
import { phoneProblem } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { Alert, describedBy, Field, Honeypot, PrivacyCheckbox } from "./forms";
import { IconCheck, IconWhatsApp } from "./Icons";

interface Props {
  productId?: string;
  productName?: string;
  idPrefix?: string;
}

/** "Request a callback" — sends an enquiry to the owner's admin inbox (and email, if set up). */
export function CallbackForm({ productId, productName, idPrefix = "cb" }: Props) {
  const { text, flag, whatsapp, businessName } = useContent();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string; message: string } | null>(null);

  const clearError = (k: string) =>
    setErrors((e) => {
      if (!(k in e)) return e;
      const rest = { ...e };
      delete rest[k];
      return rest;
    });

  const id = (k: string) => `${idPrefix}-${k}`;
  const enabled = flag("orders_enabled");
  const fallbackWa = waLink(
    whatsapp,
    `Hello ${businessName}! Please call me back${productName ? ` about ${productName}` : ""}.${message ? `\n${message}` : ""}`,
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const p = phoneProblem(phone);
    if (p) errs.phone_number = p;
    if (!agreed) errs.privacy_acknowledged = "Please confirm you have read the privacy notice.";
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const res = await apiRequest<{ reference: string; message: string }>("/api/enquiries", {
        body: {
          customer_name: name || null,
          phone_number: phone,
          product_id: productId || null,
          quantity_interest: quantity || null,
          preferred_contact_time: time || null,
          message: message || null,
          privacy_notice_version: text("privacy_notice_version"),
          privacy_acknowledged: agreed,
          website: honeypot || null,
        },
      });
      setDone(res);
    } catch (err) {
      const e2 = err as ApiError;
      setErrors(e2.fields || {});
      setFormError(e2.message);
      setShowFallback(e2.isNetwork || e2.status >= 500 || e2.status === 429);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5" role="status">
        <p className="flex items-center gap-2 font-semibold text-green-900">
          <IconCheck /> Enquiry received
        </p>
        <p className="mt-2 text-sm text-green-900">{done.message}</p>
        <p className="mt-2 text-sm text-green-900">
          Your reference: <strong className="font-mono">{done.reference}</strong>
        </p>
        <p className="mt-1 text-sm text-green-900">{text("response_time")}</p>
      </div>
    );
  }

  if (!enabled) {
    return (
      <Alert tone="warning">
        The callback form is paused right now.{" "}
        {fallbackWa ? (
          <a href={fallbackWa} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Message us on WhatsApp instead.
          </a>
        ) : (
          "Please use the contact details on this page."
        )}
      </Alert>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {productName && (
        <p className="text-sm text-muted">
          About: <strong className="text-ink">{productName}</strong>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("phone")} label="WhatsApp / mobile number" error={errors.phone_number} hint="We'll call or message you on this number.">
          <input
            id={id("phone")}
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); clearError("phone_number"); }}
            maxLength={20}
            required
            {...describedBy(id("phone"), errors.phone_number)}
          />
        </Field>
        <Field id={id("name")} label="Your name" optional>
          <input id={id("name")} className="input" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </Field>
        {productName && (
          <Field id={id("qty")} label="Quantity you're interested in" optional>
            <input id={id("qty")} className="input" placeholder="e.g. 2 × 500 g" value={quantity} onChange={(e) => setQuantity(e.target.value)} maxLength={100} />
          </Field>
        )}
        <Field id={id("time")} label="Best time to contact you" optional>
          <select id={id("time")} className="input" value={time} onChange={(e) => setTime(e.target.value)}>
            <option value="">Any time</option>
            <option>Morning (9 am – 12 pm)</option>
            <option>Afternoon (12 – 4 pm)</option>
            <option>Evening (4 – 8 pm)</option>
          </select>
        </Field>
      </div>
      <Field id={id("message")} label="Message" optional error={errors.message} hint="Please don't include your full address or payment details.">
        <textarea
          id={id("message")}
          className="input min-h-24"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          {...describedBy(id("message"), errors.message)}
        />
      </Field>
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <PrivacyCheckbox id={id("privacy")} checked={agreed} onChange={(v) => { setAgreed(v); clearError("privacy_acknowledged"); }} error={errors.privacy_acknowledged} />
      <p className="text-xs text-muted">Sending an enquiry does not confirm an order, price, availability or delivery.</p>
      {formError && !Object.keys(errors).length && <Alert tone="error">{formError}</Alert>}
      {showFallback && fallbackWa && (
        <a href={fallbackWa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
          <IconWhatsApp /> Message us on WhatsApp instead
        </a>
      )}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={busy}>
        {busy ? "Sending…" : "Request a callback"}
      </button>
    </form>
  );
}
