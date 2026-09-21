import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORY_LABEL, filterProducts } from "@/lib/catalog";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop",
  description: "Men’s and women’s cotton gym wear. Tees, tanks, and a long sleeve, in 100% cotton solids.",
};

const CATEGORIES: Array<Category | "all"> = ["all", "tee", "tank", "long-sleeve"];

function shopHref(audience: string, category: string) {
  const params = new URLSearchParams();
  if (audience !== "all") params.set("audience", audience);
  if (category !== "all") params.set("category", category);
  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string; category?: string }>;
}) {
  const params = await searchParams;
  const audience = params.audience === "men" || params.audience === "women" ? params.audience : "all";
  const category = CATEGORIES.includes(params.category as Category) ? (params.category as Category) : "all";
  const products = filterProducts(audience, category);

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">Catalog</p>
        <h1>Shop</h1>
        <p className="lede">
          Men’s and women’s cuts, plus unisex jersey. Every solid here is 100% cotton. Filters stay in the
          address bar.
        </p>
        <div className="filters" aria-label="Audience">
          {(["all", "men", "women"] as const).map((value) => (
            <Link key={value} href={shopHref(value, category)} aria-current={audience === value ? "true" : undefined}>
              {value === "all" ? "All" : value === "men" ? "Men" : "Women"}
            </Link>
          ))}
        </div>
        <div className="filters" aria-label="Category">
          {CATEGORIES.map((value) => (
            <Link key={value} href={shopHref(audience, value)} aria-current={category === value ? "true" : undefined}>
              {value === "all" ? "All pieces" : CATEGORY_LABEL[value]}
            </Link>
          ))}
        </div>
        <p className="fine">Men and Women include unisex pieces. Only Black, White, and Navy — not heather blends.</p>
        {products.length ? (
          <div className="grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="lede">Nothing in this filter. Try another cut.</p>
        )}
      </div>
    </section>
  );
}
