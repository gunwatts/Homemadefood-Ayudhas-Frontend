"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MAX_LINE_QTY, useCart } from "@/lib/cart";
import { useCatalogue, useContent, useProduct } from "@/lib/catalogue";
import { formatPaise } from "@/lib/format";
import type { Product } from "@/lib/types";
import { productEnquiryText, waLink } from "@/lib/whatsapp";
import { CallbackForm } from "./CallbackForm";
import { IconCheck, IconInfo, IconPhone, IconTruck, IconWhatsApp } from "./Icons";
import { ProductCard } from "./ProductCard";
import { ProductPicture } from "./ProductPicture";
import { RichText } from "./RichText";
import { YouTubeEmbed } from "./YouTubeEmbed";

export function ProductDetail({ slug }: { slug: string }) {
  const { product, status } = useProduct(slug);

  if (!product) {
    if (status === "snapshot") {
      return <div className="container-page py-24 text-center text-muted">Loading product…</div>;
    }
    return (
      <section className="container-page py-24 text-center">
        <p className="eyebrow">Not available</p>
        <h1 className="mt-3 text-3xl font-semibold">This product isn&apos;t listed right now</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          It may be out of season or temporarily unavailable. Have a look at our other products, or ask us about it on
          WhatsApp.
        </p>
        <Link href="/products/" className="btn btn-primary mt-8">
          Browse products
        </Link>
      </section>
    );
  }
  return <ProductView product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const { data } = useCatalogue();
  const { whatsapp } = useContent();
  const cart = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [showCallback, setShowCallback] = useState(false);

  useEffect(() => {
    if (!product.variants.some((v) => v.id === variantId)) setVariantId(product.variants[0]?.id);
  }, [product, variantId]);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const wa = waLink(whatsapp, productEnquiryText(product.name, product.slug, variant?.label));
  const videos = data.videos.filter((v) => v.related_product_slug === product.slug);
  const related = data.products
    .filter((p) => p.slug !== product.slug && p.category_slug === product.category_slug)
    .slice(0, 3);

  function addToList() {
    if (!variant) return;
    cart.add(product.slug, variant.id, qty);
    setAdded(true);
  }

  const details: [string, string | null][] = [
    ["Ingredients", product.ingredients_text],
    ["Allergen information", product.allergen_text],
    ["Storage", product.storage_text],
    ["Shelf life", product.shelf_life_text],
  ];

  return (
    <>
      <nav aria-label="Breadcrumb" className="container-page pt-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-brand">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/products/" className="hover:text-brand">Products</Link></li>
          {product.category_slug && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/products/?category=${product.category_slug}`} className="hover:text-brand">
                  {product.category_name}
                </Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <section className="container-page grid gap-10 py-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="card aspect-[4/3] overflow-hidden">
            <ProductPicture product={product} index={imageIndex} eager />
          </div>
          {product.images.length > 1 && (
            <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Product photos">
              {product.images.map((img, i) => (
                <li key={img.url}>
                  <button
                    type="button"
                    onClick={() => setImageIndex(i)}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={i === imageIndex}
                    className="aspect-square w-full overflow-hidden rounded-xl border-2 border-transparent aria-pressed:border-brand"
                  >
                    <ProductPicture product={product} index={i} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary + order panel */}
        <div>
          {product.category_name && <p className="eyebrow">{product.category_name}</p>}
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          {product.short_description && <p className="mt-3 text-lg text-muted">{product.short_description}</p>}

          <div className="card mt-6 p-5">
            {product.variants.length > 1 ? (
              <fieldset>
                <legend className="label">Pack size</legend>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <label
                      key={v.id}
                      className="cursor-pointer rounded-xl border border-line bg-white px-4 py-2.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-turmeric"
                    >
                      <input
                        type="radio"
                        name="variant"
                        value={v.id}
                        checked={v.id === variant?.id}
                        onChange={() => {
                          setVariantId(v.id);
                          setAdded(false);
                        }}
                        className="sr-only"
                      />
                      <span className="font-semibold">{v.label}</span>
                      <span className="ml-2 text-muted">{formatPaise(v.price_paise)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              variant && <p className="text-sm text-muted">Pack size: <strong className="text-ink">{variant.label}</strong></p>
            )}

            {variant && (
              <p className="mt-4 text-3xl font-bold">
                {formatPaise(variant.price_paise)}
                <span className="ml-2 align-middle text-sm font-normal text-muted">per pack · product price only</span>
              </p>
            )}
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
              <IconTruck className="mt-0.5 shrink-0" width={16} height={16} />
              Delivery charge, if any, is extra and confirmed by us on WhatsApp after checking your PIN code.
            </p>

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="qty" className="label">Quantity</label>
                <div className="flex items-center rounded-full border border-line bg-white">
                  <button type="button" className="h-11 w-11 rounded-full text-lg hover:bg-sand" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                  <input
                    id="qty"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_LINE_QTY}
                    value={qty}
                    onChange={(e) => setQty(Math.min(MAX_LINE_QTY, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-12 [appearance:textfield] bg-transparent text-center font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button type="button" className="h-11 w-11 rounded-full text-lg hover:bg-sand" onClick={() => setQty((q) => Math.min(MAX_LINE_QTY, q + 1))} aria-label="Increase quantity">+</button>
                </div>
              </div>
              <button type="button" className="btn btn-primary flex-1" onClick={addToList} disabled={!variant}>
                Add to order list
              </button>
            </div>
            {added && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-green-800" role="status">
                <IconCheck /> Added to your order list.
                <Link href="/order/" className="font-semibold text-brand underline">Review &amp; place order request →</Link>
              </p>
            )}

            <div className="mt-5 grid gap-2 border-t border-line pt-5 sm:grid-cols-2">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <IconWhatsApp /> Enquire on WhatsApp
                </a>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setShowCallback((s) => !s)} aria-expanded={showCallback} aria-controls="callback-panel">
                <IconPhone width={18} height={18} /> Request a callback
              </button>
            </div>
            {wa && <p className="mt-2 text-xs text-muted">WhatsApp opens with a ready-made message – you just need to press Send.</p>}
            {showCallback && (
              <div id="callback-panel" className="mt-5 border-t border-line pt-5">
                <CallbackForm productId={product.id} productName={product.name} idPrefix="pcb" />
              </div>
            )}
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs text-muted">
            <IconInfo className="mt-0.5 shrink-0" width={16} height={16} />
            Placing an order request is not a purchase. We&apos;ll confirm availability, final delivery arrangement and
            any delivery charge with you on WhatsApp. No payment is taken on this website.
          </p>
        </div>
      </section>

      <section className="container-page grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {product.description && (
            <>
              <h2 className="text-2xl font-semibold">About this product</h2>
              <RichText text={product.description} className="mt-3 text-ink/90" />
            </>
          )}
          {product.preparation_text && (
            <>
              <h2 className="mt-10 text-2xl font-semibold">How it&apos;s made</h2>
              <RichText text={product.preparation_text} className="mt-3 text-ink/90" />
            </>
          )}
          {videos.length > 0 && (
            <div className="mt-10 grid gap-6">
              <h2 className="text-2xl font-semibold">Watch</h2>
              {videos.map((v) => (
                <YouTubeEmbed key={v.id} videoId={v.youtube_id} title={v.title} url={v.youtube_url} thumbnail={v.thumbnail_url} />
              ))}
            </div>
          )}
        </div>
        <aside>
          <dl className="card divide-y divide-line">
            {details.map(([label, value]) => (
              <div key={label} className="p-4">
                <dt className="text-sm font-bold">{label}</dt>
                <dd className="mt-1 text-sm text-muted">{value || "Please ask us for details."}</dd>
              </div>
            ))}
            {product.price_note && (
              <div className="p-4">
                <dt className="text-sm font-bold">Price note</dt>
                <dd className="mt-1 text-sm text-muted">{product.price_note}</dd>
              </div>
            )}
          </dl>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="container-page mt-16">
          <h2 className="text-2xl font-semibold">You may also like</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
