"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { findVariant, formatGbp } from "@/lib/catalog";
import type { ShippingRate } from "@/lib/types";
import { useCart } from "./CartProvider";

type Quote = {
  source: "printful" | "preview";
  rates: ShippingRate[];
  notice?: string;
};

const ORDER_KEY = "cgw-last-order";

export function CheckoutForm({ paymentsLive }: { paymentsLive: boolean }) {
  const { lines, ready, clear } = useCart();
  const [country, setCountry] = useState<"GB" | "US">("GB");
  const [postcode, setPostcode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [canceled, setCanceled] = useState(false);

  const detailed = useMemo(
    () =>
      lines.flatMap((line) => {
        const match = findVariant(line.sku);
        return match ? [{ ...line, match }] : [];
      }),
    [lines],
  );
  const subtotal = detailed.reduce((sum, line) => sum + line.match.product.price * line.quantity, 0);
  const rate = quote?.rates.find((entry) => entry.id === shippingMethod) ?? quote?.rates[0];

  useEffect(() => {
    setCanceled(new URLSearchParams(window.location.search).get("canceled") === "1");
  }, []);

  useEffect(() => {
    if (!ready || !detailed.length) return;
    const params = new URLSearchParams({
      country,
      items: detailed.map((line) => `${line.sku}:${line.quantity}`).join(","),
    });
    if (postcode.trim()) params.set("postcode", postcode.trim());
    const controller = new AbortController();
    fetch(`/api/shipping?${params}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body: Quote) => {
        setQuote(body);
        setShippingMethod((current) =>
          body.rates?.some((entry) => entry.id === current) ? current : body.rates?.[0]?.id ?? "STANDARD",
        );
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setQuote(null);
      });
    return () => controller.abort();
  }, [country, postcode, detailed, ready]);

  if (!ready) {
    return <p className="shell section">Loading checkout…</p>;
  }

  if (!detailed.length) {
    return (
      <div className="empty shell">
        <h1>Nothing to check out</h1>
        <p className="cta-row">
          <Link className="btn" href="/shop">
            Shop the catalog
          </Link>
        </p>
      </div>
    );
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setFieldErrors({});
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      address1: String(formData.get("address1") || ""),
      address2: String(formData.get("address2") || ""),
      city: String(formData.get("city") || ""),
      region: String(formData.get("region") || ""),
      postcode: String(formData.get("postcode") || ""),
      country,
      shippingMethod,
      items: detailed.map((line) => ({ sku: line.sku, quantity: line.quantity })),
    };
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        error?: string;
        fields?: Record<string, string>;
        mode?: "preview" | "stripe";
        url?: string;
        order?: unknown;
      };
      if (!response.ok) {
        setError(body.error || "Checkout failed.");
        setFieldErrors(body.fields || {});
        return;
      }
      if (body.mode === "stripe" && body.url) {
        window.location.href = body.url;
        return;
      }
      sessionStorage.setItem(ORDER_KEY, JSON.stringify(body.order));
      clear();
      window.location.href = "/checkout/confirmation?preview=1";
    } catch {
      setError("Could not reach checkout. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shell section layout-2">
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(new FormData(event.currentTarget));
        }}
      >
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Delivery</h1>
          <p className="lede">United Kingdom by default. United States is available too. Prices stay in GBP.</p>
        </div>
        {canceled ? (
          <p className="banner" role="status">
            Payment was canceled. Your bag is still here.
          </p>
        ) : null}
        {error ? (
          <p className="alert" role="alert">
            {error}
          </p>
        ) : null}
        <label>
          Full name
          <input name="name" autoComplete="name" required aria-invalid={Boolean(fieldErrors.name)} />
        </label>
        {fieldErrors.name ? <p className="fine">{fieldErrors.name}</p> : null}
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        {fieldErrors.email ? <p className="fine">{fieldErrors.email}</p> : null}
        <label>
          Phone <span className="fine">(optional)</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label>
          Country
          <select
            name="country"
            value={country}
            onChange={(event) => setCountry(event.target.value === "US" ? "US" : "GB")}
          >
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
          </select>
        </label>
        <label>
          Address line 1
          <input name="address1" autoComplete="address-line1" required />
        </label>
        {fieldErrors.address1 ? <p className="fine">{fieldErrors.address1}</p> : null}
        <label>
          Address line 2 <span className="fine">(optional)</span>
          <input name="address2" autoComplete="address-line2" />
        </label>
        <label>
          City
          <input name="city" autoComplete="address-level2" required />
        </label>
        <label>
          {country === "US" ? "State" : "County"} {country === "GB" ? <span className="fine">(optional)</span> : null}
          <input name="region" autoComplete="address-level1" required={country === "US"} />
        </label>
        {fieldErrors.region ? <p className="fine">{fieldErrors.region}</p> : null}
        <label>
          {country === "US" ? "ZIP code" : "Postcode"}
          <input
            name="postcode"
            autoComplete="postal-code"
            required
            value={postcode}
            onChange={(event) => setPostcode(event.target.value)}
          />
        </label>
        {fieldErrors.postcode ? <p className="fine">{fieldErrors.postcode}</p> : null}
        <fieldset className="rates">
          <legend>Shipping</legend>
          {(quote?.rates ?? []).map((entry) => (
            <label key={entry.id}>
              <input
                type="radio"
                name="shippingMethod"
                value={entry.id}
                checked={shippingMethod === entry.id}
                onChange={() => setShippingMethod(entry.id)}
              />
              <span>
                <strong>
                  {entry.name} · {formatGbp(entry.amount)}
                </strong>
                <br />
                <span className="fine">{entry.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {quote?.notice ? <p className="fine">{quote.notice}</p> : null}
        <button className="btn" type="submit" disabled={pending || !rate}>
          {pending
            ? "Working…"
            : paymentsLive
              ? `Pay ${formatGbp(subtotal + (rate?.amount ?? 0))} with Stripe`
              : `Place preview order · ${formatGbp(subtotal + (rate?.amount ?? 0))}`}
        </button>
        <p className="fine">
          {paymentsLive
            ? "Card payment is handled by Stripe. A paid order is sent to Printful from the webhook."
            : "Stripe is not configured, so this preview does not charge a card or create a Printful order."}
        </p>
      </form>
      <aside className="summary" aria-label="Order summary">
        <h2>Summary</h2>
        <ul>
          {detailed.map((line) => (
            <li className="row" key={line.sku}>
              <span>
                {line.match.product.name}
                <br />
                <span className="fine">
                  {line.match.variant.color} · {line.match.variant.size} · {line.quantity}
                </span>
              </span>
              <span>{formatGbp(line.match.product.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="row">
          <span>Subtotal</span>
          <span>{formatGbp(subtotal)}</span>
        </p>
        <p className="row">
          <span>Shipping</span>
          <span>{rate ? formatGbp(rate.amount) : "—"}</span>
        </p>
        <p className="row">
          <strong>Total</strong>
          <strong>{formatGbp(subtotal + (rate?.amount ?? 0))}</strong>
        </p>
      </aside>
    </div>
  );
}
