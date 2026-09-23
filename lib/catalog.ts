import type { Audience, Category, Product, Size } from "./types";

/**
 * Print-on-demand catalog. These are Printful blanks, not the Amazon shortlist.
 *
 * Every blank below is 100% cotton in Black, White, and Navy. Heather, ash,
 * sport grey, and triblend colourways on the same style codes are blends, so
 * they are not offered. Shorts, joggers, hoodies, socks, and bras stay off
 * this rack until a Printful blank for that cut is verified 100% cotton.
 *
 * Variant SKUs are the external ids to set in Printful. syncVariantId stays
 * null until that link exists.
 */

const COLORS = [
  { id: "black", name: "Black", swatch: "#141414" },
  { id: "white", name: "White", swatch: "#f7f4ee" },
  { id: "navy", name: "Navy", swatch: "#1b2744" },
] as const;

const MENS_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];
const WOMENS_SIZES: Size[] = ["XS", "S", "M", "L", "XL"];
const UNISEX_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

function variantsFor(productId: string, sizes: Size[]): Product["variants"] {
  const variants: Product["variants"] = [];
  for (const color of COLORS) {
    for (const size of sizes) {
      variants.push({
        sku: `${productId}-${color.id}-${size.toLowerCase()}`,
        color: color.name,
        colorId: color.id,
        size,
        catalogVariantId: null,
        syncVariantId: null,
      });
    }
  }
  return variants;
}

function product(input: Omit<Product, "colors" | "variants"> & { sizes: Size[] }): Product {
  return {
    ...input,
    colors: COLORS.map((color) => ({ ...color })),
    variants: variantsFor(input.id, input.sizes),
  };
}

const AIRLUME =
  "Solid colours are 100% Airlume combed and ring-spun cotton. Heather, ash, and triblend colours on this blank are polyester blends, so only Black, White, and Navy are sold.";

export const CATALOG: Product[] = [
  product({
    id: "cgw-mens-training-tee",
    slug: "mens-training-tee",
    name: "Training Tee",
    audience: "men",
    category: "tee",
    summary: "Light cotton crew for lifting and the walk out.",
    description:
      "A straight cotton crew with a bit of room through the chest. For the weight room and gym-to-street, not a race tee.",
    price: 3200,
    sizes: MENS_SIZES,
    fabric: {
      label: "100% cotton",
      detail: `Bella + Canvas 3001. ${AIRLUME}`,
      claim: "100",
    },
    printful: { catalogProductId: 71, blank: "Bella + Canvas 3001", technique: "dtg" },
  }),
  product({
    id: "cgw-mens-heavy-tee",
    slug: "mens-heavy-cotton-tee",
    name: "Heavy Cotton Tee",
    audience: "men",
    category: "tee",
    summary: "Midweight cotton jersey with a classic crew.",
    description:
      "A heavier cotton tee for people who want the shirt to feel planted under a bar. Still jersey, not fleece.",
    price: 2800,
    sizes: MENS_SIZES,
    fabric: {
      label: "100% cotton",
      detail:
        "Gildan 5000 Black, White, and Navy are 100% cotton. Sport Grey is 90/10, Ash Grey is 99/1, and heather colours are 50/50, so those colours are not sold.",
      claim: "100",
    },
    printful: { catalogProductId: 438, blank: "Gildan 5000", technique: "dtg" },
  }),
  product({
    id: "cgw-mens-v-neck",
    slug: "mens-v-neck-tee",
    name: "V-Neck Tee",
    audience: "men",
    category: "tee",
    neckline: "v",
    summary: "Cotton v-neck in the same jersey family as the crew.",
    description:
      "A deeper neckline for warmer rooms and lighter sessions. Cut like the men’s jersey, not a running singlet.",
    price: 3200,
    sizes: MENS_SIZES,
    fabric: {
      label: "100% cotton",
      detail: `Bella + Canvas 3005. Printful lists it as 100% combed and ring-spun cotton. ${AIRLUME}`,
      claim: "100",
    },
    printful: { catalogProductId: 223, blank: "Bella + Canvas 3005", technique: "dtg" },
  }),
  product({
    id: "cgw-muscle-tank",
    slug: "muscle-tank",
    name: "Muscle Tank",
    audience: "unisex",
    category: "tank",
    summary: "Sleeveless cotton jersey with a deeper armhole.",
    description:
      "Open at the shoulder for pressing and pulling. Light enough for a warm room, still cotton jersey rather than a mesh cardio kit.",
    price: 2800,
    sizes: UNISEX_SIZES,
    fabric: {
      label: "100% cotton",
      detail:
        "Bella + Canvas 3480 solid colours are 4.2 oz 100% Airlume combed and ring-spun cotton. Athletic heather is 90/10, dark grey heather and neon are 52/48, and triblends are poly/cotton/rayon. Only Black, White, and Navy are sold.",
      claim: "100",
    },
    printful: { catalogProductId: 248, blank: "Bella + Canvas 3480", technique: "dtg" },
  }),
  product({
    id: "cgw-womens-relaxed-tee",
    slug: "womens-relaxed-tee",
    name: "Relaxed Tee",
    audience: "women",
    category: "tee",
    summary: "Women’s relaxed cotton crew with a dropped shoulder.",
    description:
      "Enough ease to train in, plain enough to leave the gym in. A women’s jersey, not a compression top.",
    price: 3200,
    sizes: WOMENS_SIZES,
    fabric: {
      label: "100% cotton",
      detail: `Bella + Canvas 6400. ${AIRLUME}`,
      claim: "100",
    },
    printful: { catalogProductId: 360, blank: "Bella + Canvas 6400", technique: "dtg" },
  }),
  product({
    id: "cgw-softstyle-tee",
    slug: "softstyle-tee",
    name: "Softstyle Tee",
    audience: "unisex",
    category: "tee",
    summary: "Lighter ring-spun cotton with a smooth face.",
    description:
      "A thinner cotton crew for easy sessions and the rest of the day. Unisex sizing runs long through the body.",
    price: 2800,
    sizes: UNISEX_SIZES,
    fabric: {
      label: "100% cotton",
      detail:
        "Gildan 64000 solid colours, including Black, White, and Navy, are 100% ring-spun cotton. Sport Grey is 90/10 and Dark Heather is a polyester-majority blend, so they are not sold.",
      claim: "100",
    },
    printful: { catalogProductId: 12, blank: "Gildan 64000", technique: "dtg" },
  }),
  product({
    id: "cgw-heavyweight-tee",
    slug: "heavyweight-tee",
    name: "Heavyweight Tee",
    audience: "unisex",
    category: "tee",
    summary: "Garment-dyed heavyweight cotton with a broken-in hand.",
    description:
      "A heavier ringspun tee when you want cotton that feels substantial. Unisex. Pigment-dyed, not a poly fleece.",
    price: 3600,
    sizes: UNISEX_SIZES,
    fabric: {
      label: "100% cotton",
      detail:
        "Comfort Colors 1717 is 100% ring-spun cotton in Black, White, and Navy. Some heathered pigment colours on this blank include polyester, so they are not sold.",
      claim: "100",
    },
    printful: { catalogProductId: 586, blank: "Comfort Colors 1717", technique: "dtg" },
  }),
  product({
    id: "cgw-long-sleeve",
    slug: "long-sleeve-tee",
    name: "Long Sleeve",
    audience: "unisex",
    category: "long-sleeve",
    summary: "Cotton jersey long sleeve for cooler rooms.",
    description:
      "The same light cotton jersey as the crew, with sleeves. A layer for the walk in, not a sweatshirt.",
    price: 3800,
    sizes: UNISEX_SIZES,
    fabric: {
      label: "100% cotton",
      detail: `Bella + Canvas 3501, the long-sleeve 3001 jersey. ${AIRLUME}`,
      claim: "100",
    },
    printful: { catalogProductId: 356, blank: "Bella + Canvas 3501", technique: "dtg" },
  }),
];

