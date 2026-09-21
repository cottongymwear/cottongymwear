import Link from "next/link";
import { AUDIENCE_LABEL, CATEGORY_LABEL, formatGbp } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { ProductArt } from "./ProductArt";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <Link className="stretch" href={`/product/${product.slug}`}>
        <ProductArt
          category={product.category}
          swatch={product.colors[0]?.swatch ?? "#141414"}
          title=""
        />
        <div className="card-body">
          <p className="kicker">
            {AUDIENCE_LABEL[product.audience]} · {CATEGORY_LABEL[product.category]}
          </p>
          <h3>{product.name}</h3>
          <p className="meta">{product.summary}</p>
          <p className="price">{formatGbp(product.price)}</p>
          <ul className="chips">
            <li className={product.fabric.claim === "100" ? "chip chip--cotton" : "chip"}>
              {product.fabric.label}
            </li>
          </ul>
        </div>
      </Link>
    </article>
  );
}
