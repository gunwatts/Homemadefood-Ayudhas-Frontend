import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages: there is no Next.js server at runtime.
 * All live data comes from the FastAPI backend (NEXT_PUBLIC_API_BASE_URL).
 *
 * NEXT_PUBLIC_BASE_PATH: "/Homemadefood-Ayudhas-Frontend" for the GitHub project site
 * (https://gunwatts.github.io/Homemadefood-Ayudhas-Frontend/); empty for a custom domain.
 */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true, // /products/ → products/index.html, which GitHub Pages serves on refresh
  basePath: basePath || undefined,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