export const CATEGORY_LABEL: Record<Category, string> = {
  tee: "Tees",
  tank: "Tanks",
  "long-sleeve": "Long sleeves",
};

export const CATEGORY_SINGULAR: Record<Category, string> = {
  tee: "Tee",
  tank: "Tank",
  "long-sleeve": "Long sleeve",
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};

export const AUDIENCE_POSSESSIVE: Record<Audience, string> = {
  men: "Men’s",
  women: "Women’s",
  unisex: "Unisex",
};

export function isAudience(value: unknown): value is "men" | "women" {
  return value === "men" || value === "women";
}

export function isCategory(value: unknown): value is Category {
  return value === "tee" || value === "tank" || value === "long-sleeve";
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameAudience = CATALOG.filter(
    (item) =>
      item.id !== product.id &&
      (product.audience === "unisex" || item.audience === product.audience || item.audience === "unisex"),
  );
  const rest = CATALOG.filter((item) => item.id !== product.id && !sameAudience.includes(item));
  return [...sameAudience, ...rest].slice(0, limit);
}

export function getProduct(slug: string): Product | undefined {
  return CATALOG.find((item) => item.slug === slug);
}

export function findVariant(sku: string) {
  for (const item of CATALOG) {
    const variant = item.variants.find((entry) => entry.sku === sku);
    if (variant) return { product: item, variant };
  }
  return undefined;
}

export function filterProducts(audience: string | undefined, category: string | undefined): Product[] {
  const audienceOk = isAudience(audience) ? audience : "all";
  const categoryOk = isCategory(category) ? category : "all";

  return CATALOG.filter((item) => {
    const matchesAudience =
      audienceOk === "all" || item.audience === audienceOk || item.audience === "unisex";
    const matchesCategory = categoryOk === "all" || item.category === categoryOk;
    return matchesAudience && matchesCategory;
  });
}

export function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}
