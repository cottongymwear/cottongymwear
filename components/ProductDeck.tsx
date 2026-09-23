"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { ArrowIcon } from "./Icons";
import { ProductCard, rotatingColor } from "./ProductCard";

export function ProductDeck({
  products,
  title,
  eyebrow,
  href,
  hrefLabel = "Shop all",
}: {
  products: Product[];
  title: string;
  eyebrow?: string;
  href?: string;
  hrefLabel?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [progress, setProgress] = useState({ offset: 0, size: 1 });

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const update = () => {
      const max = node.scrollWidth - node.clientWidth;
      setEdges({ start: node.scrollLeft <= 4, end: node.scrollLeft >= max - 4 });
      const size = node.scrollWidth ? node.clientWidth / node.scrollWidth : 1;
      setProgress({ size, offset: max > 0 ? (node.scrollLeft / max) * (1 - size) : 0 });
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function move(direction: number) {
    const node = scroller.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>(".pcard");
    const step = card ? card.offsetWidth + 16 : node.clientWidth * 0.8;
    const perView = Math.max(1, Math.floor(node.clientWidth / step));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollBy({ left: direction * step * perView, behavior: reduce ? "auto" : "smooth" });
  }

  const headingId = `${title.replace(/\W+/g, "-").toLowerCase()}-title`;

  return (
    <section className="section" aria-labelledby={headingId}>
      <div className="shell section-head">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 id={headingId}>{title}</h2>
        </div>
        <div className="section-actions">
          {href ? (
            <Link className="text-link" href={href}>
              {hrefLabel}
            </Link>
          ) : null}
          <div className="deck-nav">
            <button type="button" className="round-btn" aria-label="Previous" disabled={edges.start} onClick={() => move(-1)}>
              <ArrowIcon direction="left" size={18} />
            </button>
            <button type="button" className="round-btn" aria-label="Next" disabled={edges.end} onClick={() => move(1)}>
              <ArrowIcon size={18} />
            </button>
          </div>
        </div>
      </div>
      <div className="deck" ref={scroller} tabIndex={0} role="region" aria-label={`${title}, scroll sideways`}>
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} colorId={rotatingColor(product, index)} />
        ))}
      </div>
      <div className="shell deck-progress" aria-hidden="true">
        <span
          className="deck-thumb"
          style={{ width: `${progress.size * 100}%`, transform: `translateX(${(progress.offset / progress.size) * 100}%)` }}
        />
      </div>
    </section>
  );
}
