import { OrderError, priceCheckout, readRecipient } from "@/lib/orders";
import { getSiteUrl, stripeConfigured } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Send a JSON checkout body." }, { status: 400 });
  }

  try {
    const recipient = readRecipient(body);
    const items = Array.isArray(body.items) ? body.items : [];
    const shippingMethod = typeof body.shippingMethod === "string" ? body.shippingMethod : "";
    const priced = await priceCheckout({
      items: items as { sku: string; quantity: number }[],
      recipient,
      shippingMethod,
    });

    const order = {
      id: `preview_${crypto.randomUUID().slice(0, 8)}`,
      lines: priced.lines.map((line) => ({
        sku: line.sku,
        name: line.name,
        color: line.color,
        size: line.size,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
      shipping: { id: priced.rate.id, name: priced.rate.name, amount: priced.rate.amount },
      subtotal: priced.subtotal,
      total: priced.total,
      recipient: {
        name: recipient.name,
        city: recipient.city,
        postcode: recipient.postcode,
        country: recipient.country,
      },
      quoteSource: priced.quoteSource,
    };

    const stripe = getStripe();
    if (!stripe || !stripeConfigured()) {
      return Response.json({ mode: "preview", order });
    }

    const site = getSiteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: recipient.email,
      success_url: `${site}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/checkout?canceled=1`,
      metadata: {
        name: recipient.name,
        email: recipient.email,
        phone: recipient.phone,
        address1: recipient.address1,
        address2: recipient.address2,
        city: recipient.city,
        region: recipient.region,
        postcode: recipient.postcode,
        country: recipient.country,
        shippingMethod: priced.rate.id,
        quoteSource: priced.quoteSource,
        items: priced.lines.map((line) => `${line.sku}:${line.quantity}`).join(","),
      },
      line_items: [
        ...priced.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "gbp",
            unit_amount: line.unitPrice,
            product_data: {
              name: `${line.name} — ${line.color} / ${line.size}`,
              metadata: { sku: line.sku },
            },
          },
        })),
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: priced.rate.amount,
            product_data: { name: priced.rate.name },
          },
        },
      ],
    });

    if (!session.url) {
      return Response.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }
    return Response.json({ mode: "stripe", url: session.url });
  } catch (error) {
    if (error instanceof OrderError) {
      return Response.json({ error: error.message, fields: error.fields }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
