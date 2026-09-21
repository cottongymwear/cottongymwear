import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { OrderError, priceCheckout, readRecipient } from "@/lib/orders";
import { createPrintfulOrder } from "@/lib/printful";
import { printfulConfigured } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return Response.json({ received: true, fulfillment: "unpaid" });
  }

  if (!printfulConfigured()) {
    return Response.json({
      received: true,
      fulfillment: "skipped",
      message: "Payment captured. PRINTFUL_API_KEY is not set, so no Printful order was created.",
    });
  }

  const meta = session.metadata || {};
  try {
    const recipient = readRecipient(meta);
    const items = (meta.items || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [sku, quantity] = part.split(":");
        return { sku, quantity: Number(quantity || 1) };
      });
    const retailShipping = meta.shippingMethod || "STANDARD";
    const shippingMethod = meta.quoteSource === "printful" ? retailShipping : "STANDARD";
    let priced;
    try {
      priced = await priceCheckout({
        items,
        recipient,
        shippingMethod: retailShipping,
      });
    } catch (error) {
      if (!(error instanceof OrderError) || !error.fields.shippingMethod) throw error;
      priced = await priceCheckout({
        items,
        recipient,
        shippingMethod: "STANDARD",
      });
    }
    const externalId = createHash("sha256").update(session.id).digest("hex").slice(0, 24);
    const order = await createPrintfulOrder({
      externalId,
      recipient,
      lines: priced.lines,
      shippingMethod,
    });
    return Response.json({
      received: true,
      fulfillment: "created",
      printfulOrderId: order.id,
      status: order.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fulfillment failed.";
    const permanent = /not linked|Check the delivery|Unknown product|Choose a shipping/.test(message);
    return Response.json(
      { received: true, fulfillment: permanent ? "skipped" : "error", message },
      { status: permanent ? 200 : 500 },
    );
  }
}
