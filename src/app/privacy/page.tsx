import type { Metadata } from "next";
import { LegalView } from "@/components/InfoViews";

export const metadata: Metadata = { title: "Privacy notice", description: "What personal information we collect, why, and how to ask for it to be deleted." };

export default function Page() {
  return <LegalView contentKey="privacy_notice" />;
}
