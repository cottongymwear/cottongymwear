import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDeck } from "@/components/ProductDeck";
import { ProductDetail } from "@/components/ProductDetail";
import { AUDIENCE_LABEL, AUDIENCE_POSSESSIVE, CATALOG, getProduct, relatedProducts } from "@/lib/catalog";

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
    title: `${AUDIENCE_POSSESSIVE[product.audience]} ${product.name}`,
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
  const backHref = product.audience === "unisex" ? "/shop" : `/${product.audience}`;

  return (
    <>
      <article className="shell product-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href={backHref}>{product.audience === "unisex" ? "Shop all" : AUDIENCE_LABEL[product.audience]}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>
        <ProductDetail key={product.id} product={product} />
      </article>
      <ProductDeck products={relatedProducts(product)} title="Also on the rack" href="/shop" />
    </>
  );
}
