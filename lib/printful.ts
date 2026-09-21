import { findVariant } from "./catalog";
import { printfulConfigured } from "./site";
import type { PricedLine, Recipient, ShippingRate } from "./types";

const API_BASE = "https://api.printful.com";

type SyncVariant = {
  id: number;
  external_id?: string | null;
  variant_id?: number | null;
  color?: string | null;
  size?: string | null;
};

type SyncProductDetail = {
  sync_product: { id: number; external_id?: string | null; name?: string };
  sync_variants: SyncVariant[];
};

type SyncProductListItem = {
  id: number;
  external_id?: string | null;
};

export type LinkedVariant = {
  syncVariantId: number;
  catalogVariantId: number | null;
};

type RateResponse = {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
};

let linkCache: { at: number; map: Map<string, LinkedVariant> } | null = null;

async function printful<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) {
    throw new Error("PRINTFUL_API_KEY is not set.");
  }
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Content-Type", "application/json");
  if (process.env.PRINTFUL_STORE_ID) {
    headers.set("X-PF-Store-Id", process.env.PRINTFUL_STORE_ID);
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const body = (await response.json()) as {
    result?: T;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(body.error?.message || `Printful responded ${response.status}.`);
  }
  return body.result as T;
}

/** Map local SKUs (external ids) to Printful sync variants. Empty when unconfigured. */
export async function getSyncLinkMap(): Promise<Map<string, LinkedVariant>> {
  if (!printfulConfigured()) return new Map();
  if (linkCache && Date.now() - linkCache.at < 60_000) return linkCache.map;

  const listed = await printful<SyncProductListItem[]>("/store/products");
  const map = new Map<string, LinkedVariant>();

  for (const item of listed) {
    const detail = await printful<SyncProductDetail>(`/store/products/${item.id}`);
    for (const variant of detail.sync_variants ?? []) {
      const sku = variant.external_id?.trim();
      if (!sku) continue;
      map.set(sku, {
        syncVariantId: variant.id,
        catalogVariantId: variant.variant_id ?? null,
      });
    }
  }

  linkCache = { at: Date.now(), map };
  return map;
}

export function applySyncLinks(
  lines: PricedLine[],
  links: Map<string, LinkedVariant>,
): PricedLine[] {
  return lines.map((line) => {
    const link = links.get(line.sku);
    if (!link) return line;
    return {
      ...line,
      syncVariantId: link.syncVariantId,
      catalogVariantId: link.catalogVariantId ?? line.catalogVariantId,
    };
  });
}

export async function fetchPrintfulRates(input: {
  recipient: Pick<Recipient, "country" | "postcode" | "city" | "region">;
  lines: PricedLine[];
}): Promise<ShippingRate[] | null> {
  if (!printfulConfigured()) return null;
  if (input.lines.some((line) => !line.catalogVariantId)) return null;

  const result = await printful<RateResponse[]>("/shipping/rates", {
    method: "POST",
    body: JSON.stringify({
      recipient: {
        country_code: input.recipient.country,
        state_code: input.recipient.region || undefined,
        city: input.recipient.city || undefined,
        zip: input.recipient.postcode || undefined,
      },
      items: input.lines.map((line) => ({
        variant_id: line.catalogVariantId,
        quantity: line.quantity,
      })),
      currency: "GBP",
    }),
  });

  const gbp = result.filter((rate) => rate.currency === "GBP");
  if (!gbp.length) return null;

  return gbp.map((rate) => ({
    id: rate.id,
    name: rate.name,
    detail:
      rate.minDeliveryDays && rate.maxDeliveryDays
        ? `Printful estimate: ${rate.minDeliveryDays}–${rate.maxDeliveryDays} days after fulfillment.`
        : "Live rate from Printful.",
    amount: Math.round(Number.parseFloat(rate.rate) * 100),
    currency: "GBP",
  }));
}

export async function createPrintfulOrder(input: {
  externalId: string;
  recipient: Recipient;
  lines: PricedLine[];
  shippingMethod: string;
}): Promise<{ id: number; status: string; dashboardUrl: string }> {
  const missing = input.lines.filter((line) => !line.syncVariantId);
  if (missing.length) {
    const skus = missing.map((line) => line.sku).join(", ");
    throw new Error(
      `These SKUs are not linked to Printful sync variants yet: ${skus}. Set each variant external_id to the SKU.`,
    );
  }

  const confirm = process.env.PRINTFUL_AUTO_CONFIRM === "true";

  const order = await printful<{ id: number; status: string }>(
    `/orders?confirm=${confirm ? "1" : "0"}`,
    {
      method: "POST",
      body: JSON.stringify({
        external_id: input.externalId.slice(0, 32),
        shipping: input.shippingMethod,
        recipient: {
          name: input.recipient.name,
          email: input.recipient.email,
          phone: input.recipient.phone || undefined,
          address1: input.recipient.address1,
          address2: input.recipient.address2 || undefined,
          city: input.recipient.city,
          state_code: input.recipient.region || undefined,
          country_code: input.recipient.country,
          zip: input.recipient.postcode,
        },
        items: input.lines.map((line) => ({
          sync_variant_id: line.syncVariantId,
          quantity: line.quantity,
          retail_price: (line.unitPrice / 100).toFixed(2),
          name: `${line.name} / ${line.color} / ${line.size}`,
        })),
      }),
    },
  );

  return {
    id: order.id,
    status: order.status,
    dashboardUrl: "https://www.printful.com/dashboard/default/orders",
  };
}

export async function printfulStatus() {
  if (!printfulConfigured()) {
    return { configured: false as const, matchedSkus: 0, storeProducts: 0 };
  }
  try {
    const map = await getSyncLinkMap();
    let matched = 0;
    for (const sku of map.keys()) {
      if (findVariant(sku)) matched += 1;
    }
    const listed = await printful<SyncProductListItem[]>("/store/products");
    return {
      configured: true as const,
      matchedSkus: matched,
      storeProducts: listed.length,
    };
  } catch (error) {
    return {
      configured: true as const,
      matchedSkus: 0,
      storeProducts: 0,
      error: error instanceof Error ? error.message : "Printful request failed.",
    };
  }
}
