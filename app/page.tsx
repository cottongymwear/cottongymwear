import Link from "next/link";
import { ProductDeck } from "@/components/ProductDeck";
import { CATALOG } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell">
          <p className="eyebrow">100% cotton solids · ships to the UK and the US</p>
          <h1>Cotton for lifting.</h1>
          <p className="lede">
            Tees and tanks in cotton jersey, printed after you order. For the weight room and the walk
            out — not a polyester cardio kit.
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
      <ProductDeck products={CATALOG} />
      <section className="section">
        <div className="shell prose">
          <h2>Printed after checkout</h2>
          <p>
            Printful prints the blank and ships it. United Kingdom addresses are the default. United
            States addresses use the same checkout, still priced in pounds.
          </p>
          <p>
            Heather colourways on these blanks are blends, so they are not in the shop. Fleece shorts,
            hoodies, and joggers stay off the rack until a blank is verified 100% cotton.
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
