"use client";

import Link from "next/link";
import { findVariant, formatGbp } from "@/lib/catalog";
import { useCart } from "./CartProvider";

export function CartView() {
  const { lines, ready, setQuantity, remove } = useCart();

  if (!ready) {
    return (
      <p className="empty shell" aria-live="polite">
        Loading your bag…
      </p>
    );
  }

  const detailed = lines.flatMap((line) => {
    const match = findVariant(line.sku);
    if (!match) return [];
    return [{ ...line, match }];
  });

  if (!detailed.length) {
    return (
      <div className="empty shell">
        <h1>Your bag is empty</h1>
        <p className="lede">Cotton jersey for lifting and the walk out.</p>
        <p className="cta-row">
          <Link className="btn" href="/shop">
            Shop the catalog
          </Link>
        </p>
      </div>
    );
  }

  const subtotal = detailed.reduce((sum, line) => sum + line.match.product.price * line.quantity, 0);

  return (
    <div className="shell section">
      <h1>Bag</h1>
      <ul className="stack" style={{ listStyle: "none", padding: 0 }}>
        {detailed.map((line) => (
          <li className="summary" key={line.sku}>
            <div className="row">
              <div>
                <strong>
                  {line.match.product.audience === "men"
                    ? "Men’s "
                    : line.match.product.audience === "women"
                      ? "Women’s "
                      : ""}
                  {line.match.product.name}
                </strong>
                <p className="meta">
                  {line.match.variant.color} · {line.match.variant.size}
                </p>
              </div>
              <p>{formatGbp(line.match.product.price * line.quantity)}</p>
            </div>
            <div className="qty">
              <button
                type="button"
                aria-label={`Decrease quantity of ${line.match.product.name}`}
                onClick={() => setQuantity(line.sku, line.quantity - 1)}
              >
                −
              </button>
              <span>{line.quantity}</span>
              <button
                type="button"
                aria-label={`Increase quantity of ${line.match.product.name}`}
                onClick={() => setQuantity(line.sku, line.quantity + 1)}
              >
                +
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => remove(line.sku)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="row" style={{ marginTop: 18 }}>
        <span>Subtotal</span>
        <strong>{formatGbp(subtotal)}</strong>
      </div>
      <p className="fine">Shipping to the UK or the US is added at checkout. Prices are in GBP.</p>
      <p className="cta-row">
        <Link className="btn" href="/checkout">
          Checkout
        </Link>
        <Link className="btn btn--ghost" href="/shop">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
