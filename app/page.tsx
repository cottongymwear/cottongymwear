import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getProduct } from "@/lib/catalog";

const FEATURED = [
  "mens-training-tee",
  "womens-relaxed-tee",
  "mens-muscle-tank",
  "warm-up-hoodie",
];

export default function HomePage() {
  const featured = FEATURED.flatMap((slug) => {
    const product = getProduct(slug);
    return product ? [product] : [];
  });

  return (
    <>
      <section className="hero">
        <div className="shell">
          <p className="eyebrow">Cotton gym wear · ships to the UK and the US</p>
          <h1>Cotton for the gym floor.</h1>
          <p className="lede">
            Tees, tanks, shorts, hoodies, and joggers, printed to order. Jersey solids are 100% cotton.
            Fleece layers are cotton-faced blends, and each product says which.
          </p>
          <div className="cta-row">
            <Link className="btn" href="/shop?audience=men">
              Shop men
            </Link>
            <Link className="btn btn--ghost" href="/shop?audience=women">
              Shop women
            </Link>
            <Link className="btn btn--ghost" href="/about">
              The cloth
            </Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <p className="eyebrow">Start here</p>
          <h2>A short rack</h2>
          <p className="note">Ten pieces for a soft launch. Placeholders stand in until Printful mockups are linked.</p>
          <div className="grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell prose">
          <h2>Made after you order</h2>
          <p>
            Nothing is printed until checkout. Orders go to Printful, who print the blank and ship it.
            UK addresses are the default. US addresses are accepted in the same checkout, still priced in pounds.
          </p>
          <p className="cta-row">
            <Link className="btn" href="/shop">
              Browse the shop
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
