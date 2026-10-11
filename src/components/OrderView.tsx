"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api";
import { MAX_LINE_QTY, useCart, type ResolvedLine } from "@/lib/cart";
import { productHref, useContent } from "@/lib/catalogue";
import { formatPaise, phoneProblem, pincodeProblem } from "@/lib/format";
import type { OrderRequestResult, ReceivingMethod } from "@/lib/types";
import { waLink } from "@/lib/whatsapp";
import { Alert, describedBy, Field, Honeypot, PrivacyCheckbox } from "./forms";
import { IconBag, IconCheck, IconHome, IconTrash, IconTruck, IconUsers, IconWhatsApp } from "./Icons";
import { ProductPicture } from "./ProductPicture";

const METHODS: { value: ReceivingMethod; title: string; body: string; icon: React.ReactNode }[] = [
  {
    value: "delhivery",
    title: "Delhivery courier",
    body: "Subject to PIN-code serviceability and our confirmation. The courier charge is extra and depends on weight, size, destination and current rates – we'll quote it on WhatsApp.",
    icon: <IconTruck />,
  },
  {
    value: "vendor_pickup",
    title: "Collect from us",
    body: "Pick up directly from the maker, where we can agree a time and place. No courier charge.",
    icon: <IconHome />,
  },
  {
    value: "friend_handover",
    title: "Via a friend or known person",
    body: "Hand over through someone travelling to your area, only if we both agree. This is arranged directly between you and us – it is not a service provided by this website.",
    icon: <IconUsers />,
  },
];

const METHOD_LABEL: Record<ReceivingMethod, string> = {
  delhivery: "Delhivery courier",
  vendor_pickup: "Collect from the maker",
  friend_handover: "Handover via friend / known person",
};

