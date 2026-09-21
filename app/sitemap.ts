import type { MetadataRoute } from "next";
import { CATALOG } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  return [
    "",
    "/shop",
    "/about",
    ...CATALOG.map((product) => `/product/${product.slug}`),
  ].map((path) => ({
    url: `${site}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
