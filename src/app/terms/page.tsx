import type { Metadata } from "next";
import { LegalView } from "@/components/InfoViews";

export const metadata: Metadata = { title: "Terms & disclaimer", description: "This website is a catalogue: it does not take payments or confirm orders." };

export default function Page() {
  return <LegalView contentKey="disclaimer" />;
}