export function OrderView() {
  const cart = useCart();
  const { text, flag, whatsapp, businessName } = useContent();
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [method, setMethod] = useState<ReceivingMethod | "">("");
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OrderRequestResult | null>(null);

  const clearError = (k: string) =>
    setErrors((e) => {
      if (!(k in e)) return e;
      const rest = { ...e };
      delete rest[k];
      return rest;
    });

  const enabled = flag("orders_enabled");
  const available = cart.resolved.filter((l) => l.available && !unavailable.includes(l.variantId));
  const blocked = cart.resolved.filter((l) => !l.available || unavailable.includes(l.variantId));

  const summaryText = (ref?: string) =>
    [
      `Hello ${businessName}! ${ref ? `My order request reference is *${ref}*.` : "I'd like to place an order request:"}`,
      ...available.map((l) => `• ${l.product?.name} (${l.variant?.label}) × ${l.quantity}`),
      pincode ? `PIN code: ${pincode}` : "",
      method ? `Receiving: ${METHOD_LABEL[method]}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const p = phoneProblem(phone);
    if (p) errs.whatsapp_number = p;
    const pc = pincodeProblem(pincode);
    if (pc) errs.delivery_pincode = pc;
    if (!method) errs.receiving_method = "Please choose how you'd like to receive your order.";
    if (!agreed) errs.privacy_acknowledged = "Please confirm you have read the privacy notice.";
    if (blocked.length) errs.items = "Please remove the items that are no longer available.";
    if (!available.length) errs.items = "Your order list is empty.";
    setErrors(errs);
    setFormError(null);
    setShowFallback(false);
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0] === "items" ? "order-items" : `order-${Object.keys(errs)[0]}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      const res = await apiRequest<OrderRequestResult>("/api/order-requests", {
        body: {
          items: available.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
          whatsapp_number: phone,
          delivery_pincode: pincode,
          receiving_method: method,
          customer_message: note || null,
          privacy_notice_version: text("privacy_notice_version"),
          privacy_acknowledged: agreed,
          website: honeypot || null,
        },
      });
      setResult(res);
      cart.clear();
      window.scrollTo({ top: 0 });
    } catch (err) {
      const e2 = err as ApiError;
      if (e2.code === "unavailable_items") {
        setUnavailable((e2.data.unavailable_variant_ids as string[]) || []);
      }
      const fields = { ...e2.fields };
      if (fields.items === undefined && Object.keys(fields).some((k) => k.startsWith("items"))) {
        fields.items = "Please check the quantities in your order list.";
      }
      setErrors(fields);
      setFormError(e2.message);
      setShowFallback(e2.isNetwork || e2.status >= 500 || e2.status === 429);
    } finally {
      setBusy(false);
    }
  }

  if (result) return <OrderSuccess result={result} whatsapp={whatsapp} businessName={businessName} responseTime={text("response_time")} />;

  if (!cart.hydrated) {
    return <div className="container-page py-24 text-center text-muted">Loading your order list…</div>;
  }

  if (cart.lines.length === 0) {
    return (
      <section className="container-page py-20 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sand text-brand"><IconBag width={28} height={28} /></span>
        <h1 className="mt-6 text-3xl font-semibold">Your order list is empty</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">Browse our sweets and pickles and add what you&apos;d like. You can send everything as one order request.</p>
        <Link href="/products/" className="btn btn-primary mt-8">Browse products</Link>
      </section>
    );
  }

  const fallbackWa = waLink(whatsapp, summaryText());

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Order request</p>
      <h1 className="mt-2 text-4xl font-semibold">Your order list</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Check your items, then send an order request. We&apos;ll contact you on WhatsApp to confirm availability,
        delivery options and any delivery charge. <strong className="text-ink">No payment is taken on this website.</strong>
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Items */}
        <section className="lg:col-span-3" aria-labelledby="items-title">
          <h2 id="items-title" className="sr-only">Items</h2>
          <ul id="order-items" tabIndex={-1} className="card divide-y divide-line outline-none">
            {cart.resolved.map((line) => (
              <CartRow key={line.variantId} line={line} blocked={!line.available || unavailable.includes(line.variantId)} />
            ))}
          </ul>
          {errors.items && <p className="field-error" role="alert">{errors.items}</p>}

          <div className="card mt-4 p-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Product subtotal</span>
              <span className="text-xl font-bold">{formatPaise(available.reduce((n, l) => n + l.lineTotal, 0))}</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Product-only prices. Delivery charges are <strong>not included</strong> – if you choose Delhivery, we&apos;ll
              quote the courier charge on WhatsApp after checking your PIN code and parcel weight. The final amount is
              confirmed by us before you pay anything.
            </p>
          </div>
          <Link href="/products/" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">← Continue browsing</Link>
        </section>

        {/* Form */}
        <section className="lg:col-span-2" aria-labelledby="form-title">
          <div className="card p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 id="form-title" className="text-2xl font-semibold">Place order request</h2>
            {!enabled ? (
              <div className="mt-4 space-y-4">
                <Alert tone="warning">We&apos;re not taking order requests through the website right now.</Alert>
                {fallbackWa && (
                  <a href={fallbackWa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
                    <IconWhatsApp /> Send your list on WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-5 space-y-5">
                <Field id="order-whatsapp_number" label="WhatsApp / mobile number" error={errors.whatsapp_number} hint="We'll contact you on WhatsApp at this number.">
                  <input
                    id="order-whatsapp_number"
                    className="input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); clearError("whatsapp_number"); }}
                    maxLength={20}
                    required
                    {...describedBy("order-whatsapp_number", errors.whatsapp_number)}
                  />
                </Field>
                <Field id="order-delivery_pincode" label="Delivery PIN code" error={errors.delivery_pincode} hint="Used to check courier serviceability. We don't need your full address now.">
                  <input
                    id="order-delivery_pincode"
                    className="input"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="e.g. 534201"
                    value={pincode}
                    onChange={(e) => { setPincode(e.target.value.replace(/[^\d\s]/g, "").slice(0, 7)); clearError("delivery_pincode"); }}
                    required
                    {...describedBy("order-delivery_pincode", errors.delivery_pincode)}
                  />
                </Field>

                <fieldset aria-describedby={errors.receiving_method ? "order-receiving_method-error" : undefined}>
                  <legend className="label">How would you like to receive it?</legend>
                  <div className="space-y-2">
                    {METHODS.map((m, i) => (
                      <label
                        key={m.value}
                        className="flex cursor-pointer gap-3 rounded-xl border border-line bg-white p-3.5 has-[:checked]:border-brand has-[:checked]:bg-brand-soft/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-turmeric"
                      >
                        <input
                          id={i === 0 ? "order-receiving_method" : undefined}
                          type="radio"
                          name="receiving_method"
                          value={m.value}
                          checked={method === m.value}
                          onChange={() => { setMethod(m.value); clearError("receiving_method"); }}
                          className="mt-1 h-4 w-4 shrink-0 accent-brand"
                        />
                        <span>
                          <span className="flex items-center gap-2 font-semibold">
                            <span className="text-brand">{m.icon}</span> {m.title}
                            {m.value === "delhivery" && <span className="rounded-full bg-turmeric-soft px-2 py-0.5 text-xs font-semibold">Preferred</span>}
                          </span>
                          <span className="mt-1 block text-sm text-muted">{m.body}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="hint">Pickup and friend handover are not available for every order – we&apos;ll confirm what&apos;s possible.</p>
                  {errors.receiving_method && <p id="order-receiving_method-error" className="field-error" role="alert">{errors.receiving_method}</p>}
                </fieldset>

                <Field id="order-note" label="Note for us" optional error={errors.customer_message} hint="E.g. preferred delivery date. Please don't include your address or payment details.">
                  <textarea id="order-note" className="input min-h-20" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
                </Field>

                <Honeypot value={honeypot} onChange={setHoneypot} />
                <PrivacyCheckbox id="order-privacy_acknowledged" checked={agreed} onChange={(v) => { setAgreed(v); clearError("privacy_acknowledged"); }} error={errors.privacy_acknowledged} />

                <Alert tone="info">
                  <strong>This is a request, not a confirmed order.</strong> Submitting does not guarantee price,
                  availability or delivery. We&apos;ll confirm everything with you on WhatsApp.
                </Alert>

                {formError && <Alert tone="error">{formError}</Alert>}
                {showFallback && fallbackWa && (
                  <a href={fallbackWa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
                    <IconWhatsApp /> Send your list on WhatsApp instead
                  </a>
                )}

                <button type="submit" className="btn btn-primary w-full text-base" disabled={busy}>
                  {busy ? "Sending request…" : "Place Order"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function CartRow({ line, blocked }: { line: ResolvedLine; blocked: boolean }) {
  const cart = useCart();
  if (!line.product || !line.variant) {
    return (
      <li className="flex items-center justify-between gap-4 bg-red-50/60 p-4">
        <p className="text-sm text-red-900">An item in your list is no longer available.</p>
        <button type="button" onClick={() => cart.remove(line.variantId)} className="btn btn-ghost text-red-800">
          <IconTrash width={18} height={18} /> Remove
        </button>
      </li>
    );
  }
  return (
    <li className={`flex gap-4 p-4 ${blocked ? "bg-red-50/60" : ""}`}>
      <Link href={productHref(line.product.slug)} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
        <ProductPicture product={line.product} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={productHref(line.product.slug)} className="font-semibold hover:text-brand">{line.product.name}</Link>
            <p className="text-sm text-muted">{line.variant.label} · {formatPaise(line.variant.price_paise)} each</p>
            {blocked && <p className="mt-1 text-sm font-medium text-red-800">No longer available – please remove.</p>}
          </div>
          <p className="shrink-0 font-semibold">{formatPaise(line.lineTotal)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center rounded-full border border-line bg-white">
            <button type="button" className="h-9 w-9 rounded-full hover:bg-sand" onClick={() => cart.setQuantity(line.variantId, line.quantity - 1)} aria-label={`Decrease quantity of ${line.product.name}`}>−</button>
            <span className="w-8 text-center text-sm font-semibold" aria-label="Quantity">{line.quantity}</span>
            <button type="button" className="h-9 w-9 rounded-full hover:bg-sand disabled:opacity-40" disabled={line.quantity >= MAX_LINE_QTY} onClick={() => cart.setQuantity(line.variantId, line.quantity + 1)} aria-label={`Increase quantity of ${line.product.name}`}>+</button>
          </div>
          <button type="button" onClick={() => cart.remove(line.variantId)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-red-800">
            <IconTrash width={16} height={16} /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

function OrderSuccess({
  result,
  whatsapp,
  businessName,
  responseTime,
}: {
  result: OrderRequestResult;
  whatsapp: string;
  businessName: string;
  responseTime: string;
}) {
  const wa = waLink(whatsapp, `Hello ${businessName}! I just sent an order request from your website. Reference: ${result.reference}`);
  return (
    <section className="container-page max-w-2xl py-16">
      <div className="card p-6 sm:p-10" role="status" aria-live="polite">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-800"><IconCheck width={28} height={28} /></span>
        <h1 className="mt-5 text-3xl font-semibold">Order request received!</h1>
        <p className="mt-3 text-lg">{result.message}</p>
        <p className="mt-4 text-sm text-muted">{responseTime}</p>

        <div className="mt-6 rounded-xl bg-sand p-4">
          <p className="text-sm text-muted">Your request reference</p>
          <p className="font-mono text-2xl font-bold tracking-wider">{result.reference}</p>
        </div>

        <table className="mt-6 w-full text-sm">
          <caption className="sr-only">Items requested</caption>
          <tbody className="divide-y divide-line">
            {result.items.map((it) => (
              <tr key={`${it.product_name}-${it.variant_label}`}>
                <td className="py-2">{it.product_name} <span className="text-muted">({it.variant_label}) × {it.quantity}</span></td>
                <td className="py-2 text-right">{formatPaise(it.line_total_paise)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line font-semibold">
              <td className="py-2">Product subtotal</td>
              <td className="py-2 text-right">{formatPaise(result.product_only_subtotal_paise)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-2 text-xs text-muted">Delivery charges, if any, are extra and will be confirmed on WhatsApp. Nothing has been charged.</p>

        <div className="mt-8 flex flex-wrap gap-3">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <IconWhatsApp /> Send reference on WhatsApp (optional)
            </a>
          )}
          <Link href="/products/" className="btn btn-secondary">Back to products</Link>
        </div>
      </div>
    </section>
  );
}
