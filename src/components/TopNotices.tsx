"use client";

import { useContent } from "@/lib/catalogue";

export function TopNotices() {
  const { text, flag } = useContent();
  const announcement = text("announcement");
  const preview = flag("show_preview_notice");
  if (!announcement && !preview) return null;
  return (
    <div className="text-center text-sm">
      {preview && (
        <p className="bg-turmeric-soft px-4 py-2 text-ink">
          <strong>Preview:</strong> product details, prices and photos on this site are sample content awaiting the
          owner&apos;s confirmation.
        </p>
      )}
      {announcement && <p className="bg-brand px-4 py-2 font-medium text-white">{announcement}</p>}
    </div>
  );
}
