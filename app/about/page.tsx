import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Cotton Gym Wear is a direct print-on-demand shop. Jersey is 100% cotton. Fleece is labeled as a blend.",
};

export default function AboutPage() {
  return (
    <article className="shell section prose">
      <p className="eyebrow">Cotton Gym Wear</p>
      <h1>Cloth first.</h1>
      <p>
        Cotton Gym Wear is a small direct shop for gym clothes in cotton. The owner is in London. The shop
        prices in pounds and ships to the United Kingdom and the United States.
      </p>
      <h2>What “cotton” means here</h2>
      <p>
        Tees and tanks use jersey blanks whose solid colours are 100% cotton. Heather colourways on those
        same blanks are polyester blends, so they are not in the catalog.
      </p>
      <p>
        Shorts, the hoodie, and the joggers are cotton-faced fleece. The mills blend in polyester for the
        inside. Those products are labeled with the blend. They are not sold as 100% cotton.
      </p>
      <h2>How an order is made</h2>
      <p>
        You choose a size and a solid colour, pay in GBP, and the order is printed by Printful after
        checkout. There is no shop floor of finished stock. UK delivery is the path we expect most often;
        a US address uses the same checkout.
      </p>
      <p>
        Until a Printful token and Stripe key are set, the shop runs on this sample catalog and a preview
        checkout that does not charge a card.
      </p>
      <p>
        <Link className="btn" href="/shop">
          Shop the catalog
        </Link>
      </p>
    </article>
  );
}
