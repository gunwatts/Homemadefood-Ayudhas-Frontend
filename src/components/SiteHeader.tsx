"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useContent } from "@/lib/catalogue";
import { IconBag, IconClose, IconMenu } from "./Icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products/", label: "Products" },
  { href: "/story/", label: "Our story" },
  { href: "/videos/", label: "Videos" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/contact/", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const { count, hydrated } = useCart();
  const { businessName, text } = useContent();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/\/$/, "")));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${businessName} home`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand font-display text-lg font-bold text-turmeric-soft">
            {businessName.charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-xl font-semibold leading-tight text-ink">{businessName}</span>
            <span className="hidden truncate text-xs text-muted sm:block">{text("tagline")}</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-sand aria-[current=page]:bg-sand aria-[current=page]:text-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/order/" className="btn btn-primary relative px-4" aria-label={`Order list, ${hydrated ? count : 0} items`}>
            <IconBag />
            <span className="hidden sm:inline">Order list</span>
            {hydrated && count > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-turmeric px-1 text-xs font-bold text-ink">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="btn btn-ghost px-3 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <IconClose /> : <IconMenu />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-cream lg:hidden">
          <ul className="container-page grid gap-1 py-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand aria-[current=page]:bg-sand aria-[current=page]:text-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
