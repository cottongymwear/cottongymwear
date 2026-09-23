"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findVariant, formatGbp } from "@/lib/catalog";
import { CheckIcon } from "./Icons";
import { ProductArt } from "./ProductArt";

type PreviewOrderData = {
  id: string;
  subtotal: number;
  total: number;
  shipping: { name: string; amount: number };
  recipient: { name: string; city: string; postcode: string; country: string };
  lines: { sku?: string; name: string; color: string; size: string; quantity: number; lineTotal: number }[];
};

export function PreviewOrder() {
  const [order, setOrder] = useState<PreviewOrderData | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cgw-last-order");
      setOrder(raw ? (JSON.parse(raw) as PreviewOrderData) : null);
    } catch {
      setOrder(null);
    }
  }, []);

  if (order === undefined) {
    return (
      <div className="shell page">
        <p className="muted">Loading order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="shell page">
        <div className="empty-state">
          <h1 className="empty-title">No preview order</h1>
          <p className="muted">Place a preview order from checkout to see it here.</p>
          <Link className="btn" href="/shop">
            Shop the rack
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell page receipt">
      <div className="receipt-head">
        <span className="receipt-check">
          <CheckIcon size={26} />
        </span>
        <p className="eyebrow">Order {order.id}</p>
        <h1>Thank you, {order.recipient.name.split(" ")[0]}.</h1>
        <p className="notice" role="status">
          Preview only. No payment was taken and nothing was sent to Printful.
        </p>
      </div>

      <div className="summary-card receipt-card">
        <ul className="summary-lines">
          {order.lines.map((line) => {
            const match = line.sku ? findVariant(line.sku) : undefined;
            return (
              <li key={`${line.name}-${line.color}-${line.size}`}>
                <span className="summary-thumb">
                  {match ? (
                    <ProductArt product={match.product} colorId={match.variant.colorId} className="art art--thumb" />
                  ) : null}
                  <span className="summary-qty">{line.quantity}</span>
                </span>
                <span className="summary-name">
                  {line.name}
                  <span className="muted">
                    {line.color} · {line.size}
                  </span>
                </span>
                <span>{formatGbp(line.lineTotal)}</span>
              </li>
            );
          })}
        </ul>
        <p className="total-row">
          <span>Subtotal</span>
          <span>{formatGbp(order.subtotal)}</span>
        </p>
        <p className="total-row">
          <span>{order.shipping.name}</span>
          <span>{formatGbp(order.shipping.amount)}</span>
        </p>
        <p className="total-row total-row--grand">
          <span>Total</span>
          <strong>{formatGbp(order.total)}</strong>
        </p>
        <div className="receipt-address">
          <p className="footer-title">Delivering to</p>
          <p>
            {order.recipient.name}
            <br />
            {order.recipient.city} {order.recipient.postcode}
            <br />
            {order.recipient.country === "GB" ? "United Kingdom" : "United States"}
          </p>
        </div>
      </div>

      <div className="cta-row cta-row--center">
        <Link className="btn btn--lg" href="/shop">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
