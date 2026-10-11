"use client";

import Link from "next/link";
import { useState } from "react";
import { productHref, useCatalogue, useContent } from "@/lib/catalogue";
import { waLink } from "@/lib/whatsapp";
import { CallbackForm } from "./CallbackForm";
import { IconPhone, IconPin, IconWhatsApp } from "./Icons";
import { SafeImage } from "./ProductPicture";
import { RichText } from "./RichText";
import { YouTubeEmbed } from "./YouTubeEmbed";

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{title}</h1>
      {children && <div className="mt-4 text-lg text-muted">{children}</div>}
    </header>
  );
}

// ---------------------------------------------------------------------------

export function StoryView() {
  const { data } = useCatalogue();
  const { block, text } = useContent();
  const sections = [
    { key: "maker_profile", fallback: "/placeholders/maker.svg" },
    { key: "village", fallback: "/placeholders/village.svg" },
    { key: "process", fallback: "/placeholders/maker.svg" },
    { key: "sourcing", fallback: "/placeholders/podis.svg" },
  ];
  const processPhotos = data.gallery.filter((g) => g.section === "preparation" || g.section === "maker").slice(0, 6);
  const owner = text("owner_name");

  return (
    <div className="container-page py-10">
      <PageIntro eyebrow="Our story" title={owner ? `Made by ${owner}` : "The hands behind every jar"}>
        <RichText text={block("story_short").body} />
        {text("location") && (
          <p className="mt-3 flex items-center gap-2 text-base"><IconPin className="text-brand" /> {text("location")}</p>
        )}
      </PageIntro>

      <div className="mt-14 space-y-20">
        {sections.map(({ key, fallback }, i) => {
          const b = block(key);
          if (!b.title && !b.body) return null;
          return (
            <section key={key} className="grid items-center gap-10 lg:grid-cols-2">
              <div className={`card aspect-[4/3] overflow-hidden ${i % 2 ? "lg:order-2" : ""}`}>
                <SafeImage src={b.image_url} alt={b.image_url ? b.title : `Illustration for ${b.title}`} fallback={fallback} />
              </div>
              <div>
                <h2 className="text-3xl font-semibold">{b.title}</h2>
                <RichText text={b.body} className="mt-4 text-ink/85" />
              </div>
            </section>
          );
        })}
      </div>

      {processPhotos.length > 0 && (
        <section className="mt-20">
          <h2 className="text-3xl font-semibold">In the kitchen</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {processPhotos.map((g) => (
              <li key={g.id} className="overflow-hidden rounded-2xl">
                <SafeImage src={g.url} alt={g.alt || g.caption} fallback="/placeholders/maker.svg" className="aspect-square" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.videos.length > 0 && (
        <section className="mt-20">
          <h2 className="text-3xl font-semibold">Watch us at work</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {data.videos.slice(0, 2).map((v) => (
              <YouTubeEmbed key={v.id} videoId={v.youtube_id} title={v.title} url={v.youtube_url} thumbnail={v.thumbnail_url} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-20 text-center">
        <Link href="/products/" className="btn btn-primary">See what we make</Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function VideosView() {
  const { data } = useCatalogue();
  return (
    <div className="container-page py-10">
      <PageIntro eyebrow="Videos" title="From our kitchen">
        Short videos of how our products are prepared, shared from our YouTube channel.
      </PageIntro>
      {data.videos.length ? (
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {data.videos.map((v) => {
            const product = v.related_product_slug ? data.products.find((p) => p.slug === v.related_product_slug) : undefined;
            return (
              <article key={v.id}>
                <YouTubeEmbed videoId={v.youtube_id} title={v.title} url={v.youtube_url} thumbnail={v.thumbnail_url} />
                {v.description && <p className="mt-3 text-sm text-muted">{v.description}</p>}
                {product && (
                  <Link href={productHref(product.slug)} className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">
                    View {product.name} →
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card mt-10 p-10 text-center text-muted">Videos are coming soon.</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const SECTION_LABELS: Record<string, string> = {
  product: "Products",
  preparation: "Preparation",
  village: "Village",
  maker: "The maker",
  other: "More",
};

export function GalleryView() {
  const { data } = useCatalogue();
  const [section, setSection] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const sections = Array.from(new Set(data.gallery.map((g) => g.section)));
  const images = data.gallery.filter((g) => !section || g.section === section);
  const current = open !== null ? images[open] : null;

  return (
    <div className="container-page py-10">
      <PageIntro eyebrow="Gallery" title="Photos from home">
        Our products, our kitchen and our village.
      </PageIntro>
      {sections.length > 1 && (
        <div role="group" aria-label="Filter photos" className="mt-8 flex flex-wrap gap-2">
          {["", ...sections].map((s) => (
            <button
              key={s || "all"}
              type="button"
              aria-pressed={section === s}
              onClick={() => setSection(s)}
              className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-sand aria-pressed:border-brand aria-pressed:bg-brand aria-pressed:text-white"
            >
              {s ? SECTION_LABELS[s] || s : "All"}
            </button>
          ))}
        </div>
      )}
      {images.length ? (
        <ul className="mt-8 columns-2 gap-3 md:columns-3">
          {images.map((g, i) => (
            <li key={g.id} className="mb-3 break-inside-avoid">
              <button type="button" onClick={() => setOpen(i)} className="block w-full overflow-hidden rounded-2xl" aria-label={`Open photo: ${g.alt || g.caption || "photo"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt={g.alt || g.caption} loading="lazy" className="w-full transition hover:scale-[1.02]" />
              </button>
              {g.caption && <p className="mt-1.5 text-sm text-muted">{g.caption}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {["sweets", "pickles", "village"].map((n) => (
            <div key={n} className="card aspect-[4/3] overflow-hidden">
              <SafeImage src={null} alt="Illustration – photos coming soon" fallback={`/placeholders/${n}.svg`} />
            </div>
          ))}
          <p className="text-muted sm:col-span-3">Photos are coming soon.</p>
        </div>
      )}

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || current.caption || "Photo"}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/90 p-4"
          onClick={() => setOpen(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(null);
            if (e.key === "ArrowRight" && open !== null) setOpen((open + 1) % images.length);
            if (e.key === "ArrowLeft" && open !== null) setOpen((open - 1 + images.length) % images.length);
          }}
        >
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.alt || current.caption} className="max-h-[80vh] w-auto rounded-xl" />
            {current.caption && <figcaption className="mt-3 text-center text-cream">{current.caption}</figcaption>}
          </figure>
          <button type="button" autoFocus onClick={() => setOpen(null)} className="btn absolute top-4 right-4 bg-cream text-ink">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ContactView() {
  const { text, whatsapp, businessName } = useContent();
  const wa = waLink(whatsapp, `Hello ${businessName}! I have a question about your products.`);
  const phone = text("phone_number");
  const email = text("contact_email");

  return (
    <div className="container-page py-10">
      <PageIntro eyebrow="Contact" title="Talk to us">
        Ask about products, pack sizes, festival orders or delivery to your PIN code. {text("response_time")}
      </PageIntro>
      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <aside className="space-y-4 lg:col-span-2">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 hover:border-whatsapp/50">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-whatsapp text-white"><IconWhatsApp /></span>
              <span>
                <span className="block font-semibold">WhatsApp</span>
                <span className="text-sm text-muted">Opens WhatsApp with a message ready – just press Send.</span>
              </span>
            </a>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="card flex items-center gap-4 p-5 hover:border-brand/40">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand"><IconPhone /></span>
              <span>
                <span className="block font-semibold">Call</span>
                <span className="text-sm text-muted">{phone}</span>
              </span>
            </a>
          )}
          {email && (
            <p className="card p-5 text-sm">
              <span className="block font-semibold">Email</span>
              <a href={`mailto:${email}`} className="text-brand hover:underline">{email}</a>
            </p>
          )}
          {text("location") && (
            <p className="card flex items-start gap-3 p-5 text-sm">
              <IconPin className="mt-0.5 shrink-0 text-brand" />
              <span>
                <span className="block font-semibold">Location</span>
                {text("location")}
              </span>
            </p>
          )}
          <div className="card p-5 text-sm">
            <p className="font-semibold">Delivery</p>
            <p className="mt-1 text-muted">{text("delivery_note")}</p>
          </div>
        </aside>
        <section className="card p-6 lg:col-span-3" aria-labelledby="callback-title">
          <h2 id="callback-title" className="text-2xl font-semibold">Request a callback</h2>
          <p className="mt-1 mb-6 text-sm text-muted">Leave your number and we&apos;ll get back to you.</p>
          <CallbackForm idPrefix="contact" />
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function LegalView({ contentKey }: { contentKey: "privacy_notice" | "disclaimer" }) {
  const { block, text, businessName } = useContent();
  const b = block(contentKey);
  const phone = text("phone_number");
  const email = text("contact_email");
  return (
    <article className="container-page max-w-3xl py-10">
      <p className="eyebrow">{businessName}</p>
      <h1 className="mt-2 text-4xl font-semibold">{b.title}</h1>
      {contentKey === "privacy_notice" && (
        <p className="mt-2 text-sm text-muted">Version {text("privacy_notice_version")}</p>
      )}
      <RichText text={b.body} className="mt-8 text-ink/90" />
      {(phone || email || text("whatsapp_number")) && (
        <div className="card mt-10 p-5 text-sm">
          <p className="font-semibold">Contact for questions or data requests</p>
          <ul className="mt-2 space-y-1 text-muted">
            {text("whatsapp_number") && <li>WhatsApp: +{text("whatsapp_number")}</li>}
            {phone && <li>Phone: {phone}</li>}
            {email && <li>Email: {email}</li>}
          </ul>
        </div>
      )}
    </article>
  );
}
