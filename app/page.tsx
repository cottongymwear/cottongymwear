import Link from "next/link";
import { Garment, garmentKind } from "@/components/Garment";
import { HeroArt } from "@/components/HeroArt";
import { ArrowIcon } from "@/components/Icons";
import { ProductDeck } from "@/components/ProductDeck";
import { CATALOG, CATEGORY_LABEL } from "@/lib/catalog";
import type { Category } from "@/lib/types";

const CUTS: { category: Category; colorId: string }[] = [
  { category: "tee", colorId: "white" },
  { category: "tank", colorId: "black" },
  { category: "long-sleeve", colorId: "navy" },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-copy">
          <p className="eyebrow">100% cotton · Printed to order</p>
          <h1 className="display">Cotton for lifting.</h1>
          <p className="lede">
            Tees, tanks, and long sleeves in pure cotton jersey. Black, White, and Navy. Shipped to the UK and
            the US.
          </p>
          <div className="cta-row">
            <Link className="btn btn--lg" href="/men">
              Shop men
            </Link>
            <Link className="btn btn--lg btn--secondary" href="/women">
              Shop women
            </Link>
          </div>
        </div>
        <div className="shell">
          <div className="hero-media">
            <HeroArt />
          </div>
        </div>
      </section>

      <ProductDeck products={CATALOG} eyebrow="Eight pieces" title="The rack" href="/shop" />

      <section className="section" aria-labelledby="cuts-title">
        <div className="shell section-head">
          <div>
            <p className="eyebrow">Shop by cut</p>
            <h2 id="cuts-title">Three cuts. One fibre.</h2>
          </div>
        </div>
        <div className="tiles">
          {CUTS.map(({ category, colorId }) => {
            const items = CATALOG.filter((item) => item.category === category);
            const lead = items[0];
            const swatch = lead.colors.find((color) => color.id === colorId)?.swatch ?? "#141414";
            return (
              <Link key={category} className="tile" href={`/shop?category=${category}`}>
                <svg viewBox="0 -10 400 500" aria-hidden="true" focusable="false">
                  <Garment
                    kind={garmentKind(lead)}
                    swatch={swatch}
                    transform="translate(200 240) scale(0.8) translate(-200 -240)"
                  />
                </svg>
                <span className="tile-label">
                  <span>
                    <strong>{CATEGORY_LABEL[category]}</strong>
                    <span className="muted">
                      {items.length} {items.length === 1 ? "style" : "styles"}
                    </span>
                  </span>
                  <span className="tile-arrow">
                    <ArrowIcon size={18} />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="statement" aria-labelledby="statement-title">
        <div className="shell statement-inner">
          <h2 id="statement-title">
            One fibre. Three colours. <span className="muted">No blends.</span>
          </h2>
          <p className="lede">
            Every piece is a Printful blank whose Black, White, and Navy are 100% cotton. Heather and triblend
            colourways on the same blanks contain polyester, so they stay off the rack.
          </p>
          <Link className="text-link" href="/about">
            About the cloth
          </Link>
        </div>
      </section>
    </>
  );
}
