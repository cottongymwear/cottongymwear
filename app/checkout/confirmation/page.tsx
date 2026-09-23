import type { Metadata } from "next";
import Link from "next/link";
import { ClearBag } from "@/components/ClearBag";
import { CheckIcon } from "@/components/Icons";
import { PreviewOrder } from "@/components/PreviewOrder";
import { formatGbp } from "@/lib/catalog";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

function Message({ title, body }: { title: string; body?: string }) {
  return (
    <div className="shell page">
      <div className="empty-state">
        <h1 className="empty-title">{title}</h1>
        {body ? <p className="muted">{body}</p> : null}
        <Link className="btn" href="/shop">
          Back to the shop
        </Link>
      </div>
    </div>
  );
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  if (params.preview === "1") return <PreviewOrder />;

  if (!params.session_id) {
    return <Message title="No order to show" body="Checkout returns you here after payment." />;
  }

  const stripe = getStripe();
  if (!stripe) {
    return <Message title="Payments are not configured" />;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(params.session_id);
    const paid = session.payment_status === "paid";
    const total = typeof session.amount_total === "number" ? formatGbp(session.amount_total) : null;
    return (
      <div className="shell page receipt">
        {paid ? <ClearBag /> : null}
        <div className="receipt-head">
          {paid ? (
            <span className="receipt-check">
              <CheckIcon size={26} />
            </span>
          ) : null}
          <h1>{paid ? "Thank you." : "Payment pending"}</h1>
          <p className="lede">
            {paid
              ? "Payment received. Your order goes to Printful for printing."
              : "This payment is not complete yet."}
          </p>
          {session.customer_email ? <p className="muted">Receipt sent to {session.customer_email}</p> : null}
          {total ? <p className="muted">Total charged: {total}</p> : null}
        </div>
        <div className="cta-row cta-row--center">
          <Link className="btn btn--lg" href="/shop">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  } catch {
    return <Message title="We could not find that payment" />;
  }
}
