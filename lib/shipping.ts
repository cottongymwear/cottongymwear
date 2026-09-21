import type { ShippingRate } from "./types";

/** Sample GBP rates used until Printful can quote from linked catalog variants. */
export const PREVIEW_RATES: Record<"GB" | "US", ShippingRate[]> = {
  GB: [
    {
      id: "STANDARD",
      name: "UK Standard",
      detail: "Tracked. Typically 3–5 working days after printing.",
      amount: 395,
      currency: "GBP",
    },
    {
      id: "EXPRESS",
      name: "UK Express",
      detail: "Tracked. Typically 1–2 working days after printing.",
      amount: 795,
      currency: "GBP",
    },
  ],
  US: [
    {
      id: "STANDARD",
      name: "US Standard",
      detail: "Tracked from the nearest Printful facility. Typically 5–10 working days after printing.",
      amount: 895,
      currency: "GBP",
    },
    {
      id: "EXPRESS",
      name: "US Express",
      detail: "Faster international tracked service. Typically 3–6 working days after printing.",
      amount: 1495,
      currency: "GBP",
    },
  ],
};

export const PREVIEW_RATE_NOTICE =
  "These are sample GBP rates for the United Kingdom and the United States. Live Printful quotes replace them once each SKU is linked to a catalog variant and the store currency is GBP.";

export function isCountry(value: string): value is "GB" | "US" {
  return value === "GB" || value === "US";
}
