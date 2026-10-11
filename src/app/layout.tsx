import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { PublicShell } from "@/components/PublicShell";
import { SNAPSHOT } from "@/lib/snapshot";
import { asset, BASE_PATH, SITE_URL } from "@/lib/config";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const name = SNAPSHOT.content.business_name?.body || "Ayudhas";
const tagline = SNAPSHOT.content.tagline?.body || "Home-made sweets & pickles";

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}${BASE_PATH}/`),
  title: { default: `${name} – ${tagline}`, template: `%s | ${name}` },
  description: `${tagline}. Browse the catalogue and send an order request – we confirm availability, delivery and charges with you on WhatsApp.`,
  icons: { icon: asset("/favicon.svg") },
  openGraph: { type: "website", siteName: name, locale: "en_IN" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#8c2f23",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <PublicShell>{children}</PublicShell>
        </Providers>
      </body>
    </html>
  );
}
