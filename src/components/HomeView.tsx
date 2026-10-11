"use client";

import Link from "next/link";
import { useCatalogue, useContent } from "@/lib/catalogue";
import { waLink } from "@/lib/whatsapp";
import { IconBag, IconTruck, IconWhatsApp } from "./Icons";
import { ProductCard } from "./ProductCard";
import { placeholderFor, SafeImage } from "./ProductPicture";
import { RichText } from "./RichText";
import { YouTubeEmbed } from "./YouTubeEmbed";

export function HomeView() {
  const { data } = useCatalogue();
  const { block, text, whatsapp, businessName } = useContent();
  const hero = block("hero");
  const story = block("story_short");
  const village = block("village");
  const featured = data.products.filter((p) => p.featured);
  const showcase = (featured.length ? featured : data.products).slice(0, 6);
  const video = data.videos.find((v) => v.featured) ?? data.videos[0];
  const wa = waLink(whatsapp, `Hello ${businessName}! I'd like to know more about your products.`);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-10 py-12 md:py-20 lg:grid-cols-2">
          <div>
            <p className="eyebrow">{text("location") || "Home-made · Small batches"}</p>
            <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">{hero.title}</h1>
            <RichText text={hero.body} className="mt-5 max-w-xl text-lg text-muted" />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products/" className="btn btn-primary">Browse products</Link>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <IconWhatsApp /> Chat on WhatsApp
                </a>
              ) : (
                <Link href="/story/" className="btn btn-secondary">Our story</Link>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-turmeric-soft" aria-hidden />
            <div className="card aspect-[4/3] overflow-hidden">
              <SafeImage src={hero.image_url} alt={hero.image_url ? hero.title : "Illustration of home-made sweets"} fallback="/placeholders/sweets.svg" eager />
            </div>
          </div>
        </div>
      </section>

      {/* How ordering works */}
      <section aria-labelledby="how" className="border-y border-line bg-paper">
        <div className="container-page py-10">
          <h2 id="how" className="sr-only">How ordering works</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {[
              { icon: <IconBag />, title: "1. Choose products", body: "Add sweets and pickles to your order list. Prices shown are product-only." },
              { icon: <IconWhatsApp />, title: "2. Send an order request", body: "Share your WhatsApp number, PIN code and how you'd like to receive it. No payment online." },
              { icon: <IconTruck />, title: "3. We confirm on WhatsApp", body: "We check availability, Delhivery or pickup options and any delivery charge, then agree everything with you." },
            ].map((s) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">{s.icon}</span>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Banners */}
      {data.banners.length > 0 && (
        <section className="container-page mt-12 grid gap-4 md:grid-cols-2">
          {data.banners.slice(0, 2).map((b) => (
            <div key={b.id} className={`relative overflow-hidden rounded-2xl bg-brand text-white ${data.banners.length === 1 ? "md:col-span-2" : ""}`}>
              {b.image_url && (
                <SafeImage src={b.image_url} alt="" fallback="/placeholders/village.svg" className="absolute inset-0 opacity-35" />
              )}
              <div className="relative p-6 sm:p-8">
                <p className="font-display text-2xl font-semibold">{b.title}</p>
                {b.subtitle && <p className="mt-2 max-w-md text-white/90">{b.subtitle}</p>}
                {b.link_url && (
                  <BannerLink href={b.link_url} className="btn mt-5 bg-white text-brand hover:bg-cream">
                    {b.link_label || "Learn more"}
                  </BannerLink>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Categories */}
      {data.categories.length > 0 && (
        <section className="container-page mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold">Shop by category</h2>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.categories.map((c) => (
              <li key={c.id}>
                <Link href={`/products/?category=${c.slug}`} className="group card flex items-center gap-4 overflow-hidden p-3 hover:border-brand/40">
                  <span className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={placeholderFor(c.slug)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </span>
                  <span>
                    <span className="block font-display text-xl font-semibold group-hover:text-brand">{c.name}</span>
                    {c.description && <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{c.description}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Featured products */}
      {showcase.length > 0 && (
        <section className="container-page mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">From our kitchen</p>
              <h2 className="mt-1 text-3xl font-semibold">{featured.length ? "Featured products" : "Our products"}</h2>
            </div>
            <Link href="/products/" className="shrink-0 text-sm font-semibold text-brand hover:underline">View all →</Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((p, i) => (
              <ProductCard key={p.id} product={p} eager={i < 3} />
            ))}
          </div>
        </section>
      )}

      {/* Story */}
      <section className="container-page mt-20 grid items-center gap-10 lg:grid-cols-2">
        <div className="card aspect-[4/3] overflow-hidden lg:order-2">
          <SafeImage src={story.image_url} alt={story.image_url ? story.title : "Illustration of a cooking pot"} fallback="/placeholders/maker.svg" />
        </div>
        <div>
          <p className="eyebrow">Our story</p>
          <h2 className="mt-2 text-3xl font-semibold">{story.title}</h2>
          <RichText text={story.body} className="mt-4 text-muted" />
          <Link href="/story/" className="btn btn-secondary mt-8">Read our story</Link>
        </div>
      </section>

      {/* Village + video */}
      <section className="container-page mt-20 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Where it&apos;s made</p>
          <h2 className="mt-2 text-3xl font-semibold">{village.title}</h2>
          <RichText text={village.body} className="mt-4 text-muted" />
          <div className="card mt-6 aspect-[16/9] overflow-hidden">
            <SafeImage src={village.image_url} alt={village.image_url ? village.title : "Illustration of a village"} fallback="/placeholders/village.svg" />
          </div>
        </div>
        <div>
          <p className="eyebrow">See how we make it</p>
          <h2 className="mt-2 text-3xl font-semibold">{video ? video.title : "Videos coming soon"}</h2>
          {video ? (
            <>
              <p className="mt-4 text-muted">{video.description}</p>
              <div className="mt-6">
                <YouTubeEmbed videoId={video.youtube_id} title={video.title} url={video.youtube_url} thumbnail={video.thumbnail_url} />
              </div>
              <Link href="/videos/" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">All videos →</Link>
            </>
          ) : (
            <p className="mt-4 text-muted">We&apos;re filming our kitchen and preparation process. Check back soon.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page mt-20">
        <div className="rounded-3xl bg-ink px-6 py-12 text-center text-cream sm:px-12">
          <h2 className="text-3xl font-semibold">Have a question before ordering?</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/80">
            Ask about pack sizes, festival orders or delivery to your PIN code. {text("response_time")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <IconWhatsApp /> WhatsApp us
              </a>
            )}
            <Link href="/contact/" className="btn bg-cream text-ink hover:bg-white">Request a callback</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function BannerLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (href.startsWith("/")) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
}
