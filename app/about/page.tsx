import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Cotton Gym Wear sells 100% cotton jersey for lifting and light training. Heather blends and poly fleece are not in the shop.",
};

export default function AboutPage() {
  return (
    <article className="shell section prose">
      <p className="eyebrow">Cotton Gym Wear</p>
      <h1>Cloth first.</h1>
      <p>
        Cotton Gym Wear is a direct shop for gym clothes in cotton. Prices are in pounds. The checkout
        ships to the United Kingdom and the United States.
      </p>
      <h2>What “100% cotton” means here</h2>
      <p>
        Each piece is a Printful blank whose solid colours are 100% cotton. Black, White, and Navy are
        the only colours sold. Heather, ash, sport grey, and triblend colourways on the same style codes
        contain polyester, so they are not listed.
      </p>
      <p>
        Shorts, joggers, hoodies, socks, and bras are not in this catalog. The Printful blanks commonly
        used for those cuts are cotton-poly blends. They come in only after a blank’s solid colour is
        verified 100% cotton.
      </p>
      <h2>What the clothes are for</h2>
      <p>
        Lifting, light training, and gym-to-street. The jersey is not a high-sweat polyester kit, and it
        is not sold as one.
      </p>
      <h2>How an order is made</h2>
      <p>
        You choose a size and a solid colour, pay in GBP, and Printful prints the shirt after checkout.
        There is no pile of finished stock. Until a Printful token and a Stripe key are set, checkout is
        a preview: no card charge, and no order sent to Printful.
      </p>
      <p>
        <Link className="btn" href="/shop">
          Shop the catalog
        </Link>
      </p>
    </article>
  );
}
