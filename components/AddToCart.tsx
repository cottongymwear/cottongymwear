"use client";

import { useMemo, useState } from "react";
import { formatGbp } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { ProductArt } from "./ProductArt";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [colorId, setColorId] = useState(product.colors[0]?.id ?? "black");
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () => product.variants.find((entry) => entry.colorId === colorId && entry.size === size),
    [product.variants, colorId, size],
  );
  const color = product.colors.find((entry) => entry.id === colorId) ?? product.colors[0];

  return (
    <div className="product">
      <ProductArt
        category={product.category}
        swatch={color?.swatch ?? "#141414"}
        title={`${product.name} in ${color?.name ?? "black"}`}
      />
      <form
        className="buy"
        onSubmit={(event) => {
          event.preventDefault();
          if (!variant) return;
          add(variant.sku, quantity);
          setAdded(true);
        }}
      >
        <fieldset>
          <legend>Colour</legend>
          {product.colors.map((entry) => (
            <label className="choice" key={entry.id}>
              <input
                type="radio"
                name="color"
                value={entry.id}
                checked={colorId === entry.id}
                onChange={() => {
                  setColorId(entry.id);
                  setAdded(false);
                }}
              />
              <span>
                <i className="swatch" style={{ background: entry.swatch }} aria-hidden="true" />
                {entry.name}
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Size</legend>
          {product.sizes.map((entry) => (
            <label className="choice" key={entry}>
              <input
                type="radio"
                name="size"
                value={entry}
                checked={size === entry}
                onChange={() => {
                  setSize(entry);
                  setAdded(false);
                }}
              />
              <span>{entry}</span>
            </label>
          ))}
        </fieldset>
        <div className="qty">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            −
          </button>
          <span aria-live="polite">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((value) => Math.min(8, value + 1))}
          >
            +
          </button>
        </div>
        <button className="btn btn--full" type="submit" disabled={!variant}>
          Add to bag · {formatGbp(product.price)}
        </button>
        <p className="fine" role="status">
          {added ? "Added to your bag." : "Printed after you order. No stock sitting in a warehouse."}
        </p>
        <p className="fine">
          Ships to the UK and the US. Delivery is quoted at checkout in pounds.
        </p>
      </form>
    </div>
  );
}
