import type { Metadata } from "next";
import { ContactView } from "@/components/InfoViews";

export const metadata: Metadata = { title: "Contact", description: "Contact us on WhatsApp or request a callback." };

export default function Page() {
  return <ContactView />;
}
