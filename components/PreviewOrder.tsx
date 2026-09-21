"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatGbp } from "@/lib/catalog";

type PreviewOrderData = {
  id: string;
  subtotal: number;
  total: number;
  shipping: { name: string; amount: number };
  recipient: { name: string; city: string; postcode: string; country: string };
  lines: { name: string; color: string; size: string; quantity: number; lineTotal: number }[];
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

  if (order === undefined) return <p className="shell section">Loading order…</p>;
  if (!order) {
    return (
      <div className="empty shell">
        <h1>No preview order</h1>
        <p className="lede">Place a preview order from checkout to see it here.</p>
      </div>
    );
  }

  return (
    <div className="shell section prose">
      <p className="banner" role="status">
        Preview only. No payment was taken and nothing was sent to Printful.
      </p>
      <h1>Order {order.id}</h1>
      <p>
        Deliver to {order.recipient.name}, {order.recipient.city} {order.recipient.postcode},{" "}
        {order.recipient.country === "GB" ? "United Kingdom" : "United States"}.
      </p>
      <ul>
        {order.lines.map((line) => (
          <li key={`${line.name}-${line.color}-${line.size}`}>
            {line.name} · {line.color} · {line.size} × {line.quantity} — {formatGbp(line.lineTotal)}
          </li>
        ))}
      </ul>
      <p>
        {order.shipping.name} {formatGbp(order.shipping.amount)}. Total {formatGbp(order.total)} (subtotal{" "}
        {formatGbp(order.subtotal)}).
      </p>
      <p>
        <Link className="btn" href="/shop">
          Back to the shop
        </Link>
      </p>
    </div>
  );
}
