import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Bag",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartView />;
}
