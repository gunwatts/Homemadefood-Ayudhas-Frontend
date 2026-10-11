import type { Metadata } from "next";
import { OrderView } from "@/components/OrderView";

export const metadata: Metadata = {
  title: "Order list",
  description: "Review your order list and send an order request. No payment is taken online.",
  robots: { index: false },
};

export default function OrderPage() {
  return <OrderView />;
}
