"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AUDIENCE_POSSESSIVE, findVariant, formatGbp } from "@/lib/catalog";
import type { ShippingRate } from "@/lib/types";
import { useCart } from "./CartProvider";
import { BagIcon, LockIcon } from "./Icons";
import { ProductArt } from "./ProductArt";

type Quote = {
  source: "printful" | "preview";
  rates: ShippingRate[];
  notice?: string;
};

const ORDER_KEY = "cgw-last-order";

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <span className="error-text" id={id}>
      {message}
    </span>
  ) : null;
}

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
  const [summaryOpen, setSummaryOpen] = useState(false);

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
  const total = subtotal + (rate?.amount ?? 0);

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
    return (
      <div className="shell page">
        <p className="muted">Loading checkout…</p>
      </div>
    );
  }

  if (!detailed.length) {
    return (
      <div className="shell page">
        <div className="empty-state">
          <span className="empty-icon">
            <BagIcon size={28} />
          </span>
          <h1 className="empty-title">Nothing to check out</h1>
          <p className="muted">Add a piece to your bag, then come back here.</p>
          <Link className="btn" href="/shop">
            Shop the rack
          </Link>
        </div>
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

  const invalid = (key: string) =>
    fieldErrors[key] ? { "aria-invalid": true as const, "aria-describedby": `${key}-error` } : {};

  return (
    <div className="shell page checkout">
      <header className="page-head page-head--tight">
        <h1>Checkout</h1>
        {!paymentsLive ? (
          <p className="notice" role="note">
            Preview checkout. Stripe is not connected, so no card is charged and no Printful order is created.
          </p>
        ) : null}
      </header>

      <div className="split split--checkout">
        <aside className="summary-card checkout-summary" aria-label="Order summary" data-open={summaryOpen || undefined}>
          <button
            type="button"
            className="summary-toggle"
            aria-expanded={summaryOpen}
            aria-controls="order-summary-body"
            onClick={() => setSummaryOpen((open) => !open)}
          >
            <span>{summaryOpen ? "Hide order summary" : "Show order summary"}</span>
            <strong>{formatGbp(total)}</strong>
          </button>
          <div className="summary-body" id="order-summary-body">
            <h2 className="summary-title">Order summary</h2>
            <ul className="summary-lines">
              {detailed.map((line) => (
                <li key={line.sku}>
                  <span className="summary-thumb">
                    <ProductArt product={line.match.product} colorId={line.match.variant.colorId} className="art art--thumb" />
                    <span className="summary-qty">{line.quantity}</span>
                  </span>
                  <span className="summary-name">
                    {line.match.product.name}
                    <span className="muted">
                      {AUDIENCE_POSSESSIVE[line.match.product.audience]} · {line.match.variant.color} ·{" "}
                      {line.match.variant.size}
                    </span>
                  </span>
                  <span>{formatGbp(line.match.product.price * line.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="total-row">
              <span>Subtotal</span>
              <span>{formatGbp(subtotal)}</span>
            </p>
            <p className="total-row">
              <span>Delivery</span>
              <span>{rate ? formatGbp(rate.amount) : "—"}</span>
            </p>
            <p className="total-row total-row--grand">
              <span>Total</span>
              <strong>
                <span className="muted currency">GBP</span> {formatGbp(total)}
              </strong>
            </p>
          </div>
        </aside>

        <form
          className="checkout-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(new FormData(event.currentTarget));
          }}
        >
          {canceled ? (
            <p className="notice" role="status">
              Payment was canceled. Your bag is still here.
            </p>
          ) : null}
          {error ? (
            <p className="alert" role="alert">
              {error}
            </p>
          ) : null}

          <section className="form-section">
            <h2>Contact</h2>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required {...invalid("email")} />
              <FieldError id="email-error" message={fieldErrors.email} />
            </label>
            <label className="field">
              <span>
                Phone <span className="muted">(optional)</span>
              </span>
              <input name="phone" type="tel" autoComplete="tel" />
            </label>
          </section>

          <section className="form-section">
            <h2>Delivery</h2>
            <label className="field">
              <span>Country</span>
              <select
                name="country"
                value={country}
                onChange={(event) => setCountry(event.target.value === "US" ? "US" : "GB")}
              >
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
              </select>
            </label>
            <label className="field">
              <span>Full name</span>
              <input name="name" autoComplete="name" required {...invalid("name")} />
              <FieldError id="name-error" message={fieldErrors.name} />
            </label>
            <label className="field">
              <span>Address</span>
              <input name="address1" autoComplete="address-line1" required {...invalid("address1")} />
              <FieldError id="address1-error" message={fieldErrors.address1} />
            </label>
            <label className="field">
              <span>
                Flat, suite, etc. <span className="muted">(optional)</span>
              </span>
              <input name="address2" autoComplete="address-line2" />
            </label>
            <div className="field-row">
              <label className="field">
                <span>{country === "US" ? "City" : "Town or city"}</span>
                <input name="city" autoComplete="address-level2" required {...invalid("city")} />
                <FieldError id="city-error" message={fieldErrors.city} />
              </label>
              <label className="field">
                <span>
                  {country === "US" ? "State" : "County"}{" "}
                  {country === "GB" ? <span className="muted">(optional)</span> : null}
                </span>
                <input name="region" autoComplete="address-level1" required={country === "US"} {...invalid("region")} />
                <FieldError id="region-error" message={fieldErrors.region} />
              </label>
            </div>
            <label className="field">
              <span>{country === "US" ? "ZIP code" : "Postcode"}</span>
              <input
                name="postcode"
                autoComplete="postal-code"
                required
                value={postcode}
                onChange={(event) => setPostcode(event.target.value)}
                {...invalid("postcode")}
              />
              <FieldError id="postcode-error" message={fieldErrors.postcode} />
            </label>
          </section>

          <fieldset className="form-section rates">
            <legend>
              <h2>Delivery method</h2>
            </legend>
            {quote ? (
              quote.rates.map((entry) => (
                <label key={entry.id} className="rate">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={entry.id}
                    checked={shippingMethod === entry.id}
                    onChange={() => setShippingMethod(entry.id)}
                  />
                  <span className="rate-body">
                    <span className="rate-name">{entry.name}</span>
                    <span className="muted">{entry.detail}</span>
                  </span>
                  <span className="rate-price">{formatGbp(entry.amount)}</span>
                </label>
              ))
            ) : (
              <p className="muted">Loading delivery rates…</p>
            )}
            {quote?.notice ? <p className="fine">{quote.notice}</p> : null}
          </fieldset>

          <div className="pay">
            <button className="btn btn--block btn--lg" type="submit" disabled={pending || !rate}>
              {pending
                ? "Working…"
                : paymentsLive
                  ? `Pay ${formatGbp(total)}`
                  : `Place preview order · ${formatGbp(total)}`}
            </button>
            <p className="fine pay-note">
              <LockIcon size={14} />
              {paymentsLive
                ? "Card payment is handled by Stripe. Your order is sent to Printful once payment clears."
                : "Preview only. No card is charged and nothing is sent to Printful."}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
