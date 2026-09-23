"use client";

import { useEffect, useRef, useState } from "react";
import { AUDIENCE_POSSESSIVE, CATEGORY_SINGULAR, formatGbp } from "@/lib/catalog";
import type { Product, Size } from "@/lib/types";
import { useCart } from "./CartProvider";
import { CheckIcon } from "./Icons";
import { ProductArt } from "./ProductArt";

export function ProductDetail({ product }: { product: Product }) {
  const { add, openBag } = useCart();
  const [colorId, setColorId] = useState(product.colors[0]?.id ?? "black");
  const [size, setSize] = useState<Size | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const gallery = useRef<HTMLDivElement>(null);
  const sizeGroup = useRef<HTMLFieldSetElement>(null);
  const programmatic = useRef<number | null>(null);

  const color = product.colors.find((entry) => entry.id === colorId) ?? product.colors[0];

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("color");
    const index = product.colors.findIndex((entry) => entry.id === requested);
    if (index < 1) return;
    setColorId(product.colors[index].id);
    const node = gallery.current;
    if (node) node.scrollLeft = index * node.clientWidth;
  }, [product.colors]);

  useEffect(() => {
    const node = gallery.current;
    if (!node) return;
    const onScroll = () => {
      if (programmatic.current !== null) return;
      const index = Math.round(node.scrollLeft / Math.max(1, node.clientWidth));
      const next = product.colors[Math.min(product.colors.length - 1, Math.max(0, index))];
      if (next) setColorId(next.id);
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [product.colors]);

  function chooseColor(id: string) {
    setColorId(id);
    setAdded(false);
    const node = gallery.current;
    const index = product.colors.findIndex((entry) => entry.id === id);
    if (!node || index < 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (programmatic.current !== null) window.clearTimeout(programmatic.current);
    programmatic.current = window.setTimeout(() => {
      programmatic.current = null;
    }, 600);
    node.scrollTo({ left: index * node.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!size) {
      setSizeError(true);
      sizeGroup.current?.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }
    const variant = product.variants.find((entry) => entry.colorId === colorId && entry.size === size);
    if (!variant) return;
    add(variant.sku, 1);
    setAdded(true);
    openBag();
  }

  return (
    <div className="pdp">
      <div className="pdp-gallery">
        <div className="gallery" ref={gallery} tabIndex={-1} aria-label={`${product.name} colours`}>
          {product.colors.map((entry) => (
            <ProductArt
              key={entry.id}
              product={product}
              colorId={entry.id}
              title={`${product.name} in ${entry.name}`}
              className="art gallery-slide"
            />
          ))}
        </div>
        <div className="gallery-dots" aria-hidden="true">
          {product.colors.map((entry) => (
            <i key={entry.id} data-active={entry.id === colorId || undefined} />
          ))}
        </div>
        <p className="fine gallery-note">Illustration. Printful mockups replace it once the artwork is uploaded.</p>
      </div>

      <form className="pdp-panel" onSubmit={onSubmit} noValidate>
        <p className="eyebrow">
          {AUDIENCE_POSSESSIVE[product.audience]} {CATEGORY_SINGULAR[product.category].toLowerCase()} · 100% cotton
        </p>
        <h1 className="pdp-title">{product.name}</h1>
        <p className="pdp-price">{formatGbp(product.price)}</p>
        <p className="pdp-summary">{product.summary}</p>

        <fieldset className="option">
          <legend>
            Colour <span className="muted">{color?.name}</span>
          </legend>
          <div className="swatch-row">
            {product.colors.map((entry) => (
              <label key={entry.id} className="swatch-choice" title={entry.name}>
                <input
                  type="radio"
                  name="color"
                  value={entry.id}
                  checked={colorId === entry.id}
                  onChange={() => chooseColor(entry.id)}
                />
                <span style={{ background: entry.swatch }} />
                <span className="sr-only">{entry.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset
          className="option"
          ref={sizeGroup}
          aria-invalid={sizeError || undefined}
          aria-describedby={sizeError ? "size-error" : undefined}
        >
          <legend>
            Size {sizeError ? <span id="size-error" className="error-text">Select a size</span> : null}
          </legend>
          <div className="size-grid" data-error={sizeError || undefined}>
            {product.sizes.map((entry) => (
              <label key={entry} className="size-choice">
                <input
                  type="radio"
                  name="size"
                  value={entry}
                  checked={size === entry}
                  onChange={() => {
                    setSize(entry);
                    setSizeError(false);
                    setAdded(false);
                  }}
                />
                <span>{entry}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="btn btn--block btn--lg" type="submit">
          {added ? (
            <>
              <CheckIcon size={18} /> Added to bag
            </>
          ) : (
            "Add to bag"
          )}
        </button>
        <p className="pdp-assurance">Printed to order · Ships to the UK and the US · Prices in GBP</p>

        <div className="accordion">
          <details open>
            <summary>Details</summary>
            <p>{product.description}</p>
          </details>
          <details>
            <summary>Cloth</summary>
            <p>{product.fabric.detail}</p>
            <p className="muted">Blank: {product.printful.blank}</p>
          </details>
          <details>
            <summary>Delivery</summary>
            <p>
              Printful prints each piece after you order, then ships it. United Kingdom and United States
              addresses. Delivery rates are shown at checkout, in pounds.
            </p>
          </details>
          <details>
            <summary>Care</summary>
            <p>Wash cold and hang dry. A hot wash will shrink cotton jersey.</p>
          </details>
        </div>
      </form>
    </div>
  );
}
