import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { AUDIENCE_LABEL, CATALOG, formatGbp, getProduct } from "@/lib/catalog";

export function generateStaticParams() {
  return CATALOG.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product" };
  return {
    title: `${AUDIENCE_LABEL[product.audience]} ${product.name}`,
    description: product.summary,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${AUDIENCE_LABEL[product.audience]} ${product.name}`,
    description: product.description,
    brand: { "@type": "Brand", name: "Cotton Gym Wear" },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: (product.price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <article className="shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="section" style={{ paddingBottom: 0 }}>
        <p className="eyebrow">
          {AUDIENCE_LABEL[product.audience]} · {formatGbp(product.price)}
        </p>
        <h1>{product.name}</h1>
        <p className="lede">{product.description}</p>
        <ul className="chips">
          <li className={product.fabric.claim === "100" ? "chip chip--cotton" : "chip"}>{product.fabric.label}</li>
          <li className="chip">{product.printful.blank}</li>
        </ul>
      </div>
      <AddToCart product={product} />
      <div className="prose">
        <h2>Cloth</h2>
        <p>{product.fabric.detail}</p>
        <p>Wash cold and hang dry. A hot wash will shrink cotton jersey.</p>
        <p>
          <Link href="/shop">Back to the shop</Link>
        </p>
      </div>
    </article>
  );
}
