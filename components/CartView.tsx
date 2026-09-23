"use client";

import Link from "next/link";
import { findVariant, formatGbp } from "@/lib/catalog";
import { BagLine } from "./BagLine";
import { useCart } from "./CartProvider";
import { BagIcon } from "./Icons";

export function CartView() {
  const { lines, ready, count } = useCart();

  if (!ready) {
    return (
      <div className="shell page">
        <p className="muted" aria-live="polite">
          Loading your bag…
        </p>
      </div>
    );
  }

  const detailed = lines.flatMap((line) => {
    const match = findVariant(line.sku);
    return match ? [{ ...line, ...match }] : [];
  });

  if (!detailed.length) {
    return (
      <div className="shell page">
        <div className="empty-state">
          <span className="empty-icon">
            <BagIcon size={28} />
          </span>
          <h1 className="empty-title">Your bag is empty</h1>
          <p className="muted">Tees, tanks, and long sleeves in 100% cotton.</p>
          <div className="cta-row">
            <Link className="btn" href="/men">
              Shop men
            </Link>
            <Link className="btn btn--secondary" href="/women">
              Shop women
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = detailed.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  return (
    <div className="shell page">
      <header className="page-head page-head--tight">
        <h1>Bag</h1>
        <p className="muted">
          {count} {count === 1 ? "item" : "items"}
        </p>
      </header>
      <div className="split">
        <ul className="bag-lines bag-lines--page">
          {detailed.map((line) => (
            <BagLine key={line.sku} product={line.product} variant={line.variant} quantity={line.quantity} />
          ))}
        </ul>
        <aside className="summary-card" aria-label="Bag summary">
          <h2 className="summary-title">Summary</h2>
          <p className="total-row">
            <span>Subtotal</span>
            <span>{formatGbp(subtotal)}</span>
          </p>
          <p className="total-row">
            <span>Delivery</span>
            <span className="muted">At checkout</span>
          </p>
          <p className="total-row total-row--grand">
            <span>Total</span>
            <strong>{formatGbp(subtotal)}</strong>
          </p>
          <Link className="btn btn--block" href="/checkout">
            Checkout
          </Link>
          <p className="fine">Prices in GBP. Printed to order by Printful and shipped to the UK or the US.</p>
        </aside>
      </div>
    </div>
  );
}
