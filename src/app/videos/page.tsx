import type { Metadata } from "next";
import { VideosView } from "@/components/InfoViews";

export const metadata: Metadata = { title: "Videos", description: "Videos of how our home-made sweets and pickles are prepared." };

export default function Page() {
  return <VideosView />;
}
