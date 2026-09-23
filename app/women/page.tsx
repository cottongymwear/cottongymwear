import type { Metadata } from "next";
import { ShopView } from "@/components/ShopView";

export const metadata: Metadata = {
  title: "Women",
  description: "Women’s cotton gym wear. A relaxed tee plus unisex tanks and tees in 100% cotton solids.",
};

export default async function WomenPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return <ShopView audience="women" category={category} basePath="/women" />;
}
