"use client";

import Link from "next/link";
import { useContent } from "@/lib/catalogue";
import { waLink } from "@/lib/whatsapp";
import { IconPhone, IconPin, IconWhatsApp } from "./Icons";

export function SiteFooter() {
  const { businessName, text, whatsapp } = useContent();
  const wa = waLink(whatsapp, `Hello ${businessName}! I found you through your website.`);
  const phone = text("phone_number");
  const email = text("contact_email");
  const location = text("location");
  const fssai = text("fssai_number");

  return (
    <footer className="mt-20 border-t border-line bg-sand/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-semibold">{businessName}</p>
          <p className="mt-2 text-sm text-muted">{text("tagline")}</p>
          {location && (
            <p className="mt-4 flex items-start gap-2 text-sm">
              <IconPin className="mt-0.5 shrink-0 text-brand" /> {location}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-bold tracking-wide text-ink uppercase">Get in touch</p>
          <ul className="mt-3 space-y-2 text-sm">
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand">
                  <IconWhatsApp className="text-whatsapp" /> WhatsApp us
                </a>
              </li>
            )}
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 hover:text-brand">
                  <IconPhone className="text-brand" /> {phone}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="hover:text-brand">
                  {email}
                </a>
              </li>
            )}
            <li>
              <Link href="/contact/" className="font-semibold text-brand hover:underline">
                Request a callback →
              </Link>
            </li>
          </ul>
          <p className="mt-3 text-sm text-muted">{text("response_time")}</p>
        </div>

        <div>
          <p className="text-sm font-bold tracking-wide text-ink uppercase">Information</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/products/" className="hover:text-brand">All products</Link></li>
            <li><Link href="/story/" className="hover:text-brand">Our story</Link></li>
            <li><Link href="/terms/" className="hover:text-brand">Terms &amp; disclaimer</Link></li>
            <li><Link href="/privacy/" className="hover:text-brand">Privacy notice</Link></li>
          </ul>
          {fssai && <p className="mt-4 text-sm"><span className="font-semibold">FSSAI:</span> {fssai}</p>}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            This website is a product catalogue. It does not take payments or confirm orders – the owner confirms
            every order request personally on WhatsApp.
          </p>
          <p className="shrink-0">© {new Date().getFullYear()} {businessName}</p>
        </div>
      </div>
    </footer>
  );
}
