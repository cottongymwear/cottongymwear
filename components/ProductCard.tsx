import Link from "next/link";
import { AUDIENCE_POSSESSIVE, CATEGORY_SINGULAR, formatGbp } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { ProductArt } from "./ProductArt";

export function ProductCard({ product, colorId }: { product: Product; colorId?: string }) {
  return (
    <article className="pcard">
      <Link
        className="pcard-link"
        href={colorId && colorId !== product.colors[0]?.id ? `/product/${product.slug}?color=${colorId}` : `/product/${product.slug}`}
      >
        <ProductArt product={product} colorId={colorId} className="art pcard-media" />
        <div className="pcard-info">
          <h3 className="pcard-name">{product.name}</h3>
          <p className="pcard-sub">
            {AUDIENCE_POSSESSIVE[product.audience]} {CATEGORY_SINGULAR[product.category].toLowerCase()}
          </p>
          <div className="pcard-foot">
            <span className="pcard-price">{formatGbp(product.price)}</span>
            <span className="swatches" aria-label={`${product.colors.length} colours`}>
              {product.colors.map((color) => (
                <i key={color.id} style={{ background: color.swatch }} title={color.name} />
              ))}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Alternates the colour shown across a row so a grid is not a wall of one colour. */
export function rotatingColor(product: Product, index: number): string | undefined {
  return product.colors[index % product.colors.length]?.id;
}
