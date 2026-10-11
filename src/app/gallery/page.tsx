import type { Metadata } from "next";
import { GalleryView } from "@/components/InfoViews";

export const metadata: Metadata = { title: "Gallery", description: "Photos of our products, kitchen and village." };

export default function Page() {
  return <GalleryView />;
}
