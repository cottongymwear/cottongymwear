import Link from "next/link";
import { CATEGORY_LABEL, filterProducts, isCategory } from "@/lib/catalog";
import type { Category } from "@/lib/types";
import { ProductCard, rotatingColor } from "./ProductCard";

const CATEGORIES: Array<Category | "all"> = ["all", "tee", "tank", "long-sleeve"];

const COPY = {
  all: { title: "Shop all", lede: "Every piece on the rack. 100% cotton in Black, White, and Navy." },
  men: { title: "Men", lede: "Men’s cuts and unisex jersey. 100% cotton in Black, White, and Navy." },
  women: { title: "Women", lede: "Women’s cuts and unisex jersey. 100% cotton in Black, White, and Navy." },
};

export function ShopView({
  audience,
  category: rawCategory,
  basePath,
}: {
  audience: "all" | "men" | "women";
  category?: string;
  basePath: string;
}) {
  const category = isCategory(rawCategory) ? rawCategory : "all";
  const products = filterProducts(audience, category);
  const copy = COPY[audience];

  return (
    <div className="shell page">
      <header className="page-head">
        <h1>{copy.title}</h1>
        <p className="lede">{copy.lede}</p>
      </header>
      <div className="toolbar">
        <nav className="chips" aria-label="Filter by cut">
          {CATEGORIES.map((value) => (
            <Link
              key={value}
              href={value === "all" ? basePath : `${basePath}?category=${value}`}
              aria-current={category === value ? "true" : undefined}
              scroll={false}
            >
              {value === "all" ? "All" : CATEGORY_LABEL[value]}
            </Link>
          ))}
        </nav>
        <p className="muted toolbar-count">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
      </div>
      {products.length ? (
        <div className="grid">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} colorId={rotatingColor(product, index)} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-title">Nothing in this cut yet</p>
          <p className="muted">New cuts are added only once the blank is verified 100% cotton.</p>
          <Link className="btn" href={basePath}>
            See everything
          </Link>
        </div>
      )}
      {audience !== "all" ? (
        <p className="fine grid-note">Includes unisex pieces. Heather and triblend colourways are blends, so they are not sold.</p>
      ) : null}
    </div>
  );
}
