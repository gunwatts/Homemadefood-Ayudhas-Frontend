"use client";

/** Explains how admin edits reach the public static site. */
export function PublishNote() {
  return (
    <details className="card p-4 text-sm">
      <summary className="cursor-pointer font-semibold">When do changes appear on the website?</summary>
      <div className="mt-2 space-y-2 text-muted">
        <p>
          Prices, visibility, text and photos update on the website <strong>immediately</strong> for visitors (pages refresh
          their details from the server when they load).
        </p>
        <p>
          New products also work straight away. For the best Google search listing of brand-new products, the site is
          rebuilt automatically once a day – or your developer can run the &quot;Deploy website&quot; action on GitHub to
          publish immediately.
        </p>
      </div>
    </details>
  );
}
