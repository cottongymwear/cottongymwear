"use client";

import Link from "next/link";
import { AUDIENCE_POSSESSIVE, formatGbp } from "@/lib/catalog";
import type { CatalogVariant, Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { MinusIcon, PlusIcon } from "./Icons";
import { ProductArt } from "./ProductArt";

export function BagLine({
  product,
  variant,
  quantity,
  onNavigate,
}: {
  product: Product;
  variant: CatalogVariant;
  quantity: number;
  onNavigate?: () => void;
}) {
  const { setQuantity, remove } = useCart();
  const label = `${product.name}, ${variant.color}, size ${variant.size}`;

  return (
    <li className="bag-line">
      <Link href={`/product/${product.slug}`} className="bag-thumb" tabIndex={-1} aria-hidden="true" onClick={onNavigate}>
        <ProductArt product={product} colorId={variant.colorId} className="art art--thumb" />
      </Link>
      <div className="bag-line-body">
        <div className="bag-line-top">
          <div>
            <Link href={`/product/${product.slug}`} className="bag-line-name" onClick={onNavigate}>
              {product.name}
            </Link>
            <p className="bag-line-meta">
              {AUDIENCE_POSSESSIVE[product.audience]} · {variant.color} · {variant.size}
            </p>
          </div>
          <p className="bag-line-price">{formatGbp(product.price * quantity)}</p>
        </div>
        <div className="bag-line-actions">
          <div className="stepper" role="group" aria-label={`Quantity of ${label}`}>
            <button
              type="button"
              aria-label={quantity === 1 ? `Remove ${label}` : `Decrease quantity of ${label}`}
              onClick={() => setQuantity(variant.sku, quantity - 1)}
            >
              <MinusIcon size={16} />
            </button>
            <output aria-live="polite">{quantity}</output>
            <button
              type="button"
              aria-label={`Increase quantity of ${label}`}
              disabled={quantity >= 8}
              onClick={() => setQuantity(variant.sku, quantity + 1)}
            >
              <PlusIcon size={16} />
            </button>
          </div>
          <button type="button" className="text-btn" onClick={() => remove(variant.sku)}>
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
