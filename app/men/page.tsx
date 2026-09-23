import type { Metadata } from "next";
import { ShopView } from "@/components/ShopView";

export const metadata: Metadata = {
  title: "Men",
  description: "Men’s cotton gym wear. Tees, a muscle tank, and a long sleeve in 100% cotton solids.",
};

export default async function MenPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return <ShopView audience="men" category={category} basePath="/men" />;
}
