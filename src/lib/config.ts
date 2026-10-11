// Build-time public configuration. These values end up in the static site and are not secret.

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
// Origin only (no path), e.g. https://gunwatts.github.io — the base path is added separately.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gunwatts.github.io").replace(/\/$/, "");
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

/** Prefix a file in /public with the base path (next/link does this automatically for links). */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
