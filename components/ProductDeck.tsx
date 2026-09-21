"use client";

import { useRef } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductDeck({ products }: { products: Product[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  function move(direction: number) {
    const node = scroller.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>(".card");
    const distance = (card?.offsetWidth ?? 280) + 18;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: direction * distance, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section className="section deck-section" aria-label="Catalog">
      <div className="section-head">
        <div>
          <p className="eyebrow">Eight solids</p>
          <h2>The rack</h2>
          <p className="note">Swipe across. Every piece is a 100% cotton solid. Placeholders stand in for Printful mockups.</p>
        </div>
        <div className="deck-nav">
          <button type="button" className="deck-btn" aria-label="Show previous pieces" onClick={() => move(-1)}>
            ‹
          </button>
          <button type="button" className="deck-btn" aria-label="Show more pieces" onClick={() => move(1)}>
            ›
          </button>
        </div>
      </div>
      <div className="deck" ref={scroller} tabIndex={0} role="region" aria-label="Cotton gym wear, swipe sideways">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="deck-progress">
        <span className="deck-hint">Swipe</span>
        <span className="deck-track" aria-hidden="true" />
      </div>
    </section>
  );
}
