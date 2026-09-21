import type { Metadata } from "next";
import Link from "next/link";
import { ClearBag } from "@/components/ClearBag";
import { PreviewOrder } from "@/components/PreviewOrder";
import { formatGbp } from "@/lib/catalog";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  if (params.preview === "1") return <PreviewOrder />;

  if (!params.session_id) {
    return (
      <div className="empty shell">
        <h1>No order to show</h1>
        <p className="lede">Checkout returns you here after payment.</p>
      </div>
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return (
      <div className="empty shell">
        <h1>Payments are not configured</h1>
      </div>
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(params.session_id);
    const paid = session.payment_status === "paid";
    const total = typeof session.amount_total === "number" ? formatGbp(session.amount_total) : null;
    return (
      <div className="shell section prose">
        {paid ? <ClearBag /> : null}
        <p className="banner" role="status">
          {paid
            ? "Payment received. Printful fulfillment runs from the Stripe webhook once variants are linked."
            : "This payment is not complete yet."}
        </p>
        <h1>{paid ? "Thank you" : "Payment pending"}</h1>
        {session.customer_email ? <p>Receipt email: {session.customer_email}</p> : null}
        {total ? <p>Total charged: {total}.</p> : null}
        <p>
        <Link className="btn" href="/shop">
          Back to the shop
        </Link>
        </p>
      </div>
    );
  } catch {
    return (
      <div className="empty shell">
        <h1>We could not find that payment</h1>
      </div>
    );
  }
}
