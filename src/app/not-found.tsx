import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-page py-24 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-3 text-4xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-muted">It may have moved, or the product may no longer be listed.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/products/" className="btn btn-primary">Browse products</Link>
        <Link href="/" className="btn btn-secondary">Home</Link>
      </div>
    </section>
  );
}
