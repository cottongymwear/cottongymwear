import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShopView } from "@/components/ShopView";
import { isAudience, isCategory } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Men’s and women’s cotton gym wear. Tees, tanks, and a long sleeve, in 100% cotton solids.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string; category?: string }>;
}) {
  const params = await searchParams;
  if (isAudience(params.audience)) {
    redirect(isCategory(params.category) ? `/${params.audience}?category=${params.category}` : `/${params.audience}`);
  }
  return <ShopView audience="all" category={params.category} basePath="/shop" />;
}
