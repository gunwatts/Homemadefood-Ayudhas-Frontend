import type { Metadata } from "next";
import { StoryView } from "@/components/InfoViews";

export const metadata: Metadata = { title: "Our story", description: "Meet the maker, see our village and how our sweets and pickles are made." };

export default function Page() {
  return <StoryView />;
}
