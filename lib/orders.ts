import { findVariant } from "./catalog";
import { applySyncLinks, fetchPrintfulRates, getSyncLinkMap } from "./printful";
import { isCountry, PREVIEW_RATES, PREVIEW_RATE_NOTICE } from "./shipping";
import type { PricedLine, Recipient, ShippingRate } from "./types";

export type CartRequestItem = { sku: string; quantity: number };

export class OrderError extends Error {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.fields = fields;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function priceItems(items: CartRequestItem[]): PricedLine[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderError("Your bag is empty.", { items: "Add a product first." });
  }
  if (items.length > 20) {
    throw new OrderError("Too many lines in this bag.");
  }

  const merged = new Map<string, number>();
  for (const item of items) {
    if (!item || typeof item.sku !== "string") {
      throw new OrderError("A bag line is missing its SKU.");
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 8) {
      throw new OrderError("Quantity must be between 1 and 8.", { [item.sku]: "Check quantity." });
    }
    merged.set(item.sku, (merged.get(item.sku) ?? 0) + quantity);
  }

  const lines: PricedLine[] = [];
  for (const [sku, quantity] of merged) {
    if (quantity > 8) {
      throw new OrderError("Quantity must be between 1 and 8.", { [sku]: "Maximum 8." });
    }
    const match = findVariant(sku);
    if (!match) {
      throw new OrderError(`Unknown product ${sku}.`);
    }
    lines.push({
      sku,
      productId: match.product.id,
      name: match.product.name,
      color: match.variant.color,
      size: match.variant.size,
      quantity,
      unitPrice: match.product.price,
      lineTotal: match.product.price * quantity,
      syncVariantId: match.variant.syncVariantId,
      catalogVariantId: match.variant.catalogVariantId,
    });
  }
  return lines;
}

export function subtotalOf(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export async function quoteForCart(input: {
  country: string;
  postcode?: string;
  city?: string;
  region?: string;
  items: CartRequestItem[];
}): Promise<{ source: "printful" | "preview"; rates: ShippingRate[]; notice?: string }> {
  if (!isCountry(input.country)) {
    throw new OrderError("Shipping is available to the UK and the US.", { country: "Choose UK or US." });
  }
  const priced = priceItems(input.items);
  let lines = priced;
  try {
    const links = await getSyncLinkMap();
    lines = applySyncLinks(priced, links);
  } catch {
    lines = priced;
  }

  try {
    const live = await fetchPrintfulRates({
      recipient: {
        country: input.country,
        postcode: input.postcode ?? "",
        city: input.city ?? "",
        region: input.region ?? "",
      },
      lines,
    });
    if (live && live.length) {
      return { source: "printful", rates: live };
    }
  } catch {
    // Fall back to sample rates so checkout still works.
  }

  return {
    source: "preview",
    rates: PREVIEW_RATES[input.country],
    notice: PREVIEW_RATE_NOTICE,
  };
}

export function readRecipient(body: Record<string, unknown>): Recipient {
  const fields: Record<string, string> = {};
  const text = (key: string) => (typeof body[key] === "string" ? body[key].trim() : "");

  const name = text("name");
  const email = text("email");
  const address1 = text("address1");
  const city = text("city");
  const postcode = text("postcode");
  const country = text("country");
  const region = text("region");

  if (name.length < 2) fields.name = "Enter the recipient’s name.";
  if (!EMAIL.test(email)) fields.email = "Enter a valid email.";
  if (address1.length < 3) fields.address1 = "Enter the first address line.";
  if (city.length < 2) fields.city = "Enter the city.";
  if (!isCountry(country)) fields.country = "Choose the United Kingdom or the United States.";
  if (country === "US" && region.length < 2) fields.region = "Enter the state.";
  if (country === "GB" && postcode.length < 5) fields.postcode = "Enter a UK postcode.";
  if (country === "US" && !/^\d{5}(-\d{4})?$/.test(postcode)) {
    fields.postcode = "Enter a 5-digit ZIP code.";
  }

  if (Object.keys(fields).length) {
    throw new OrderError("Check the delivery address.", fields);
  }

  return {
    name,
    email,
    phone: text("phone"),
    address1,
    address2: text("address2"),
    city,
    region,
    postcode: postcode.toUpperCase(),
    country: country as "GB" | "US",
  };
}

export async function priceCheckout(input: {
  items: CartRequestItem[];
  recipient: Recipient;
  shippingMethod: string;
}) {
  const quote = await quoteForCart({
    country: input.recipient.country,
    postcode: input.recipient.postcode,
    city: input.recipient.city,
    region: input.recipient.region,
    items: input.items,
  });
  const rate = quote.rates.find((entry) => entry.id === input.shippingMethod);
  if (!rate) {
    throw new OrderError("Choose a shipping method.", { shippingMethod: "Pick a rate." });
  }

  let lines = priceItems(input.items);
  try {
    lines = applySyncLinks(lines, await getSyncLinkMap());
  } catch {
    // Keep catalog lines; fulfillment will report that variants are unlinked.
  }

  const subtotal = subtotalOf(lines);
  return {
    lines,
    rate,
    quoteSource: quote.source,
    subtotal,
    total: subtotal + rate.amount,
  };
}
