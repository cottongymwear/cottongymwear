import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { stripeConfigured } from "@/lib/site";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutForm paymentsLive={stripeConfigured()} />;
}
