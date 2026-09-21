import { OrderError, quoteForCart } from "@/lib/orders";
import { isCountry, PREVIEW_RATES, PREVIEW_RATE_NOTICE } from "@/lib/shipping";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") || "GB";
  if (!isCountry(country)) {
    return Response.json({ error: "Shipping is available to the UK and the US." }, { status: 400 });
  }

  const items = (url.searchParams.get("items") || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [sku, quantity] = part.split(":");
      return { sku, quantity: Number(quantity || 1) };
    });

  if (!items.length) {
    return Response.json({
      source: "preview",
      rates: PREVIEW_RATES[country],
      notice: PREVIEW_RATE_NOTICE,
    });
  }

  try {
    const quote = await quoteForCart({
      country,
      postcode: url.searchParams.get("postcode") || undefined,
      city: url.searchParams.get("city") || undefined,
      region: url.searchParams.get("region") || undefined,
      items,
    });
    return Response.json(quote);
  } catch (error) {
    if (error instanceof OrderError) {
      return Response.json({ error: error.message, fields: error.fields }, { status: 400 });
    }
    throw error;
  }
}
