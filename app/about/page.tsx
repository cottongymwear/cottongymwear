import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Cotton Gym Wear sells 100% cotton jersey for lifting and light training. Heather blends and poly fleece are not in the shop.",
};

const SECTIONS = [
  {
    title: "What “100% cotton” means here",
    body: [
      "Each piece is a Printful blank whose solid colours are 100% cotton. Black, White, and Navy are the only colours sold. Heather, ash, sport grey, and triblend colourways on the same style codes contain polyester, so they are not listed.",
      "Shorts, joggers, hoodies, socks, and bras are not in this catalog. The Printful blanks commonly used for those cuts are cotton-poly blends. They come in only after a blank’s solid colour is verified 100% cotton.",
    ],
  },
  {
    title: "What the clothes are for",
    body: [
      "Lifting, light training, and gym-to-street. The jersey is not a high-sweat polyester kit, and it is not sold as one.",
    ],
  },
  {
    title: "How an order is made",
    body: [
      "You choose a size and a solid colour, pay in GBP, and Printful prints the piece after checkout. There is no pile of finished stock. Orders ship to the United Kingdom and the United States.",
      "Until a Printful token and a Stripe key are set, checkout is a preview: no card charge, and no order sent to Printful.",
    ],
  },
];

export default function AboutPage() {
  return (
    <article className="shell page about">
      <header className="page-head page-head--hero">
        <p className="eyebrow">About</p>
        <h1 className="display">Cloth first.</h1>
        <p className="lede">
          Cotton Gym Wear is a direct shop for gym clothes in cotton. Prices are in pounds. Checkout ships to the
          United Kingdom and the United States.
        </p>
      </header>
      <div className="about-sections">
        {SECTIONS.map((section) => (
          <section key={section.title} className="about-section">
            <h2>{section.title}</h2>
            <div>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="cta-row">
        <Link className="btn btn--lg" href="/shop">
          Shop the rack
        </Link>
      </div>
    </article>
  );
}
