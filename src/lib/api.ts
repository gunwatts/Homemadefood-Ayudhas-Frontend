import { API_BASE } from "./config";

export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;
  code?: string;
  data: Record<string, unknown>;

  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.fields = (data.fields as Record<string, string>) || {};
    this.code = data.code as string | undefined;
    this.data = data;
  }

  /** True when the API could not be reached at all (offline, server asleep, CORS). */
  get isNetwork(): boolean {
    return this.status === 0;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  form?: FormData;
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!API_BASE) throw new ApiError(0, "The website is not connected to its server yet.");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method || (opts.body !== undefined || opts.form ? "POST" : "GET"),
      headers,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      signal: opts.signal,
      cache: "no-store",
      credentials: "omit",
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "We couldn't reach our server. Please check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  let data: Record<string, unknown> = {};
  const type = res.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  }
  if (!res.ok) {
    const message = (data.message as string) || `Something went wrong (error ${res.status}). Please try again.`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

/** Download a file (e.g. CSV export) that needs the admin token. */
export async function apiDownload(path: string, token: string, fallbackName: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    credentials: "omit",
  });
  if (!res.ok) throw new ApiError(res.status, "Export failed. Please sign in again and retry.");
  const disposition = res.headers.get("content-disposition") || "";
  const name = disposition.match(/filename="([^"]+)"/)?.[1] || fallbackName;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
